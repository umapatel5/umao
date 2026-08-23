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
  runProcess,
  withWorkspace
} from "@/lib/code-execution/shared";
import type { CodeRunResponse } from "@/types/code-execution";
import type { CodingProblem, CodingProblemTestCase } from "@/types/problem";

const RESULT_PREFIX = "__UMAO_RESULT__";

export async function runCppCode(code: string, problem: CodingProblem): Promise<CodeRunResponse> {
  return withWorkspace("umao-cpp", async (workspace) => {
    const startedAt = performance.now();
    const sourcePath = join(workspace, "main.cpp");

    await writeFile(sourcePath, createCppRunnerSource(code, problem), "utf-8");

    const compile = await runProcess("g++", ["-std=c++17", "-O0", "-Wall", "-Wextra", "main.cpp", "-o", "main"], {
      cwd: workspace,
      timeoutMs: COMPILE_TIMEOUT_MS
    });

    if (compile.timedOut || compile.exitCode !== 0) {
      return createCompileErrorResponse({
        error: compile.timedOut ? "Compilation timed out." : compile.stderr.trim() || compile.stdout.trim(),
        language: "C++",
        problem,
        runtimeMs: performance.now() - startedAt,
        timedOut: compile.timedOut
      });
    }

    const execution = await runProcess(join(workspace, "main"), [], {
      cwd: workspace,
      timeoutMs: EXECUTION_TIMEOUT_MS
    });
    const runtimeMs = performance.now() - startedAt;
    const userStdout = getUserStdout(execution.stdout, RESULT_PREFIX);

    if (execution.timedOut) {
      return createAggregateResponse({
        language: "C++",
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
      language: "C++",
      results,
      runtimeMs,
      stdout: userStdout
    });
  });
}

function createCppRunnerSource(candidateCode: string, problem: CodingProblem) {
  const calls = problem.testCases.map((testCase, index) => createCppTestCase(problem, testCase, index)).join("\n");

  return `
#include <chrono>
#include <exception>
#include <iomanip>
#include <iostream>
#include <optional>
#include <string>
#include <unordered_map>
#include <vector>
using namespace std;

${candidateCode}

namespace umao_runner {
const string RESULT_PREFIX = "${RESULT_PREFIX}";

string escapeJson(const string& value) {
  string output;
  for (char character : value) {
    if (character == '\\\\') output += "\\\\\\\\";
    else if (character == '"') output += "\\\\\\"";
    else if (character == '\\n') output += "\\\\n";
    else if (character == '\\r') output += "\\\\r";
    else output += character;
  }
  return output;
}

string toJson(int value) {
  return to_string(value);
}

string toJson(bool value) {
  return value ? "true" : "false";
}

string toJson(const string& value) {
  return "\\"" + escapeJson(value) + "\\"";
}

string toJson(const vector<int>& values) {
  string output = "[";
  for (size_t index = 0; index < values.size(); index++) {
    if (index > 0) output += ",";
    output += to_string(values[index]);
  }
  return output + "]";
}

template <typename Callable>
void runCase(Callable callable) {
  try {
    auto startedAt = chrono::steady_clock::now();
    auto actual = callable();
    auto finishedAt = chrono::steady_clock::now();
    double runtimeMs = chrono::duration<double, milli>(finishedAt - startedAt).count();
    cout << RESULT_PREFIX << "{\\"type\\":\\"success\\",\\"actual\\":" << toJson(actual)
         << ",\\"runtimeMs\\":" << fixed << setprecision(2) << runtimeMs << ",\\"stdout\\":\\"\\"}" << endl;
  } catch (const exception& error) {
    cout << RESULT_PREFIX << "{\\"type\\":\\"runtime_error\\",\\"error\\":\\"" << escapeJson(error.what())
         << "\\",\\"stdout\\":\\"\\"}" << endl;
  } catch (...) {
    cout << RESULT_PREFIX << "{\\"type\\":\\"runtime_error\\",\\"error\\":\\"Unknown C++ exception\\",\\"stdout\\":\\"\\"}" << endl;
  }
}
}

int main() {
${calls}
  return 0;
}
`;
}

function createCppTestCase(problem: CodingProblem, testCase: CodingProblemTestCase, index: number) {
  const declarations = testCase.input
    .map((value, argumentIndex) => createCppArgumentDeclaration(value, problem.id, index, argumentIndex))
    .join("\n");
  const args = testCase.input.map((_value, argumentIndex) => `arg${index}_${argumentIndex}`).join(", ");

  return `  {
${declarations}
    umao_runner::runCase([&]() { return ${problem.functionName.camel}(${args}); });
  }`;
}

function createCppArgumentDeclaration(value: unknown, problemId: string, testIndex: number, argumentIndex: number) {
  const name = `arg${testIndex}_${argumentIndex}`;

  if (typeof value === "string") {
    return `    string ${name} = "${escapeCpp(value)}";`;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return `    auto ${name} = ${String(value)};`;
  }

  if (Array.isArray(value)) {
    if (problemId === "binary-tree-max-depth" && argumentIndex === 0) {
      return `    vector<optional<int>> ${name} = ${toCppOptionalIntVector(value)};`;
    }

    if (problemId === "number-of-islands" && argumentIndex === 0) {
      return `    vector<vector<char>> ${name} = ${toCppCharGrid(value)};`;
    }

    return `    vector<int> ${name} = ${toCppIntVector(value)};`;
  }

  return `    auto ${name} = nullptr;`;
}

function toCppIntVector(value: unknown[]) {
  return `{${value.map((item) => String(item)).join(", ")}}`;
}

function toCppOptionalIntVector(value: unknown[]) {
  return `{${value.map((item) => (item === null ? "nullopt" : String(item))).join(", ")}}`;
}

function toCppCharGrid(value: unknown[]) {
  return `{${value.map((row) => `{${(row as string[]).map((item) => `'${escapeCppChar(item)}'`).join(", ")}}`).join(", ")}}`;
}

function escapeCpp(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
}

function escapeCppChar(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
