import { writeFile } from "fs/promises";
import { join } from "path";
import {
  createAggregateResponse,
  createFailedTestResult,
  createTestResultFromRunner,
  EXECUTION_TIMEOUT_MS,
  parseLastJsonLine,
  roundMs,
  runProcess,
  withWorkspace
} from "@/lib/code-execution/shared";
import type { CodeRunResponse, CodeTestResult } from "@/types/code-execution";
import type { CodingProblem, CodingProblemTestCase } from "@/types/problem";

const pythonRunnerSource = String.raw`
import ast
import contextlib
import io
import json
import sys
import time

candidate_path = sys.argv[1]
payload = json.loads(sys.argv[2])

blocked_calls = {"__import__", "compile", "eval", "exec", "input", "open"}

with open(candidate_path, "r", encoding="utf-8") as file:
    source = file.read()

try:
    tree = ast.parse(source, filename="candidate.py")
except SyntaxError as error:
    print(json.dumps({
        "type": "syntax_error",
        "error": f"{error.msg} at line {error.lineno}, column {error.offset}"
    }))
    sys.exit(0)

for node in ast.walk(tree):
    if isinstance(node, (ast.Import, ast.ImportFrom)):
        print(json.dumps({
            "type": "blocked",
            "error": "Import statements are disabled in this coding sandbox."
        }))
        sys.exit(0)
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in blocked_calls:
        print(json.dumps({
            "type": "blocked",
            "error": f"Use of {node.func.id}() is disabled in this coding sandbox."
        }))
        sys.exit(0)

safe_builtins = {
    "abs": abs,
    "all": all,
    "any": any,
    "bool": bool,
    "dict": dict,
    "enumerate": enumerate,
    "filter": filter,
    "float": float,
    "int": int,
    "len": len,
    "list": list,
    "map": map,
    "max": max,
    "min": min,
    "print": print,
    "range": range,
    "reversed": reversed,
    "set": set,
    "sorted": sorted,
    "str": str,
    "sum": sum,
    "tuple": tuple,
    "zip": zip,
}

namespace = {"__builtins__": safe_builtins}
captured_stdout = io.StringIO()

try:
    with contextlib.redirect_stdout(captured_stdout):
        exec(compile(tree, "candidate.py", "exec"), namespace)
        solution = namespace.get(payload["functionName"]["snake"]) or namespace.get(payload["functionName"]["camel"])
        if not callable(solution):
            raise NameError(f"Define a callable {payload['functionName']['snake']} function.")

        started_at = time.perf_counter()
        actual = solution(*payload["args"])
        runtime_ms = round((time.perf_counter() - started_at) * 1000, 2)

    print(json.dumps({
        "type": "success",
        "actual": actual,
        "runtimeMs": runtime_ms,
        "stdout": captured_stdout.getvalue()
    }))
except Exception as error:
    print(json.dumps({
        "type": "runtime_error",
        "error": f"{error.__class__.__name__}: {error}",
        "stdout": captured_stdout.getvalue()
    }))
`;

export async function runPythonCode(code: string, problem: CodingProblem): Promise<CodeRunResponse> {
  return withWorkspace("umao-python", async (workspace) => {
    const candidatePath = join(workspace, "candidate.py");
    const runnerPath = join(workspace, "runner.py");
    const startedAt = performance.now();

    await writeFile(candidatePath, code, "utf-8");
    await writeFile(runnerPath, pythonRunnerSource, "utf-8");

    const results: CodeTestResult[] = [];

    for (const testCase of problem.testCases) {
      results.push(await runPythonTestCase(runnerPath, candidatePath, testCase, problem));
    }

    return createAggregateResponse({
      language: "Python",
      results,
      runtimeMs: performance.now() - startedAt,
      stdout: results.map((result) => result.stdout).filter(Boolean).join("\n")
    });
  });
}

async function runPythonTestCase(
  runnerPath: string,
  candidatePath: string,
  testCase: CodingProblemTestCase,
  problem: CodingProblem
): Promise<CodeTestResult> {
  const startedAt = performance.now();
  const input = JSON.stringify({
    args: testCase.input,
    functionName: problem.functionName
  });
  const execution = await runProcess("python3", ["-I", "-S", runnerPath, candidatePath, input], {
    cwd: workspaceFromPath(runnerPath),
    timeoutMs: EXECUTION_TIMEOUT_MS
  });
  const runtimeMs = roundMs(performance.now() - startedAt);

  if (execution.timedOut) {
    return createFailedTestResult({
      error: "Execution timed out.",
      runtimeMs,
      stdout: execution.stdout,
      testCase,
      timedOut: true
    });
  }

  if (execution.stderr.trim()) {
    return createFailedTestResult({
      error: execution.stderr.trim(),
      runtimeMs,
      stdout: execution.stdout,
      testCase
    });
  }

  return createTestResultFromRunner({
    output: parseLastJsonLine(execution.stdout),
    runtimeMs,
    testCase
  });
}

function workspaceFromPath(filePath: string) {
  return filePath.split("/").slice(0, -1).join("/");
}
