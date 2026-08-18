import { randomUUID } from "crypto";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { spawn } from "child_process";
import { NextResponse } from "next/server";
import type {
  CodeRunRequest,
  CodeRunResponse,
  CodeTestResult,
  SupportedExecutionLanguage
} from "@/types/code-execution";

export const runtime = "nodejs";

const PYTHON_TIMEOUT_MS = 2200;
const MAX_CODE_LENGTH = 20_000;

const pythonTestCases = [
  {
    name: "Basic pair",
    nums: [2, 7, 11, 15],
    target: 9,
    expected: [0, 1]
  },
  {
    name: "Middle pair",
    nums: [3, 2, 4],
    target: 6,
    expected: [1, 2]
  },
  {
    name: "Duplicate values",
    nums: [3, 3],
    target: 6,
    expected: [0, 1]
  }
];

const runnerSource = String.raw`
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
        solution = namespace.get("two_sum") or namespace.get("twoSum")
        if not callable(solution):
            raise NameError("Define a callable two_sum(nums, target) function.")

        started_at = time.perf_counter()
        actual = solution(payload["nums"], payload["target"])
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

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<CodeRunRequest> | null;

  if (!body || typeof body.code !== "string" || typeof body.language !== "string") {
    return NextResponse.json({ error: "Expected language and code." }, { status: 400 });
  }

  if (!isSupportedLanguage(body.language)) {
    return NextResponse.json({ error: "Unsupported language." }, { status: 400 });
  }

  if (body.code.length > MAX_CODE_LENGTH) {
    return NextResponse.json(
      { error: `Code is too large. Limit is ${MAX_CODE_LENGTH} characters.` },
      { status: 413 }
    );
  }

  if (body.language !== "Python") {
    return NextResponse.json<CodeRunResponse>(
      {
        language: body.language,
        passed: false,
        runtimeMs: 0,
        stdout: "",
        error: `${body.language} execution is not implemented yet. Python is supported first.`,
        results: []
      },
      { status: 501 }
    );
  }

  const response = await runPythonCode(body.code);
  return NextResponse.json(response, { status: response.error && response.results.length === 0 ? 400 : 200 });
}

function isSupportedLanguage(language: string): language is SupportedExecutionLanguage {
  return ["Python", "Java", "C++", "JavaScript"].includes(language);
}

async function runPythonCode(code: string): Promise<CodeRunResponse> {
  const runId = randomUUID();
  const workspace = await mkdtemp(join(tmpdir(), `umao-code-${runId}-`));
  const candidatePath = join(workspace, "candidate.py");
  const runnerPath = join(workspace, "runner.py");
  const startedAt = performance.now();

  try {
    await writeFile(candidatePath, code, "utf-8");
    await writeFile(runnerPath, runnerSource, "utf-8");

    const results: CodeTestResult[] = [];

    for (const testCase of pythonTestCases) {
      results.push(await runPythonTestCase(runnerPath, candidatePath, testCase));
    }

    const runtimeMs = roundMs(performance.now() - startedAt);
    const stdout = results.map((result) => result.stdout).filter(Boolean).join("\n");
    const firstError = results.find((result) => result.error)?.error;

    return {
      language: "Python",
      passed: results.every((result) => result.passed),
      runtimeMs,
      stdout,
      error: firstError,
      results
    };
  } finally {
    await rm(workspace, { force: true, recursive: true });
  }
}

async function runPythonTestCase(
  runnerPath: string,
  candidatePath: string,
  testCase: (typeof pythonTestCases)[number]
): Promise<CodeTestResult> {
  const startedAt = performance.now();
  const input = JSON.stringify({ nums: testCase.nums, target: testCase.target });

  const execution = await executePythonProcess(runnerPath, candidatePath, input);
  const runtimeMs = roundMs(performance.now() - startedAt);

  if (execution.timedOut) {
    return {
      name: testCase.name,
      input,
      expected: JSON.stringify(testCase.expected),
      actual: "",
      passed: false,
      runtimeMs,
      stdout: execution.stdout,
      error: "Execution timed out.",
      timedOut: true
    };
  }

  if (execution.stderr.trim()) {
    return {
      name: testCase.name,
      input,
      expected: JSON.stringify(testCase.expected),
      actual: "",
      passed: false,
      runtimeMs,
      stdout: execution.stdout,
      error: execution.stderr.trim()
    };
  }

  const parsed = parseRunnerOutput(execution.stdout);

  if (!parsed || parsed.type !== "success") {
    return {
      name: testCase.name,
      input,
      expected: JSON.stringify(testCase.expected),
      actual: parsed?.actual ? JSON.stringify(parsed.actual) : "",
      passed: false,
      runtimeMs,
      stdout: parsed?.stdout ?? "",
      error: parsed?.error ?? "Runner returned an invalid response."
    };
  }

  const actual = Array.isArray(parsed.actual) ? parsed.actual : [];
  const passed = JSON.stringify(actual) === JSON.stringify(testCase.expected);

  return {
    name: testCase.name,
    input,
    expected: JSON.stringify(testCase.expected),
    actual: JSON.stringify(actual),
    passed,
    runtimeMs: parsed.runtimeMs ?? runtimeMs,
    stdout: parsed.stdout ?? "",
    error: passed ? undefined : "Output did not match expected result."
  };
}

function executePythonProcess(
  runnerPath: string,
  candidatePath: string,
  input: string
): Promise<{ stdout: string; stderr: string; timedOut: boolean }> {
  return new Promise((resolve) => {
    const child = spawn("python3", ["-I", "-S", runnerPath, candidatePath, input], {
      cwd: tmpdir(),
      env: {
        NODE_ENV: process.env.NODE_ENV ?? "production",
        PATH: process.env.PATH ?? "/usr/bin:/bin:/usr/local/bin",
        PYTHONIOENCODING: "utf-8"
      },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      settled = true;
      child.kill("SIGKILL");
      resolve({ stdout, stderr, timedOut: true });
    }, PYTHON_TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf-8");
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf-8");
    });

    child.on("error", (error) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        resolve({ stdout, stderr: error.message, timedOut: false });
      }
    });

    child.on("close", () => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        resolve({ stdout, stderr, timedOut: false });
      }
    });
  });
}

function parseRunnerOutput(stdout: string):
  | {
      type: "success" | "syntax_error" | "runtime_error" | "blocked";
      actual?: unknown;
      runtimeMs?: number;
      stdout?: string;
      error?: string;
    }
  | null {
  const lastLine = stdout.trim().split("\n").at(-1);

  if (!lastLine) {
    return null;
  }

  try {
    return JSON.parse(lastLine);
  } catch {
    return null;
  }
}

function roundMs(value: number) {
  return Math.round(value * 100) / 100;
}
