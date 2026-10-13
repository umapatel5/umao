import type { InterviewMessage } from "@/types/interviewer";
import type { InterviewQualitativeFeedback, RubricScore } from "@/types/interview-results";
import { isRecord } from "@/lib/security/request-guard";

export function assessFeedback(raw: unknown, messages: InterviewMessage[], codeChanged: boolean): { feedback: InterviewQualitativeFeedback; communication: RubricScore | null } {
  if (!isRecord(raw)) throw new Error("Invalid feedback.");
  const answers = messages.filter((message) => message.role === "candidate");
  const evidence = (quote: unknown) => typeof quote === "string" && quote.trim().length >= 8 && quote.length <= 2000 && answers.some((answer) => answer.text.includes(quote));
  const list = (value: unknown): value is string[] => Array.isArray(value) && value.length <= 3 && value.every((item) => typeof item === "string" && item.length <= 2000);
  if (!list(raw.areasToImprove) || typeof raw.personalizedFeedback !== "string" || raw.personalizedFeedback.length > 5000) throw new Error("Invalid feedback.");
  const strengths = Array.isArray(raw.strengths) ? raw.strengths.slice(0, 3)
    .filter((item) => isRecord(item) && typeof item.text === "string" && item.text.length <= 2000 && evidence(item.evidence) && (codeChanged || !/\b(wrote|implemented|coded|optimal solution|clean solution|used enumerate)\b/i.test(item.text)))
    .map((item) => `${item.text} Evidence: "${item.evidence}"`) : [];
  const substantive = answers.filter((answer) => answer.text.trim().split(/\s+/).length >= 12 && !/^(idk|i don'?t know|how are you|hello|thanks|okay)\b/i.test(answer.text.trim())).length;
  const dimensions = raw.communication;
  const valid = substantive >= 3 && isRecord(dimensions) && evidence(dimensions.evidence) &&
    [dimensions.relevance, dimensions.clarity, dimensions.reasoning].every((value) => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100);
  const communication: RubricScore | null = valid ? {
    label: "Communication", assessed: true,
    score: Math.round(((dimensions.relevance as number) + (dimensions.clarity as number) + (dimensions.reasoning as number)) / 3),
    summary: "AI assessment of relevance, clarity, and explanation quality, not speaking time or camera presence.",
    signals: [`Relevance: ${dimensions.relevance}/100`, `Clarity: ${dimensions.clarity}/100`, `Reasoning: ${dimensions.reasoning}/100`, `Evidence: ${dimensions.evidence}`]
  } : null;
  return { communication, feedback: { strengths, areasToImprove: raw.areasToImprove, personalizedFeedback: raw.personalizedFeedback, provider: "llm" } };
}
