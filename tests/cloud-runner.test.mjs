import test from "node:test";
import assert from "node:assert/strict";
import { createLoader } from "./helpers.mjs";

const input = {
  language: "JavaScript", code: "function twoSum() { return [0, 1]; }",
  problem: { testCases: [{ name: "Pair", input: [[2, 7], 9], expected: [0, 1] }] }
};
const result = { language: "JavaScript", passed: true, results: [{ passed: true }], runtimeMs: 1, stdout: "" };

function fixture({ output = JSON.stringify(result), failCreate = false, failWrite = false, exitCode = 0, failCleanup = false } = {}) {
  const calls = [];
  const sandbox = {
    writeFiles: async (files) => { calls.push(["write", files]); if (failWrite) throw new Error("write failed"); },
    runCommand: async (options) => {
      calls.push(["command", options]);
      return {
        logs: async function* () { yield { stream: "stdout", data: output }; },
        wait: async () => ({ exitCode })
      };
    },
    delete: async () => { calls.push(["delete"]); if (failCleanup) throw new Error("cleanup failed"); }
  };
  const load = createLoader({ env: { VERCEL: "1", GEMINI_API_KEY: "secret-never-pass" }, overrides: {
    "@vercel/sandbox": { Sandbox: { create: async (options) => { calls.push(["create", options]); if (failCreate) throw new Error("credential detail"); return sandbox; } } }
  } });
  return { calls, run: load("lib/code-execution/vercel-sandbox-runner.ts").runVercelSandboxCode };
}

test("cloud runner uses a fresh nonpersistent network-blocked VM without app secrets", async () => {
  const { calls, run } = fixture();
  assert.equal((await run(input)).passed, true);
  const options = calls.find(([name]) => name === "create")[1];
  assert.equal(options.persistent, false);
  assert.equal(options.networkPolicy, "deny-all");
  assert.equal(options.timeout, 35000);
  assert.equal(options.resources.vcpus, 1);
  assert.equal(Object.keys(options.env).length, 0);
  assert.equal(options.ports.length, 0);
  assert(!JSON.stringify(calls).includes("secret-never-pass"));
  assert.equal(calls.filter(([name]) => name === "delete").length, 1);
});
test("cloud runner uploads only the job and execution helpers", async () => {
  const { calls, run } = fixture();
  await run(input);
  const files = calls.find(([name]) => name === "write")[1];
  assert.equal(files.length, 3);
  assert.equal(JSON.parse(files[2].content.toString()).code, input.code);
  const options = calls.find(([name]) => name === "command")[1];
  assert.equal(options.cmd, "node");
  assert.equal(options.timeoutMs, 30000);
  assert.equal(options.args[1], "--job");
});
test("cloud runner hides provider errors and never falls back to host execution", async () => {
  const { calls, run } = fixture({ failCreate: true });
  const response = await run(input);
  assert.equal(response.passed, false);
  assert.equal(response.results.length, 0);
  assert(!response.error.includes("credential"));
  assert.equal(calls.length, 1);
});
test("cloud runner deletes the VM after file upload failure", async () => {
  const { calls, run } = fixture({ failWrite: true });
  assert.equal((await run(input)).passed, false);
  assert.equal(calls.at(-1)[0], "delete");
});
test("cloud runner deletes the VM after excessive output", async () => {
  const { calls, run } = fixture({ output: "x".repeat(512001) });
  assert.equal((await run(input)).passed, false);
  assert.equal(calls.at(-1)[0], "delete");
});
test("cloud runner rejects malformed job output", async () => {
  const { calls, run } = fixture({ output: "not json" });
  assert.equal((await run(input)).passed, false);
  assert.equal(calls.at(-1)[0], "delete");
});
test("cloud runner rejects failed commands and incorrect result counts", async () => {
  assert.equal((await fixture({ exitCode: 1 }).run(input)).passed, false);
  assert.equal((await fixture({ output: JSON.stringify({ ...result, results: [] }) }).run(input)).passed, false);
});
test("cloud cleanup failure retains a usable result with an enforced short VM lifetime", async () => {
  assert.equal((await fixture({ failCleanup: true }).run(input)).passed, true);
});
