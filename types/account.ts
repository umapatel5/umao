import type { InterviewRole, ProblemCategory, ProblemDifficulty } from "@/types/problem";

export type AuthUser = {
  email: string;
  id: string;
  name: string;
};

export type SavedInterviewResult = {
  codingProblem: string;
  codingScore: number;
  communicationScore: number;
  completedAt: string;
  difficulty: ProblemDifficulty;
  feedback: string;
  id: string;
  improvementAreas: string[];
  overallScore: number;
  problemSolvingScore: number;
  role: InterviewRole;
  sessionId: string;
  strengths: string[];
  topic: ProblemCategory;
  topics: ProblemCategory[];
  userId: string;
};

export type InterviewProgressSummary = {
  averageOverallScore: number;
  bestOverallScore: number;
  communicationTrend: number;
  completedCount: number;
  codingTrend: number;
  latestOverallScore: number;
  overallTrend: number;
  problemSolvingTrend: number;
};

export type TopicPerformance = {
  averageOverallScore: number;
  attempts: number;
  topic: ProblemCategory;
};

export type DifficultyPerformance = {
  averageOverallScore: number;
  attempts: number;
  difficulty: ProblemDifficulty;
};

export type InterviewAnalytics = {
  averageScoreByDifficulty: DifficultyPerformance[];
  communicationScoreTrend: number[];
  codingScoreTrend: number[];
  overallScoreTrend: number[];
  problemSolvingScoreTrend: number[];
  recommendedTopic: ProblemCategory | null;
  strongestTopics: TopicPerformance[];
  weakestTopics: TopicPerformance[];
};
