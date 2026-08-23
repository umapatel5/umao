import type { CodeRunResponse } from "@/types/code-execution";
import type { InterviewRole, ProblemCategory, ProblemDifficulty } from "@/types/problem";

export type InterviewMessageRole = "interviewer" | "candidate" | "system";

export type InterviewMessage = {
  id: string;
  role: InterviewMessageRole;
  text: string;
  timestamp: string;
};

export type InterviewerContext = {
  problem: {
    title: string;
    prompt: string;
    constraints: string[];
    examples: Array<{
      input: string;
      output: string;
    }>;
    interviewerPrompt?: string;
  };
  role: InterviewRole;
  selectedDifficulty: ProblemDifficulty;
  selectedTopic: ProblemCategory;
  currentCode: string;
  language: string;
  latestRun: CodeRunResponse | null;
  messages: InterviewMessage[];
  candidateMessage: string;
};

export type InterviewerResponse = {
  message: InterviewMessage;
  provider: "mock" | "openai";
};
