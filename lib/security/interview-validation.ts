import { codingProblems, interviewRoles, problemCategories, problemDifficulties } from "@/lib/problems/problem-library";
import { isRecord } from "@/lib/security/request-guard";
import type { InterviewerContext } from "@/types/interviewer";
import type { InterviewResult } from "@/types/interview-results";

const text = (value: unknown, max: number) => typeof value === "string" && value.length <= max;
const list = (value: unknown, max = 3) => Array.isArray(value) && value.length <= max && value.every((item) => text(item, 5000));
export function validMessages(value: unknown) {
  return Array.isArray(value) && value.length <= 150 && value.every((message) => isRecord(message) && ["candidate", "interviewer", "system"].includes(String(message.role)) && text(message.text, 5000));
}
export function validRun(value: unknown) {
  return value === null || (isRecord(value) && typeof value.passed === "boolean" && Array.isArray(value.results) && value.results.length <= 50 && value.results.every((item) => isRecord(item) && typeof item.passed === "boolean"));
}
export function validInterviewerContext(value: unknown): value is InterviewerContext {
  return isRecord(value) && text(value.candidateMessage, 5000) && text(value.currentCode, 20_000) && text(value.language, 20) &&
    interviewRoles.includes(value.role as never) && problemDifficulties.includes(value.selectedDifficulty as never) && problemCategories.includes(value.selectedTopic as never) &&
    validMessages(value.messages) && validRun(value.latestRun) && isRecord(value.problem) && text(value.problem.title, 200) && text(value.problem.prompt, 10_000) && list(value.problem.constraints, 30) && Array.isArray(value.problem.examples) && value.problem.examples.length <= 20;
}
export function validResult(value: unknown): value is InterviewResult {
  if (!isRecord(value) || !text(value.sessionId, 100) || !value.sessionId || !text(value.completedAt, 50) || !Number.isFinite(Date.parse(String(value.completedAt)))) return false;
  const { input, scores, feedback } = value;
  const score = (n: unknown) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100;
  return isRecord(input) && codingProblems.some((problem) => problem.id === input.problemId) && text(input.problemTitle, 200) &&
    interviewRoles.includes(input.role as never) && problemDifficulties.includes(input.difficulty as never) && problemCategories.includes(input.topic as never) && Array.isArray(input.topics) && input.topics.length <= 6 && input.topics.every((topic) => problemCategories.includes(topic)) &&
    isRecord(scores) && score(scores.overall) && [scores.coding, scores.communication, scores.problemSolving].every((item) => isRecord(item) && score(item.score)) &&
    isRecord(feedback) && text(feedback.personalizedFeedback, 5000) && list(feedback.strengths) && list(feedback.areasToImprove);
}
