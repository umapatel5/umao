import type { SupportedExecutionLanguage } from "@/types/code-execution";

export type ProblemDifficulty = "Easy" | "Medium" | "Hard";

export type InterviewRole =
  | "Software Engineer"
  | "Front-End Engineer"
  | "Back-End Engineer"
  | "Full-Stack Engineer"
  | "Developer Tools Engineer";

export type ProblemCategory =
  | "Arrays"
  | "Strings"
  | "Hash Maps"
  | "Trees"
  | "Graphs"
  | "Dynamic Programming";

export type CodingProblemTestCase = {
  expected: unknown;
  input: unknown[];
  name: string;
};

export type CodingProblem = {
  constraints: string[];
  difficulty: ProblemDifficulty;
  durationMinutes: number;
  examples: Array<{
    input: string;
    output: string;
  }>;
  functionName: {
    camel: string;
    snake: string;
  };
  id: string;
  interviewerPrompt: string;
  prompt: string;
  starterCode: Record<SupportedExecutionLanguage, string>;
  testCases: CodingProblemTestCase[];
  title: string;
  topics: ProblemCategory[];
};
