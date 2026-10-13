import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir, cpus } from "node:os";
import { resolve, join } from "node:path";
import postgres from "postgres";
import { createLoader, localTestDatabaseUrl, scoringInput } from "../tests/helpers.mjs";

const databaseUrl = localTestDatabaseUrl();
const root = resolve(import.meta.dirname, "..");
const sql = postgres(databaseUrl, { max: 1 });
const children = [];
const temporary = await mkdtemp(join(tmpdir(), "umao-api-tests-"));
const token = "local-api-test-token";
const [port, runnerPort] = await Promise.all([freePort(), freePort()]);
const origin = `http://127.0.0.1:${port}`;
let checks = 0;
let logs = "";
const safeEnv = {
  ...process.env, NODE_ENV: "production", VERCEL: "", DATABASE_URL: databaseUrl, POSTGRES_URL: "",
  GEMINI_API_KEY: "", OPENAI_API_KEY: "", TAVUS_API_KEY: "", TAVUS_TEST_MODE: "true",
  UMAO_DATA_DIR: temporary, NEXT_TELEMETRY_DISABLED: "1",
  CODE_RUNNER_SERVICE_URL: `http://127.0.0.1:${runnerPort}`, CODE_RUNNER_SERVICE_TOKEN: token,
  RUNNER_PORT: String(runnerPort), RUNNER_SHARED_TOKEN: token, RUNNER_SANDBOX_IMAGE: "umao-sandbox:local"
};

try {
  await sql`DROP TABLE IF EXISTS umao_state, umao_rate_limits`;
  start(["runner-service/server.mjs"]);
  start(["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)]);
  await ready(`http://127.0.0.1:${runnerPort}/health`);
  await ready(origin);
  for (const path of ["/api/interviewer/respond", "/api/interviewer/feedback", "/api/avatar/tavus/start", "/api/results"]) {
    await check(`guest denied ${path}`, path, {}, 401);
  }
  await check("cross-site signup denied", "/api/auth/signup", {}, 403, "", { Origin: "https://untrusted.example" });
  const first = await check("signup persists account and sets safe cookie", "/api/auth/signup", { email: "first@example.test", name: "First Person", password: "test-password-123" }, 200);
  const cookieA = first.cookie;
  assert.match(first.setCookie, /HttpOnly/i); assert.match(first.setCookie, /SameSite=lax/i); assert.match(first.setCookie, /Secure/i);
  assert.equal(JSON.stringify(first.body).includes("passwordHash"), false);
  const second = await check("second account persists", "/api/auth/signup", { email: "second@example.test", name: "Second Person", password: "test-password-456" }, 200);
  await check("duplicate account rejected", "/api/auth/signup", { email: "FIRST@example.test", name: "Duplicate", password: "test-password-123" }, 400);
  await check("wrong password rejected", "/api/auth/login", { email: "first@example.test", password: "wrong-password" }, 401);
  const loggedIn = await check("saved credentials log in", "/api/auth/login", { email: "first@example.test", password: "test-password-123" }, 200);
  await check("malformed JSON rejected", "/api/auth/login", "{", 400);
  await check("oversized JSON rejected", "/api/auth/login", " ".repeat(128001), 413);
  await check("invalid interview context rejected", "/api/interviewer/respond", {}, 400, cookieA);
  const load = createLoader();
  const problem = load("lib/problems/problem-library.ts").getProblemById("two-sum-follow-up");
  const context = { candidateMessage: "I am not sure yet", currentCode: "", language: "Python", role: "Software Engineer", selectedDifficulty: "Easy", selectedTopic: "Arrays", messages: [], latestRun: null, problem };
  const fallback = await check("provider-free conversation returns labeled fallback", "/api/interviewer/respond", context, 200, cookieA);
  assert.equal(fallback.body.provider, "mock");
  await check("missing feedback provider fails clearly", "/api/interviewer/feedback", {}, 503, cookieA);
  await check("cannot end an unowned avatar session", "/api/avatar/tavus/end", { conversationId: "another-persons-session" }, 404, cookieA);
  const savedInput = { ...scoringInput, code: "", latestRun: null };
  const scores = load("lib/scoring/interview-scoring.ts").scoreInterview(savedInput);
  const result = { sessionId: "test-session", completedAt: new Date().toISOString(), input: savedInput, scores, feedback: load("lib/scoring/qualitative-feedback.ts").generateQualitativeFeedback(scores) };
  await check("invalid saved scores rejected", "/api/results", { ...result, scores: { ...scores, overall: 200 } }, 400, cookieA);
  const saved = await check("interview result saved for session owner", "/api/results", result, 200, cookieA);
  const id = saved.body.result.id;
  await check("owner reads result", `/api/results/${id}`, undefined, 200, cookieA);
  await check("another user cannot read result", `/api/results/${id}`, undefined, 404, second.cookie);
  await check("another user sees no history", "/api/interviews", undefined, 200, second.cookie);
  const code = "function twoSum(nums, target) { const seen = new Map(); for(let i=0;i<nums.length;i++){ const n=target-nums[i]; if(seen.has(n)) return [seen.get(n),i]; seen.set(nums[i],i); } return []; }";
  const run = await check("public demo runs isolated tests", "/api/code/run", { code, language: "JavaScript", problemId: problem.id }, 200);
  assert.equal(run.body.passed, true, run.body.error);
  await check("non-demo execution requires login", "/api/code/run", { code: "", language: "Python", problemId: problem.id }, 401);
  await check("password change verifies current password", "/api/auth/account", { currentPassword: "wrong", newPassword: "replacement-pass" }, 400, cookieA, {}, "PATCH");
  await check("password change revokes other sessions", "/api/auth/account", { currentPassword: "test-password-123", newPassword: "replacement-pass" }, 200, cookieA, {}, "PATCH");
  const revoked = await check("revoked session is unauthenticated", "/api/auth/me", undefined, 200, loggedIn.cookie);
  assert.equal(revoked.body.user, null);
  await check("old password no longer works", "/api/auth/login", { email: "first@example.test", password: "test-password-123" }, 401);
  await check("new password works", "/api/auth/login", { email: "first@example.test", password: "replacement-pass" }, 200);
  const measurements = await benchmark(cookieA);
  const attempts = [];
  for (let index = 0; index < 11; index++) {
    const response = await fetch(`${origin}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "nobody@example.test", password: "incorrect" }) });
    if (response.status === 429) assert.ok(Number(response.headers.get("Retry-After")) > 0);
    attempts.push(response.status);
  }
  assert.ok(attempts.includes(429)); checks++; console.log("PASS repeated login attempts receive 429 and Retry-After");
  await check("logout clears session", "/api/auth/logout", {}, 200, cookieA);
  const loggedOut = await check("logged-out session has no user", "/api/auth/me", undefined, 200, cookieA);
  assert.equal(loggedOut.body.user, null);
  const artifact = { measuredAt: new Date().toISOString(), environment: { platform: process.platform, architecture: process.arch, node: process.version, cpu: cpus()[0]?.model, deployment: "local Next.js production build; local PostgreSQL 16; no paid providers" }, integrationChecks: checks, benchmark: measurements };
  await mkdir(join(root, "artifacts"), { recursive: true });
  await writeFile(join(root, "artifacts/local-benchmark.json"), `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(JSON.stringify(artifact, null, 2));
} catch (error) {
  console.error(logs.slice(-10000));
  throw error;
} finally {
  await Promise.all(children.map(async (child) => {
    if (child.exitCode !== null) return;
    const exited = once(child, "exit"); child.kill("SIGTERM");
    const timer = setTimeout(() => child.kill("SIGKILL"), 3000);
    await exited; clearTimeout(timer);
  }));
  await sql.end({ timeout: 1 });
  await rm(temporary, { recursive: true, force: true });
}

function start(args) {
  const child = spawn(process.execPath, args, { cwd: root, env: safeEnv, stdio: ["ignore", "pipe", "pipe"] });
  children.push(child);
  for (const stream of [child.stdout, child.stderr]) stream.on("data", (data) => { logs = (logs + data).slice(-15000); });
}
async function ready(url) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (children.some((child) => child.exitCode !== null)) throw new Error("A test server exited before becoming ready.");
    try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Test server did not become ready: ${url}`);
}
async function check(name, path, body, expected, cookie = "", headers = {}, method) {
  const response = await fetch(`${origin}${path}`, { method: method ?? (body === undefined ? "GET" : "POST"), headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}), ...headers }, ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }) });
  const result = await response.json();
  assert.equal(response.status, expected, `${name}: ${JSON.stringify(result)}`);
  checks++; console.log(`PASS ${name}`);
  const setCookie = response.headers.get("set-cookie") ?? "";
  return { body: result, setCookie, cookie: setCookie.split(";")[0] };
}
async function benchmark(cookie) {
  const samples = []; let failures = 0; const requests = 100; const concurrency = 5;
  for (let index = 0; index < 5; index++) await fetch(`${origin}/api/auth/me`, { headers: { Cookie: cookie } });
  const started = performance.now();
  for (let batch = 0; batch < requests / concurrency; batch++) {
    await Promise.all(Array.from({ length: concurrency }, async () => {
      const start = performance.now();
      const response = await fetch(`${origin}/api/auth/me`, { headers: { Cookie: cookie } });
      const body = await response.json();
      if (!response.ok || !body.user) failures++;
      samples.push(performance.now() - start);
    }));
  }
  samples.sort((a, b) => a - b);
  const percentile = (p) => Math.round(samples[Math.ceil(samples.length * p) - 1] * 100) / 100;
  assert.equal(failures, 0);
  return { endpoint: "GET /api/auth/me", requests, concurrency, failures, warmupRequests: 5, p50Ms: percentile(0.5), p95Ms: percentile(0.95), maxMs: Math.round(samples.at(-1) * 100) / 100, elapsedMs: Math.round(performance.now() - started), scope: "Local session reads only; excludes AI latency, code compilation, and production network latency. No before/after comparison." };
}
async function freePort() {
  const server = createServer(); server.listen(0, "127.0.0.1"); await once(server, "listening");
  const port = server.address().port; await new Promise((resolve) => server.close(resolve)); return port;
}
