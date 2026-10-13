import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = resolve(import.meta.dirname, "..");
export function createLoader({ env = {}, overrides = {}, globals = {} } = {}) {
  const cache = new Map();
  function load(file) {
    let path = resolve(root, file);
    if (!existsSync(path)) path = existsSync(`${path}.ts`) ? `${path}.ts` : resolve(path, "index.ts");
    if (cache.has(path)) return cache.get(path).exports;
    const module = { exports: {} };
    cache.set(path, module);
    const code = ts.transpileModule(readFileSync(path, "utf8"), { fileName: path, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
    vm.runInNewContext(code, {
      module, exports: module.exports,
      require: (name) => Object.hasOwn(overrides, name) ? overrides[name] : name.startsWith("@/") ? load(name.slice(2)) : name.startsWith(".") ? load(resolve(dirname(path), name)) : require(name),
      process: { env, cwd: () => root }, crypto: webcrypto, Buffer, Date, URL, Request, Response, Headers, TextEncoder, TextDecoder,
      AbortController, AbortSignal, ReadableStream, console, performance, setTimeout, clearTimeout,
      fetch: async () => { throw new Error("External fetch forbidden in offline tests."); }, ...globals
    }, { filename: path });
    return module.exports;
  }
  return load;
}

export const scoringInput = {
  code: "", difficulty: "Easy", hintsUsed: 0, language: "Python", latestRun: null, messages: [],
  problemId: "two-sum-follow-up", problemTitle: "Two Sum", role: "Software Engineer", topic: "Arrays", topics: ["Arrays"],
  speakingMetrics: { speakingDurationMs: 0, pauseCount: 0 },
  webcamMetrics: { faceState: "idle", analysisAvailable: false, lookingAwayCount: 0, lookingAwayMs: 0, extendedAwayMs: 0 }
};

export const jsonRequest = (path, body, headers = {}) => new Request(`http://localhost:3000${path}`, {
  method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body)
});

export function localTestDatabaseUrl() {
  const value = process.env.TEST_DATABASE_URL;
  if (!value) throw new Error("Set TEST_DATABASE_URL to a disposable local umao_test database.");
  const url = new URL(value);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/umao_test") {
    throw new Error("Integration tests only accept a local database named umao_test.");
  }
  return value;
}
