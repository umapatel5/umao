import test from "node:test";
import assert from "node:assert/strict";
import { createLoader, jsonRequest } from "./helpers.mjs";

const loader = createLoader({ overrides: { "next/headers": { cookies: async () => ({ get: () => undefined }) } } });
const { consumeMemoryLimit, rateLimitKey } = loader("lib/security/rate-limit.ts");
const { readJson, rejectCrossOrigin, clientAddress } = loader("lib/security/request-guard.ts");

test("fixed-window rate limit allows quota then rejects", () => {
  assert.equal(consumeMemoryLimit("test-quota", 2, 1000, 100).allowed, true);
  assert.equal(consumeMemoryLimit("test-quota", 2, 1000, 200).allowed, true);
  assert.equal(consumeMemoryLimit("test-quota", 2, 1000, 300).allowed, false);
});
test("rate limit resets at expiry", () => {
  consumeMemoryLimit("test-reset", 1, 1000, 100);
  assert.equal(consumeMemoryLimit("test-reset", 1, 1000, 1100).allowed, true);
});
test("quota keys separate users and scopes without retaining raw identity", () => {
  assert.notEqual(rateLimitKey("login", "alice"), rateLimitKey("login", "bob"));
  assert.notEqual(rateLimitKey("login", "alice"), rateLimitKey("signup", "alice"));
  assert.match(rateLimitKey("login", "alice"), /^[a-f0-9]{64}$/);
});
test("cross-origin and cross-site requests are rejected", () => {
  assert.equal(rejectCrossOrigin(jsonRequest("/api/auth/login", {}, { Origin: "https://evil.invalid" })), true);
  assert.equal(rejectCrossOrigin(jsonRequest("/api/auth/login", {}, { "Sec-Fetch-Site": "cross-site" })), true);
  assert.equal(rejectCrossOrigin(jsonRequest("/api/auth/login", {}, { Origin: "http://localhost:3000" })), false);
});
test("untrusted local forwarding headers do not change quota identity", () => {
  assert.equal(clientAddress(jsonRequest("/", {}, { "x-forwarded-for": "1.2.3.4" })), "local");
});
test("bounded JSON accepts a valid payload", async () => {
  assert.equal((await readJson(jsonRequest("/", { name: "Test" }))).name, "Test");
});
test("bounded JSON rejects malformed and wrong media types", async () => {
  await assert.rejects(readJson(new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" })), { status: 400 });
  await assert.rejects(readJson(new Request("http://localhost", { method: "POST", body: "hello" })), { status: 415 });
});
test("body byte limit applies even without Content-Length", async () => {
  await assert.rejects(readJson(jsonRequest("/", { value: "x".repeat(200) }), 100), { status: 413 });
});
test("body byte limit counts multi-byte UTF-8 correctly", async () => {
  await assert.rejects(readJson(jsonRequest("/", { value: "\u00e9".repeat(60) }), 100), { status: 413 });
});

for (const [name, user, decision, expected] of [
  ["requires authentication", null, { allowed: true }, 401],
  ["enforces rate limit before provider calls", { id: "one" }, { allowed: false, retryAfter: 60 }, 429]
]) test(name, async () => {
  const load = createLoader({ overrides: { "@/lib/auth/auth-service": { getCurrentUser: async () => user }, "@/lib/security/rate-limit": { consumeRateLimit: async () => decision } } });
  const result = await load("lib/security/request-guard.ts").guardRequest(jsonRequest("/", {}), "test", 1);
  assert.equal(result.error.status, expected);
  if (expected === 429) assert.equal(result.error.headers.get("Retry-After"), "60");
});
test("storage failure fails closed with no internal details", async () => {
  const load = createLoader({ overrides: { "@/lib/security/rate-limit": { consumeRateLimit: async () => { throw new Error("database secret"); } } } });
  const result = await load("lib/security/request-guard.ts").guardRequest(jsonRequest("/", {}), "test", 1, false);
  assert.equal(result.error.status, 503);
  assert(!JSON.stringify(await result.error.json()).includes("secret"));
});
