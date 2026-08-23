import { randomUUID } from "crypto";
import { spawn } from "child_process";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import type { CodeRunResponse, CodeTestResult, SupportedExecutionLanguage } from "@/types/code-execution";
import type { CodingProblem, CodingProblemTestCase } from "@/types/problem";

export const EXECUTION_TIMEOUT_MS = 2200;
export const COMPILE_TIMEOUT_MS = 8000;
export const MAX_OUTPUT_BYTES = 64_000;

export type RunnerInput = {
  code: string;
  language: SupportedExecutionLanguage;
  problem: CodingProblem;
};

export type RunnerProcessResult = {
  exitCode: number | null;
  stderr: string;
  stdout: string;
  timedOut: boolean;
};

export type RunnerJsonOutput =
  | {
      actual?: unknown;
      error?: string;
      runtimeMs?: number;
      stdout?: string;
      timedOut?: boolean;
      type: "success" | "syntax_error" | "runtime_error" | "blocked";
    }
  | null;

export type CompiledRunnerOutput = {
  error?: string;
  results?: RunnerJsonOutput[];
  stdout: string;
  timedOut: boolean;
};

export async function withWorkspace<T>(prefix: string, work: (workspace: string) => Promise<T>) {
  const workspace = await mkdtemp(join(tmpdir(), `${prefix}-${randomUUID()}-`));

  try {
    return await work(workspace);
  } finally {
    await rm(workspace, { force: true, recursive: true });
  }
}

export function runProcess(
  command: string,
  args: string[],
  options: {
    cwd: string;
    timeoutMs: number;
  }
): Promise<RunnerProcessResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: getRunnerEnvironment(),
      shell: false,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      settled = true;
      child.kill("SIGKILL");
      resolve({ exitCode: null, stdout, stderr, timedOut: true });
    }, options.timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout = appendBoundedOutput(stdout, chunk);
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr = appendBoundedOutput(stderr, chunk);
    });

    child.on("error", (error) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        resolve({ exitCode: null, stdout, stderr: error.message, timedOut: false });
      }
    });

    child.on("close", (exitCode) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        resolve({ exitCode, stdout, stderr, timedOut: false });
      }
    });
  });
}

export function createAggregateResponse({
  language,
  results,
  runtimeMs,
  stdout
}: {
  language: SupportedExecutionLanguage;
  results: CodeTestResult[];
  runtimeMs: number;
  stdout: string;
}): CodeRunResponse {
  const firstError = results.find((result) => result.error)?.error;

  return {
    error: firstError,
    language,
    passed: results.length > 0 && results.every((result) => result.passed),
    results,
    runtimeMs: roundMs(runtimeMs),
    stdout
  };
}

export function createCompileErrorResponse({
  error,
  language,
  problem,
  runtimeMs,
  timedOut
}: {
  error: string;
  language: SupportedExecutionLanguage;
  problem: CodingProblem;
  runtimeMs: number;
  timedOut?: boolean;
}): CodeRunResponse {
  const results = problem.testCases.map((testCase) =>
    createFailedTestResult({
      error,
      runtimeMs: roundMs(runtimeMs),
      testCase,
      timedOut
    })
  );

  return createAggregateResponse({
    language,
    results,
    runtimeMs,
    stdout: ""
  });
}

export function createFailedTestResult({
  actual = "",
  error,
  runtimeMs,
  stdout = "",
  testCase,
  timedOut = false
}: {
  actual?: string;
  error: string;
  runtimeMs: number;
  stdout?: string;
  testCase: CodingProblemTestCase;
  timedOut?: boolean;
}): CodeTestResult {
  return {
    actual,
    error,
    expected: stringifyValue(testCase.expected),
    input: stringifyValue(testCase.input),
    name: testCase.name,
    passed: false,
    runtimeMs: roundMs(runtimeMs),
    stdout,
    timedOut
  };
}

export function createTestResultFromRunner({
  output,
  runtimeMs,
  stdout,
  testCase
}: {
  output: RunnerJsonOutput;
  runtimeMs: number;
  stdout?: string;
  testCase: CodingProblemTestCase;
}): CodeTestResult {
  if (!output || output.type !== "success") {
    return createFailedTestResult({
      actual: output?.actual === undefined ? "" : stringifyValue(output.actual),
      error: output?.error ?? "Runner returned an invalid response.",
      runtimeMs,
      stdout: output?.stdout ?? stdout ?? "",
      testCase,
      timedOut: output?.timedOut ?? false
    });
  }

  const actual = output.actual;
  const passed = stringifyValue(actual) === stringifyValue(testCase.expected);

  return {
    actual: stringifyValue(actual),
    error: passed ? undefined : "Output did not match expected result.",
    expected: stringifyValue(testCase.expected),
    input: stringifyValue(testCase.input),
    name: testCase.name,
    passed,
    runtimeMs: roundMs(output.runtimeMs ?? runtimeMs),
    stdout: output.stdout ?? stdout ?? ""
  };
}

export function parseLastJsonLine(stdout: string): RunnerJsonOutput {
  const lastLine = stdout.trim().split("\n").at(-1);

  if (!lastLine) {
    return null;
  }

  try {
    return JSON.parse(lastLine) as RunnerJsonOutput;
  } catch {
    return null;
  }
}

export function parsePrefixedJsonLines(stdout: string, prefix: string) {
  return stdout
    .split("\n")
    .filter((line) => line.startsWith(prefix))
    .map((line) => {
      try {
        return JSON.parse(line.slice(prefix.length)) as RunnerJsonOutput;
      } catch {
        return null;
      }
    });
}

export function getUserStdout(stdout: string, prefix: string) {
  return stdout
    .split("\n")
    .filter((line) => line && !line.startsWith(prefix))
    .join("\n");
}

export function roundMs(value: number) {
  return Math.round(value * 100) / 100;
}

export function stringifyValue(value: unknown) {
  return JSON.stringify(value);
}

function appendBoundedOutput(current: string, chunk: Buffer) {
  const next = current + chunk.toString("utf-8");

  if (Buffer.byteLength(next, "utf-8") <= MAX_OUTPUT_BYTES) {
    return next;
  }

  return `${next.slice(0, MAX_OUTPUT_BYTES)}\n[output truncated]`;
}

function getRunnerEnvironment() {
  return {
    HOME: tmpdir(),
    NODE_ENV: process.env.NODE_ENV ?? "production",
    PATH: process.env.PATH ?? "/usr/bin:/bin:/usr/local/bin",
    PYTHONIOENCODING: "utf-8"
  };
}
