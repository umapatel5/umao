import { readDatabase, updateDatabase, type StoredInterviewResult } from "@/lib/db/local-db";
import type { InterviewProgressSummary, SavedInterviewResult } from "@/types/account";
import type { InterviewResult } from "@/types/interview-results";

export async function saveResultForUser(userId: string, result: InterviewResult, codingProblem: string) {
  const savedResult: StoredInterviewResult = {
    codingProblem,
    codingScore: result.scores.coding.score,
    communicationScore: result.scores.communication.score,
    completedAt: result.completedAt,
    feedback: result.feedback.personalizedFeedback,
    id: crypto.randomUUID(),
    improvementAreas: result.feedback.areasToImprove.slice(0, 3),
    overallScore: result.scores.overall,
    problemSolvingScore: result.scores.problemSolving.score,
    sessionId: result.sessionId,
    strengths: result.feedback.strengths.slice(0, 3),
    userId
  };

  await updateDatabase((database) => {
    database.interviewResults.push(savedResult);
  });

  return toSavedResult(savedResult);
}

export async function getResultForUser(userId: string, resultId: string) {
  const database = await readDatabase();
  const result = database.interviewResults.find((item) => item.id === resultId && item.userId === userId);

  return result ? toSavedResult(result) : null;
}

export async function listResultsForUser(userId: string) {
  const database = await readDatabase();

  return database.interviewResults
    .filter((result) => result.userId === userId)
    .sort((first, second) => new Date(second.completedAt).getTime() - new Date(first.completedAt).getTime())
    .map(toSavedResult);
}

export function summarizeProgress(results: SavedInterviewResult[]): InterviewProgressSummary {
  if (!results.length) {
    return {
      averageOverallScore: 0,
      bestOverallScore: 0,
      communicationTrend: 0,
      completedCount: 0,
      latestOverallScore: 0,
      overallTrend: 0
    };
  }

  const chronological = [...results].sort(
    (first, second) => new Date(first.completedAt).getTime() - new Date(second.completedAt).getTime()
  );
  const first = chronological[0];
  const latest = chronological[chronological.length - 1];
  const averageOverallScore = Math.round(
    results.reduce((sum, result) => sum + result.overallScore, 0) / results.length
  );

  return {
    averageOverallScore,
    bestOverallScore: Math.max(...results.map((result) => result.overallScore)),
    communicationTrend: latest.communicationScore - first.communicationScore,
    completedCount: results.length,
    latestOverallScore: latest.overallScore,
    overallTrend: latest.overallScore - first.overallScore
  };
}

function toSavedResult(result: StoredInterviewResult): SavedInterviewResult {
  return {
    codingProblem: result.codingProblem,
    codingScore: result.codingScore,
    communicationScore: result.communicationScore,
    completedAt: result.completedAt,
    feedback: result.feedback,
    id: result.id,
    improvementAreas: result.improvementAreas,
    overallScore: result.overallScore,
    problemSolvingScore: result.problemSolvingScore,
    sessionId: result.sessionId,
    strengths: result.strengths,
    userId: result.userId
  };
}
