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
  feedback: string;
  id: string;
  improvementAreas: string[];
  overallScore: number;
  problemSolvingScore: number;
  sessionId: string;
  strengths: string[];
  userId: string;
};

export type InterviewProgressSummary = {
  averageOverallScore: number;
  bestOverallScore: number;
  communicationTrend: number;
  completedCount: number;
  latestOverallScore: number;
  overallTrend: number;
};
