import assert from "node:assert/strict";

const url = process.env.CODE_RUNNER_TEST_URL ?? "http://127.0.0.1:8080/run";
if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname)) throw new Error("Security checks require a local runner.");
const token = process.env.CODE_RUNNER_SERVICE_TOKEN ?? "local-dev-runner-token";
const problem = { id: "security-check", functionName: { camel: "solve", snake: "solve" }, testCases: [{ name: "Isolation", input: [[]], expected: true }] };
let passed = 0;
async function check(name, body, status = 200, authorized = true) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...(authorized ? { Authorization: `Bearer ${token}` } : {}) }, body: typeof body === "string" ? body : JSON.stringify(body) });
  assert.equal(response.status, status, name);
  const result = await response.json();
  passed++;
  console.log(`PASS ${name}`);
  return result;
}
await check("missing token", {}, 401, false);
await check("malformed JSON", "{", 400);
await check("oversized code", { language: "Python", code: "x".repeat(20001), problem }, 413);
await check("oversized body", " ".repeat(128001), 413);
await check("unsafe function identifier", { language: "Java", code: "", problem: { ...problem, functionName: { camel: "solve(); exit(0)", snake: "solve" } } }, 400);
const isolation = await check("candidate has no provider secrets, network, or writable root", {
  language: "Java", problem,
  code: `import java.nio.file.*;
import java.net.*;
class Solution {
  public boolean solve(int[] nums) {
    for (String key : new String[]{"TAVUS_API_KEY", "GEMINI_API_KEY", "OPENAI_API_KEY", "RUNNER_SHARED_TOKEN", "DATABASE_URL"}) {
      if (System.getenv(key) != null) return false;
    }
    try { Files.writeString(Path.of("/etc/umao-test"), "blocked"); return false; } catch (Exception expected) {}
    try (Socket socket = new Socket()) {
      socket.connect(new InetSocketAddress("1.1.1.1", 80), 200);
      return false;
    } catch (Exception expected) { return true; }
  }
}`
});
assert.equal(isolation.passed, true, isolation.error);
const output = await check("excessive output is terminated", { language: "JavaScript", problem, code: "function solve(nums) { while (true) console.log('x'.repeat(1000)); }" });
assert.equal(output.passed, false);
assert.ok(JSON.stringify(output).length < 200000);
console.log(`${passed} runner security checks passed.`);
