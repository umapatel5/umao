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

const javascriptRunnerSource = String.raw`
const fs = require("fs");
const vm = require("vm");
const { performance } = require("perf_hooks");

const candidatePath = process.argv[2];
const payload = JSON.parse(process.argv[3]);
const source = fs.readFileSync(candidatePath, "utf8");
const captured = [];
const context = {
  console: {
    log: (...args) => captured.push(args.map(String).join(" ")),
    error: (...args) => captured.push(args.map(String).join(" "))
  }
};

context.globalThis = context;

try {
  if (/\\b(import|require)\\b/.test(source)) {
    throw new Error("Imports and require() are disabled in this coding sandbox.");
  }

  vm.createContext(context, {
    codeGeneration: {
      strings: false,
      wasm: false
    }
  });
  new vm.Script(source, { filename: "candidate.js" }).runInContext(context, {
    timeout: 1000
  });

  context.__args = payload.args;
  const functionName = context[payload.functionName.camel] ? payload.functionName.camel : payload.functionName.snake;

  if (typeof context[functionName] !== "function") {
    throw new Error("Define a callable " + payload.functionName.camel + " function.");
  }

  const startedAt = performance.now();
  new vm.Script("globalThis.__actual = " + functionName + "(...globalThis.__args);").runInContext(context, {
    timeout: 1000
  });
  const runtimeMs = Math.round((performance.now() - startedAt) * 100) / 100;

  console.log(JSON.stringify({
    type: "success",
    actual: context.__actual,
    runtimeMs,
    stdout: captured.join("\\n")
  }));
} catch (error) {
  const isTimeout = error && /timed out/i.test(error.message);
  console.log(JSON.stringify({
    type: error && error.name === "SyntaxError" ? "syntax_error" : "runtime_error",
    error: isTimeout ? "Execution timed out." : error.name + ": " + error.message,
    timedOut: Boolean(isTimeout),
    stdout: captured.join("\\n")
  }));
}
`;

export async function runJavaScriptCode(code: string, problem: CodingProblem): Promise<CodeRunResponse> {
  return withWorkspace("umao-javascript", async (workspace) => {
    const candidatePath = join(workspace, "candidate.js");
    const runnerPath = join(workspace, "runner.cjs");
    const startedAt = performance.now();

    await writeFile(candidatePath, code, "utf-8");
    await writeFile(runnerPath, javascriptRunnerSource, "utf-8");

    const results: CodeTestResult[] = [];

    for (const testCase of problem.testCases) {
      results.push(await runJavaScriptTestCase(runnerPath, candidatePath, testCase, problem));
    }

    return createAggregateResponse({
      language: "JavaScript",
      results,
      runtimeMs: performance.now() - startedAt,
      stdout: results.map((result) => result.stdout).filter(Boolean).join("\n")
    });
  });
}

async function runJavaScriptTestCase(
  runnerPath: string,
  candidatePath: string,
  testCase: CodingProblemTestCase,
  problem: CodingProblem
) {
  const startedAt = performance.now();
  const execution = await runProcess("node", [
    runnerPath,
    candidatePath,
    JSON.stringify({
      args: testCase.input,
      functionName: problem.functionName
    })
  ], {
    cwd: runnerPath.split("/").slice(0, -1).join("/"),
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
