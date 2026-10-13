import test from "node:test";
import assert from "node:assert/strict";
import { createLoader, jsonRequest, scoringInput } from "./helpers.mjs";

const context = { problem: { title: "Two Sum", prompt: "Return two indices.", constraints: [], examples: [] }, role: "Software Engineer", selectedDifficulty: "Easy", selectedTopic: "Arrays", language: "Python", currentCode: "", latestRun: null, messages: [{ role: "interviewer", text: "Tell me about yourself." }], candidateMessage: "idk" };
test("provider failure falls back without exposing secret", async () => {
  const load = createLoader({ env: { GEMINI_API_KEY: "test-only-not-a-real-key" }, globals: { fetch: async () => new Response("{}", { status: 429 }) } });
  const reply = await load("lib/ai/interviewer.ts").generateInterviewerReply(context);
  assert.equal(reply.provider, "mock"); assert(reply.fallbackReason); assert(!JSON.stringify(reply).includes("test-only"));
});
test("mock interviewer clarifies unclear answers", async () => {
  const reply = await createLoader()("lib/ai/interviewer.ts").generateInterviewerReply(context);
  assert.match(reply.message.text, /one step|Tell me about yourself/);
});
test("remote runner outage returns actionable failure", async () => {
  const load = createLoader({ env: { CODE_RUNNER_SERVICE_URL: "http://localhost:9999", CODE_RUNNER_SERVICE_TOKEN: "test-token" }, globals: { fetch: async () => { throw new Error("network"); } } });
  const result = await load("lib/code-execution/remote-runner.ts").runRemoteCode({ code: "", language: "Python", problem: {} });
  assert.equal(result.passed, false); assert.match(result.error, /Could not reach/);
});
test("remote runner rejects missing credentials before fetch", async () => {
  const load = createLoader({ env: { CODE_RUNNER_SERVICE_URL: "http://localhost:9999" }, globals: { fetch: async () => assert.fail("must not fetch") } });
  assert.match((await load("lib/code-execution/remote-runner.ts").runRemoteCode({ code: "", language: "Python", problem: {} })).error, /authentication/);
});
test("remote runner validates response contract", async () => {
  const load = createLoader({ env: { CODE_RUNNER_SERVICE_URL: "http://localhost:9999", CODE_RUNNER_SERVICE_TOKEN: "token" }, globals: { fetch: async () => Response.json({ passed: true }) } });
  assert.match((await load("lib/code-execution/remote-runner.ts").runRemoteCode({ code: "", language: "Python", problem: {} })).error, /invalid response/);
});
test("production never executes candidate code on the app host", async () => {
  const block = () => assert.fail("local execution must not run");
  const load = createLoader({ env: { NODE_ENV: "production" }, overrides: {
    "@/lib/code-execution/python-runner": { runPythonCode: block }, "@/lib/code-execution/javascript-runner": { runJavaScriptCode: block },
    "@/lib/code-execution/java-runner": { runJavaCode: block }, "@/lib/code-execution/cpp-runner": { runCppCode: block }
  } });
  assert.match((await load("lib/code-execution/index.ts").runCodeForProblem({ code: "", language: "Python", problem: {} })).error, /isolated runner/);
});
for (const path of ["interviewer/respond", "interviewer/feedback", "avatar/tavus/start", "avatar/tavus/end"]) {
  test(`${path} denies guests before any provider call`, async () => {
    const load = createLoader({ overrides: { "@/lib/security/request-guard": { guardRequest: async () => ({ error: Response.json({ error: "Sign in" }, { status: 401 }) }) } } });
    assert.equal((await load(`app/api/${path}/route.ts`).POST(jsonRequest(`/api/${path}`, {}))).status, 401);
  });
}
test("feedback success is validated using mocked Gemini, no paid request", async () => {
  const load = createLoader({ env: { GEMINI_API_KEY: "mock-key" }, overrides: { "@/lib/security/request-guard": {
    ...createLoader()("lib/security/request-guard.ts"), guardRequest: async () => ({ user: { id: "alice" } })
  } }, globals: { fetch: async () => Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ strengths: [], areasToImprove: ["Complete a solution."], personalizedFeedback: "No completed solution was demonstrated.", communication: null }) }] } }] }) } });
  const response = await load("app/api/interviewer/feedback/route.ts").POST(jsonRequest("/api/interviewer/feedback", scoringInput));
  assert.equal(response.status, 200); assert.equal((await response.json()).feedback.strengths.length, 0);
});
test("blank code cannot receive implementation praise even with a candidate quote", async () => {
  const answer = "I plan to use a hash map and explain what I store at each index.";
  const load = createLoader({ env: { GEMINI_API_KEY: "mock-key" }, overrides: { "@/lib/security/request-guard": {
    ...createLoader()("lib/security/request-guard.ts"), guardRequest: async () => ({ user: { id: "alice" } })
  } }, globals: { fetch: async (_url, options) => {
    const evidence = JSON.parse(JSON.parse(options.body).contents[0].parts[0].text);
    assert.equal(evidence.codeChanged, false);
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ strengths: [{ text: "Wrote a clean solution", evidence: answer }], areasToImprove: ["Write the solution."], personalizedFeedback: "No implementation was submitted.", communication: null }) }] } }] });
  } } });
  const response = await load("app/api/interviewer/feedback/route.ts").POST(jsonRequest("/api/interviewer/feedback", { ...scoringInput, code: "  ", messages: [{ id: "answer", role: "candidate", text: answer, timestamp: "Now" }] }));
  assert.equal(response.status, 200); assert.equal((await response.json()).feedback.strengths.length, 0);
});
