"use client";

import { generateQualitativeFeedback } from "@/lib/scoring/qualitative-feedback";
import { scoreInterview } from "@/lib/scoring/interview-scoring";
import type { InterviewResult, InterviewScoringInput } from "@/types/interview-results";

const resultPrefix = "umao:interview-result:";

export function createInterviewResult(sessionId: string, input: InterviewScoringInput): InterviewResult {
  const scores = scoreInterview(input);

  return {
    completedAt: new Date().toISOString(),
    feedback: generateQualitativeFeedback(scores),
    input,
    scores,
    sessionId
  };
}

export function saveInterviewResult(result: InterviewResult) {
  window.sessionStorage.setItem(getResultKey(result.sessionId), JSON.stringify(result));
}

export function readInterviewResult(sessionId: string): InterviewResult | null {
  const rawResult = window.sessionStorage.getItem(getResultKey(sessionId));

  if (!rawResult) {
    return null;
  }

  try {
    return JSON.parse(rawResult) as InterviewResult;
  } catch {
    return null;
  }
}

function getResultKey(sessionId: string) {
  return `${resultPrefix}${sessionId}`;
}
