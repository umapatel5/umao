import { createServer } from "node:http";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";

const PORT = Number(process.env.RUNNER_PORT ?? 8080);
const EXECUTION_TIMEOUT_MS = Number(process.env.RUNNER_EXECUTION_TIMEOUT_MS ?? 2200);
const COMPILE_TIMEOUT_MS = Number(process.env.RUNNER_COMPILE_TIMEOUT_MS ?? 8000);
const MAX_CODE_LENGTH = Number(process.env.RUNNER_MAX_CODE_LENGTH ?? 20000);
const MAX_BODY_BYTES = Number(process.env.RUNNER_MAX_BODY_BYTES ?? 128000);
const MAX_OUTPUT_BYTES = Number(process.env.RUNNER_MAX_OUTPUT_BYTES ?? 64000);
const RESULT_PREFIX = "__UMAO_RESULT__";

const server = createServer(async (request, response) => {
  try {
    if (request.url === "/health" && request.method === "GET") {
      return sendJson(response, 200, { ok: true, service: "umao-code-runner" });
    }

    if (request.url !== "/run" || request.method !== "POST") {
      return sendJson(response, 404, { error: "Not found." });
    }

    if (!isAuthorized(request)) {
      return sendJson(response, 401, { error: "Unauthorized runner request." });
    }

    const body = await readJsonBody(request);

    if (!body || typeof body.code !== "string" || typeof body.language !== "string" || !body.problem) {
      return sendJson(response, 400, { error: "Expected code, language, and problem." });
    }

    if (body.code.length > MAX_CODE_LENGTH) {
      return sendJson(response, 413, { error: `Code is too large. Limit is ${MAX_CODE_LENGTH} characters.` });
    }

    const result = await runCode(body.language, body.code, body.problem);
    return sendJson(response, 200, result);
  } catch (error) {
    console.error(JSON.stringify({ level: "error", message: error.message }));
    return sendJson(response, 500, { error: "Runner service failed." });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(JSON.stringify({ level: "info", message: `Umao code runner listening on ${PORT}` }));
});

async function runCode(language, code, problem) {
  switch (language) {
    case "Python":
      return runPython(code, problem);
    case "JavaScript":
      return runJavaScript(code, problem);
    case "Java":
      return runJava(code, problem);
    case "C++":
      return runCpp(code, problem);
    default:
      return { error: "Unsupported language.", language, passed: false, results: [], runtimeMs: 0, stdout: "" };
  }
}

async function runPython(code, problem) {
  return withWorkspace("umao-python", async (workspace) => {
    const startedAt = performance.now();
    const candidatePath = join(workspace, "candidate.py");
    const runnerPath = join(workspace, "runner.py");
    await writeFile(candidatePath, code, "utf8");
    await writeFile(runnerPath, pythonRunnerSource, "utf8");

    const results = [];

    for (const testCase of problem.testCases) {
      const payload = JSON.stringify({ args: testCase.input, functionName: problem.functionName });
      const output = await runProcess("python3", ["-I", "-S", runnerPath, candidatePath, payload], workspace, EXECUTION_TIMEOUT_MS);
      results.push(toTestResult(testCase, output, parseLastJsonLine(output.stdout)));
    }

    return aggregate("Python", results, performance.now() - startedAt);
  });
}

async function runJavaScript(code, problem) {
  return withWorkspace("umao-js", async (workspace) => {
    const startedAt = performance.now();
    const candidatePath = join(workspace, "candidate.js");
    const runnerPath = join(workspace, "runner.cjs");
    await writeFile(candidatePath, code, "utf8");
    await writeFile(runnerPath, javascriptRunnerSource, "utf8");

    const results = [];

    for (const testCase of problem.testCases) {
      const payload = JSON.stringify({ args: testCase.input, functionName: problem.functionName });
      const output = await runProcess("node", [runnerPath, candidatePath, payload], workspace, EXECUTION_TIMEOUT_MS);
      results.push(toTestResult(testCase, output, parseLastJsonLine(output.stdout)));
    }

    return aggregate("JavaScript", results, performance.now() - startedAt);
  });
}

async function runJava(code, problem) {
  return withWorkspace("umao-java", async (workspace) => {
    const startedAt = performance.now();
    await writeFile(join(workspace, "Solution.java"), code, "utf8");
    await writeFile(join(workspace, "TestRunner.java"), createJavaRunner(problem), "utf8");
    const compile = await runProcess("javac", ["Solution.java", "TestRunner.java"], workspace, COMPILE_TIMEOUT_MS);

    if (compile.timedOut || compile.exitCode !== 0) {
      return compileFailure("Java", problem, compile, performance.now() - startedAt);
    }

    const output = await runProcess("java", ["-Xmx64m", "TestRunner"], workspace, EXECUTION_TIMEOUT_MS);
    return prefixedResults("Java", problem, output, performance.now() - startedAt);
  });
}

async function runCpp(code, problem) {
  return withWorkspace("umao-cpp", async (workspace) => {
    const startedAt = performance.now();
    await writeFile(join(workspace, "main.cpp"), createCppRunner(code, problem), "utf8");
    const compile = await runProcess("g++", ["-std=c++17", "-O0", "-Wall", "-Wextra", "main.cpp", "-o", "main"], workspace, COMPILE_TIMEOUT_MS);

    if (compile.timedOut || compile.exitCode !== 0) {
      return compileFailure("C++", problem, compile, performance.now() - startedAt);
    }

    const output = await runProcess(join(workspace, "main"), [], workspace, EXECUTION_TIMEOUT_MS);
    return prefixedResults("C++", problem, output, performance.now() - startedAt);
  });
}

function prefixedResults(language, problem, output, runtimeMs) {
  const userStdout = userOutput(output.stdout);

  if (output.timedOut) {
    return aggregate(language, problem.testCases.map((testCase) => failed(testCase, "Execution timed out.", runtimeMs, userStdout, true)), runtimeMs, userStdout);
  }

  const parsed = output.stdout
    .split("\n")
    .filter((line) => line.startsWith(RESULT_PREFIX))
    .map((line) => safeParse(line.slice(RESULT_PREFIX.length)));
  const results = problem.testCases.map((testCase, index) => toTestResult(testCase, output, parsed[index], runtimeMs, userStdout));
  return aggregate(language, results, runtimeMs, userStdout);
}

function compileFailure(language, problem, compile, runtimeMs) {
  const error = compile.timedOut ? "Compilation timed out." : compile.stderr.trim() || compile.stdout.trim() || "Compilation failed.";
  return aggregate(language, problem.testCases.map((testCase) => failed(testCase, error, runtimeMs, "", compile.timedOut)), runtimeMs);
}

function toTestResult(testCase, processOutput, runnerOutput, fallbackRuntimeMs, stdoutOverride) {
  const runtimeMs = roundMs(runnerOutput?.runtimeMs ?? fallbackRuntimeMs ?? 0);
  const stdout = stdoutOverride ?? runnerOutput?.stdout ?? "";

  if (processOutput.timedOut || runnerOutput?.timedOut) {
    return failed(testCase, "Execution timed out.", runtimeMs, stdout, true);
  }

  if (processOutput.stderr.trim()) {
    return failed(testCase, processOutput.stderr.trim(), runtimeMs, stdout);
  }

  if (!runnerOutput || runnerOutput.type !== "success") {
    return failed(testCase, runnerOutput?.error ?? "Runner returned an invalid response.", runtimeMs, runnerOutput?.stdout ?? stdout, runnerOutput?.timedOut);
  }

  const actual = JSON.stringify(runnerOutput.actual);
  const expected = JSON.stringify(testCase.expected);
  const passed = actual === expected;

  return {
    actual,
    error: passed ? undefined : "Output did not match expected result.",
    expected,
    input: JSON.stringify(testCase.input),
    name: testCase.name,
    passed,
    runtimeMs,
    stdout
  };
}

function failed(testCase, error, runtimeMs, stdout = "", timedOut = false) {
  return {
    actual: "",
    error,
    expected: JSON.stringify(testCase.expected),
    input: JSON.stringify(testCase.input),
    name: testCase.name,
    passed: false,
    runtimeMs: roundMs(runtimeMs),
    stdout,
    timedOut
  };
}

function aggregate(language, results, runtimeMs, stdout = "") {
  return {
    error: results.find((result) => result.error)?.error,
    language,
    passed: results.length > 0 && results.every((result) => result.passed),
    results,
    runtimeMs: roundMs(runtimeMs),
    stdout
  };
}

function runProcess(command, args, cwd, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env: {
        HOME: tmpdir(),
        NODE_ENV: "production",
        PATH: process.env.PATH ?? "/usr/bin:/bin:/usr/local/bin",
        PYTHONIOENCODING: "utf-8"
      },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      child.kill("SIGKILL");
      resolve({ exitCode: null, stdout, stderr, timedOut: true });
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdout = appendBounded(stdout, chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr = appendBounded(stderr, chunk);
    });
    child.on("error", (error) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ exitCode: null, stdout, stderr: error.message, timedOut: false });
      }
    });
    child.on("close", (exitCode) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ exitCode, stdout, stderr, timedOut: false });
      }
    });
  });
}

async function withWorkspace(prefix, work) {
  const workspace = await mkdtemp(join(tmpdir(), `${prefix}-${randomUUID()}-`));
  try {
    return await work(workspace);
  } finally {
    await rm(workspace, { force: true, recursive: true });
  }
}

function createJavaRunner(problem) {
  const calls = problem.testCases.map((testCase) => `    runCase(() -> solution.${problem.functionName.camel}(${testCase.input.map((value, index) => javaLiteral(value, problem.id, index)).join(", ")}));`).join("\n");
  return `
import java.util.*;
public class TestRunner {
  interface CaseCallable { Object run() throws Exception; }
  public static void main(String[] args) { Solution solution = new Solution();\n${calls}\n  }
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
  static void emit(String payload) { System.out.println("${RESULT_PREFIX}" + payload); }
  static String toJson(Object value) {
    if (value == null) return "null";
    if (value instanceof int[]) return intArrayToJson((int[]) value);
    if (value instanceof Number || value instanceof Boolean) return String.valueOf(value);
    if (value instanceof String) return "\\"" + escape((String) value) + "\\"";
    if (value instanceof List<?>) return listToJson((List<?>) value);
    return "\\"" + escape(String.valueOf(value)) + "\\"";
  }
  static String intArrayToJson(int[] values) { StringBuilder b = new StringBuilder("["); for (int i = 0; i < values.length; i++) { if (i > 0) b.append(","); b.append(values[i]); } return b.append("]").toString(); }
  static String listToJson(List<?> values) { StringBuilder b = new StringBuilder("["); for (int i = 0; i < values.size(); i++) { if (i > 0) b.append(","); b.append(toJson(values.get(i))); } return b.append("]").toString(); }
  static String escape(String value) { if (value == null) return ""; return value.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"").replace("\\n", "\\\\n").replace("\\r", "\\\\r"); }
}
`;
}

function createCppRunner(candidateCode, problem) {
  const calls = problem.testCases.map((testCase, testIndex) => {
    const declarations = testCase.input.map((value, argIndex) => cppDeclaration(value, problem.id, testIndex, argIndex)).join("\n");
    const args = testCase.input.map((_value, argIndex) => `arg${testIndex}_${argIndex}`).join(", ");
    return `  {\n${declarations}\n    umao_runner::runCase([&]() { return ${problem.functionName.camel}(${args}); });\n  }`;
  }).join("\n");
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
string escapeJson(const string& value) { string out; for (char c : value) { if (c == '\\\\') out += "\\\\\\\\"; else if (c == '"') out += "\\\\\\""; else if (c == '\\n') out += "\\\\n"; else if (c == '\\r') out += "\\\\r"; else out += c; } return out; }
string toJson(int value) { return to_string(value); }
string toJson(bool value) { return value ? "true" : "false"; }
string toJson(const string& value) { return "\\"" + escapeJson(value) + "\\""; }
string toJson(const vector<int>& values) { string out = "["; for (size_t i = 0; i < values.size(); i++) { if (i > 0) out += ","; out += to_string(values[i]); } return out + "]"; }
template <typename Callable> void runCase(Callable callable) {
  try { auto startedAt = chrono::steady_clock::now(); auto actual = callable(); auto finishedAt = chrono::steady_clock::now(); double runtimeMs = chrono::duration<double, milli>(finishedAt - startedAt).count(); cout << RESULT_PREFIX << "{\\"type\\":\\"success\\",\\"actual\\":" << toJson(actual) << ",\\"runtimeMs\\":" << fixed << setprecision(2) << runtimeMs << ",\\"stdout\\":\\"\\"}" << endl; }
  catch (const exception& error) { cout << RESULT_PREFIX << "{\\"type\\":\\"runtime_error\\",\\"error\\":\\"" << escapeJson(error.what()) << "\\",\\"stdout\\":\\"\\"}" << endl; }
  catch (...) { cout << RESULT_PREFIX << "{\\"type\\":\\"runtime_error\\",\\"error\\":\\"Unknown C++ exception\\",\\"stdout\\":\\"\\"}" << endl; }
}
}
int main() {\n${calls}\n  return 0;\n}
`;
}

function javaLiteral(value, problemId, index) {
  if (typeof value === "string") return `"${escape(value)}"`;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    if (problemId === "binary-tree-max-depth" && index === 0) return value.length ? `Arrays.asList(${value.map((item) => item === null ? "null" : String(item)).join(", ")})` : "Arrays.asList()";
    if (problemId === "number-of-islands" && index === 0) return `new char[][] {${value.map((row) => `{${row.map((item) => `'${escapeChar(item)}'`).join(", ")}}`).join(", ")}}`;
    return `new int[] {${value.map(String).join(", ")}}`;
  }
  return "null";
}

function cppDeclaration(value, problemId, testIndex, argIndex) {
  const name = `arg${testIndex}_${argIndex}`;
  if (typeof value === "string") return `    string ${name} = "${escape(value)}";`;
  if (typeof value === "number" || typeof value === "boolean") return `    auto ${name} = ${String(value)};`;
  if (Array.isArray(value)) {
    if (problemId === "binary-tree-max-depth" && argIndex === 0) return `    vector<optional<int>> ${name} = {${value.map((item) => item === null ? "nullopt" : String(item)).join(", ")}};`;
    if (problemId === "number-of-islands" && argIndex === 0) return `    vector<vector<char>> ${name} = {${value.map((row) => `{${row.map((item) => `'${escapeChar(item)}'`).join(", ")}}`).join(", ")}};`;
    return `    vector<int> ${name} = {${value.map(String).join(", ")}};`;
  }
  return `    auto ${name} = nullptr;`;
}

const pythonRunnerSource = String.raw`
import ast, contextlib, io, json, sys, time
candidate_path = sys.argv[1]
payload = json.loads(sys.argv[2])
blocked_calls = {"__import__", "compile", "eval", "exec", "input", "open"}
source = open(candidate_path, "r", encoding="utf-8").read()
try:
    tree = ast.parse(source, filename="candidate.py")
except SyntaxError as error:
    print(json.dumps({"type": "syntax_error", "error": f"{error.msg} at line {error.lineno}, column {error.offset}"}))
    sys.exit(0)
for node in ast.walk(tree):
    if isinstance(node, (ast.Import, ast.ImportFrom)):
        print(json.dumps({"type": "blocked", "error": "Import statements are disabled in this coding sandbox."}))
        sys.exit(0)
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in blocked_calls:
        print(json.dumps({"type": "blocked", "error": f"Use of {node.func.id}() is disabled in this coding sandbox."}))
        sys.exit(0)
safe_builtins = {"abs": abs, "all": all, "any": any, "bool": bool, "dict": dict, "enumerate": enumerate, "filter": filter, "float": float, "int": int, "len": len, "list": list, "map": map, "max": max, "min": min, "print": print, "range": range, "reversed": reversed, "set": set, "sorted": sorted, "str": str, "sum": sum, "tuple": tuple, "zip": zip}
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
    print(json.dumps({"type": "success", "actual": actual, "runtimeMs": runtime_ms, "stdout": captured_stdout.getvalue()}))
except Exception as error:
    print(json.dumps({"type": "runtime_error", "error": f"{error.__class__.__name__}: {error}", "stdout": captured_stdout.getvalue()}))
`;

const javascriptRunnerSource = String.raw`
const fs = require("fs");
const vm = require("vm");
const { performance } = require("perf_hooks");
const candidatePath = process.argv[2];
const payload = JSON.parse(process.argv[3]);
const source = fs.readFileSync(candidatePath, "utf8");
const captured = [];
const context = { console: { log: (...args) => captured.push(args.map(String).join(" ")), error: (...args) => captured.push(args.map(String).join(" ")) } };
context.globalThis = context;
try {
  if (/\b(import|require)\b/.test(source)) throw new Error("Imports and require() are disabled in this coding sandbox.");
  vm.createContext(context, { codeGeneration: { strings: false, wasm: false } });
  new vm.Script(source, { filename: "candidate.js" }).runInContext(context, { timeout: 1000 });
  context.__args = payload.args;
  const functionName = context[payload.functionName.camel] ? payload.functionName.camel : payload.functionName.snake;
  if (typeof context[functionName] !== "function") throw new Error("Define a callable " + payload.functionName.camel + " function.");
  const startedAt = performance.now();
  new vm.Script("globalThis.__actual = " + functionName + "(...globalThis.__args);").runInContext(context, { timeout: 1000 });
  const runtimeMs = Math.round((performance.now() - startedAt) * 100) / 100;
  console.log(JSON.stringify({ type: "success", actual: context.__actual, runtimeMs, stdout: captured.join("\n") }));
} catch (error) {
  const isTimeout = error && /timed out/i.test(error.message);
  console.log(JSON.stringify({ type: error && error.name === "SyntaxError" ? "syntax_error" : "runtime_error", error: isTimeout ? "Execution timed out." : error.name + ": " + error.message, timedOut: Boolean(isTimeout), stdout: captured.join("\n") }));
}
`;

function isAuthorized(request) {
  const token = process.env.RUNNER_SHARED_TOKEN;
  return !token || request.headers.authorization === `Bearer ${token}`;
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        resolve(null);
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

function parseLastJsonLine(stdout) {
  const line = stdout.trim().split("\n").at(-1);
  return line ? safeParse(line) : null;
}

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function userOutput(stdout) {
  return stdout.split("\n").filter((line) => line && !line.startsWith(RESULT_PREFIX)).join("\n");
}

function appendBounded(current, chunk) {
  const next = current + chunk.toString("utf8");
  return Buffer.byteLength(next, "utf8") <= MAX_OUTPUT_BYTES ? next : `${next.slice(0, MAX_OUTPUT_BYTES)}\n[output truncated]`;
}

function roundMs(value) {
  return Math.round(value * 100) / 100;
}

function escape(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
}

function escapeChar(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
