import { readDatabase, updateDatabase, type StoredInterviewResult } from "@/lib/db/local-db";
import type { SavedInterviewResult } from "@/types/account";
import type { InterviewResult } from "@/types/interview-results";

export async function saveResultForUser(userId: string, result: InterviewResult, codingProblem: string) {
  const savedResult: StoredInterviewResult = {
    codingProblem,
    codingScore: result.scores.coding.score,
    communicationScore: result.scores.communication.score,
    completedAt: result.completedAt,
    difficulty: result.input.difficulty,
    feedback: result.feedback.personalizedFeedback,
    id: crypto.randomUUID(),
    improvementAreas: result.feedback.areasToImprove.slice(0, 3),
    overallScore: result.scores.overall,
    problemSolvingScore: result.scores.problemSolving.score,
    role: result.input.role,
    sessionId: result.sessionId,
    strengths: result.feedback.strengths.slice(0, 3),
    topic: result.input.topic,
    topics: result.input.topics,
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

function toSavedResult(result: StoredInterviewResult): SavedInterviewResult {
  return {
    codingProblem: result.codingProblem,
    codingScore: result.codingScore,
    communicationScore: result.communicationScore,
    completedAt: result.completedAt,
    difficulty: result.difficulty ?? "Medium",
    feedback: result.feedback,
    id: result.id,
    improvementAreas: result.improvementAreas,
    overallScore: result.overallScore,
    problemSolvingScore: result.problemSolvingScore,
    role: result.role ?? "Software Engineer",
    sessionId: result.sessionId,
    strengths: result.strengths,
    topic: result.topic ?? result.topics?.[0] ?? "Arrays",
    topics: result.topics?.length ? result.topics : ["Arrays"],
    userId: result.userId
  };
}
