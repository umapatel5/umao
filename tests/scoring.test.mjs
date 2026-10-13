import test from "node:test";
import assert from "node:assert/strict";
import { createLoader, scoringInput } from "./helpers.mjs";

const load = createLoader();
const { scoreInterview } = load("lib/scoring/interview-scoring.ts");
const { generateQualitativeFeedback } = load("lib/scoring/qualitative-feedback.ts");
const { assessFeedback } = load("lib/scoring/feedback-assessment.ts");

test("an empty interview has no coding or reasoning credit", () => {
  const result = scoreInterview(scoringInput);
  assert.equal(result.coding.score, 0); assert.equal(result.problemSolving.score, 0); assert.equal(result.overall, 0);
});
test("fast failed execution does not earn coding points", () => {
  const result = scoreInterview({ ...scoringInput, latestRun: { passed: false, runtimeMs: 1, results: [{ passed: false, error: "Wrong answer" }] } });
  assert.equal(result.coding.score, 0);
});
test("passing tests earn coding credit", () => {
  const result = scoreInterview({ ...scoringInput, latestRun: { passed: true, runtimeMs: 1, results: [{ passed: true }] } });
  assert.equal(result.coding.score, 100);
});
test("partial credit stays below solved score", () => {
  const result = scoreInterview({ ...scoringInput, latestRun: { passed: false, runtimeMs: 1, results: [{ passed: true }, { passed: false, error: "Wrong answer" }] } });
  assert(result.coding.score > 0 && result.coding.score < 100); assert.match(result.coding.summary, /Not solved/);
});
test("face presence and speaking time cannot create communication credit", () => {
  const result = scoreInterview({ ...scoringInput, speakingMetrics: { speakingDurationMs: 90000, pauseCount: 0 }, webcamMetrics: { ...scoringInput.webcamMetrics, faceState: "detected" } });
  assert.equal(result.communication.assessed, false); assert.equal(result.communication.score, 0);
});
test("empty interview fallback invents no strengths", () => assert.equal(generateQualitativeFeedback(scoreInterview(scoringInput)).strengths.length, 0));

const answer = "I built a scheduling app and handled API input validation to prevent conflicting reservations.";
const messages = Array.from({ length: 3 }, (_, index) => ({ id: String(index), role: "candidate", text: `${answer} ${index}`, timestamp: "Now" }));
const raw = { strengths: [{ text: "Explained input validation", evidence: answer }], areasToImprove: ["Describe a concrete test case."], personalizedFeedback: "Explain your tradeoff with an example.", communication: { relevance: 60, clarity: 70, reasoning: 80, evidence: answer } };
test("communication needs sufficient candidate evidence", () => assert.equal(assessFeedback(raw, messages.slice(0, 1), true).communication, null));
test("communication dimensions are averaged, not participation", () => assert.equal(assessFeedback(raw, messages, true).communication.score, 70));
test("invented evidence and interviewer quotes are rejected", () => {
  const result = assessFeedback({ ...raw, strengths: [{ text: "Great code", evidence: "Invented words not spoken" }], communication: { ...raw.communication, evidence: "Invented words not spoken" } }, messages, true);
  assert.equal(result.feedback.strengths.length, 0); assert.equal(result.communication, null);
});
test("starter-code implementation praise is rejected", () => {
  assert.equal(assessFeedback({ ...raw, strengths: [{ text: "Wrote a clean solution", evidence: answer }] }, messages, false).feedback.strengths.length, 0);
});
test("invalid communication numbers are rejected", () => {
  for (const value of [101, -1, "100", 70.5]) assert.equal(assessFeedback({ ...raw, communication: { ...raw.communication, relevance: value } }, messages, true).communication, null);
});
test("malformed feedback fails validation", () => assert.throws(() => assessFeedback({ ...raw, areasToImprove: [null] }, messages, true), /Invalid feedback/));
