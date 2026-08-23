import type { InterviewRole, ProblemCategory, ProblemDifficulty } from "@/types/problem";

export type InterviewPreferences = {
  autoPlayInterviewerSpeech: boolean;
  difficulty: ProblemDifficulty;
  microphoneReminders: boolean;
  role: InterviewRole;
  topic: ProblemCategory;
  webcamReminders: boolean;
};
