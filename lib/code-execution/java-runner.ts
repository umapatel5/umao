import { writeFile } from "fs/promises";
import { join } from "path";
import {
  COMPILE_TIMEOUT_MS,
  createAggregateResponse,
  createCompileErrorResponse,
  createFailedTestResult,
  createTestResultFromRunner,
  EXECUTION_TIMEOUT_MS,
  getUserStdout,
  parsePrefixedJsonLines,
  roundMs,
  runProcess,
  withWorkspace
} from "@/lib/code-execution/shared";
import type { CodeRunResponse } from "@/types/code-execution";
import type { CodingProblem, CodingProblemTestCase } from "@/types/problem";

const RESULT_PREFIX = "__UMAO_RESULT__";

export async function runJavaCode(code: string, problem: CodingProblem): Promise<CodeRunResponse> {
  return withWorkspace("umao-java", async (workspace) => {
    const startedAt = performance.now();
    const solutionPath = join(workspace, "Solution.java");
    const runnerPath = join(workspace, "TestRunner.java");

    await writeFile(solutionPath, code, "utf-8");
    await writeFile(runnerPath, createJavaRunnerSource(problem), "utf-8");

    const compile = await runProcess("javac", ["Solution.java", "TestRunner.java"], {
      cwd: workspace,
      timeoutMs: COMPILE_TIMEOUT_MS
    });

    if (compile.timedOut || compile.exitCode !== 0) {
      return createCompileErrorResponse({
        error: compile.timedOut ? "Compilation timed out." : compile.stderr.trim() || compile.stdout.trim(),
        language: "Java",
        problem,
        runtimeMs: performance.now() - startedAt,
        timedOut: compile.timedOut
      });
    }

    const execution = await runProcess("java", ["-Xmx64m", "TestRunner"], {
      cwd: workspace,
      timeoutMs: EXECUTION_TIMEOUT_MS
    });
    const runtimeMs = performance.now() - startedAt;
    const userStdout = getUserStdout(execution.stdout, RESULT_PREFIX);

    if (execution.timedOut) {
      return createAggregateResponse({
        language: "Java",
        results: problem.testCases.map((testCase) =>
          createFailedTestResult({
            error: "Execution timed out.",
            runtimeMs,
            stdout: userStdout,
            testCase,
            timedOut: true
          })
        ),
        runtimeMs,
        stdout: userStdout
      });
    }

    const outputs = parsePrefixedJsonLines(execution.stdout, RESULT_PREFIX);
    const results = problem.testCases.map((testCase, index) =>
      createTestResultFromRunner({
        output: outputs[index] ?? {
          error: execution.stderr.trim() || "Runner returned an invalid response.",
          type: "runtime_error"
        },
        runtimeMs,
        stdout: userStdout,
        testCase
      })
    );

    return createAggregateResponse({
      language: "Java",
      results,
      runtimeMs,
      stdout: userStdout
    });
  });
}

function createJavaRunnerSource(problem: CodingProblem) {
  const calls = problem.testCases.map((testCase) => createJavaTestCall(problem, testCase)).join("\n");

  return `
import java.util.*;

public class TestRunner {
  interface CaseCallable {
    Object run() throws Exception;
  }

  public static void main(String[] args) {
    Solution solution = new Solution();
${calls}
  }

  static void runCase(CaseCallable callable) {
    try {
      long startedAt = System.nanoTime();
      Object actual = callable.run();
      double runtimeMs = Math.round(((System.nanoTime() - startedAt) / 1_000_000.0) * 100.0) / 100.0;
      emit("{\\"type\\":\\"success\\",\\"actual\\":" + toJson(actual) + ",\\"runtimeMs\\":" + runtimeMs + ",\\"stdout\\":\\"\\"}");
    } catch (Throwable error) {
      emit("{\\"type\\":\\"runtime_error\\",\\"error\\":\\"" + escape(error.getClass().getSimpleName() + ": " + error.getMessage()) + "\\",\\"stdout\\":\\"\\"}");
    }
  }

  static void emit(String payload) {
    System.out.println("${RESULT_PREFIX}" + payload);
  }

  static String toJson(Object value) {
    if (value == null) return "null";
    if (value instanceof int[]) return intArrayToJson((int[]) value);
    if (value instanceof boolean[]) return booleanArrayToJson((boolean[]) value);
    if (value instanceof Number || value instanceof Boolean) return String.valueOf(value);
    if (value instanceof String) return "\\"" + escape((String) value) + "\\"";
    if (value instanceof List<?>) return listToJson((List<?>) value);
    return "\\"" + escape(String.valueOf(value)) + "\\"";
  }

  static String intArrayToJson(int[] values) {
    StringBuilder builder = new StringBuilder("[");
    for (int index = 0; index < values.length; index++) {
      if (index > 0) builder.append(",");
      builder.append(values[index]);
    }
    return builder.append("]").toString();
  }

  static String booleanArrayToJson(boolean[] values) {
    StringBuilder builder = new StringBuilder("[");
    for (int index = 0; index < values.length; index++) {
      if (index > 0) builder.append(",");
      builder.append(values[index]);
    }
    return builder.append("]").toString();
  }

  static String listToJson(List<?> values) {
    StringBuilder builder = new StringBuilder("[");
    for (int index = 0; index < values.size(); index++) {
      if (index > 0) builder.append(",");
      builder.append(toJson(values.get(index)));
    }
    return builder.append("]").toString();
  }

  static String escape(String value) {
    if (value == null) return "";
    return value.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"").replace("\\n", "\\\\n").replace("\\r", "\\\\r");
  }
}
`;
}

function createJavaTestCall(problem: CodingProblem, testCase: CodingProblemTestCase) {
  const args = testCase.input.map((value, index) => toJavaLiteral(value, problem.id, index)).join(", ");

  return `    runCase(() -> solution.${problem.functionName.camel}(${args}));`;
}

function toJavaLiteral(value: unknown, problemId: string, argumentIndex: number): string {
  if (typeof value === "string") {
    return `"${escapeJava(value)}"`;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (problemId === "binary-tree-max-depth" && argumentIndex === 0) {
      return value.length
        ? `Arrays.asList(${value.map((item) => (item === null ? "null" : String(item))).join(", ")})`
        : "Arrays.asList()";
    }

    if (problemId === "number-of-islands" && argumentIndex === 0) {
      return `new char[][] {${value.map((row) => `{${(row as string[]).map((item) => `'${escapeJavaChar(item)}'`).join(", ")}}`).join(", ")}}`;
    }

    return `new int[] {${value.map((item) => String(item)).join(", ")}}`;
  }

  return "null";
}

function escapeJava(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
}

function escapeJavaChar(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
