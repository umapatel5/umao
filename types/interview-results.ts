import type { SpeakingMetrics, WebcamAnalysisMetrics } from "@/types/candidate-analysis";
import type { CodeRunResponse } from "@/types/code-execution";
import type { InterviewMessage } from "@/types/interviewer";
import type { InterviewRole, ProblemCategory, ProblemDifficulty } from "@/types/problem";

export type InterviewScoringInput = {
  code: string;
  difficulty: ProblemDifficulty;
  hintsUsed: number;
  language: string;
  latestRun: CodeRunResponse | null;
  messages: InterviewMessage[];
  problemId: string;
  problemTitle: string;
  role: InterviewRole;
  speakingMetrics: SpeakingMetrics;
  topic: ProblemCategory;
  topics: ProblemCategory[];
  webcamMetrics: WebcamAnalysisMetrics;
};

export type RubricScore = {
  label: string;
  score: number;
  summary: string;
  signals: string[];
};

export type DeterministicInterviewScores = {
  coding: RubricScore;
  communication: RubricScore;
  overall: number;
  problemSolving: RubricScore;
};

export type InterviewQualitativeFeedback = {
  areasToImprove: string[];
  personalizedFeedback: string;
  provider: "deterministic-local" | "llm";
  strengths: string[];
};

export type InterviewResult = {
  completedAt: string;
  feedback: InterviewQualitativeFeedback;
  input: InterviewScoringInput;
  scores: DeterministicInterviewScores;
  sessionId: string;
};
