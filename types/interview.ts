export type InterviewStatus = "ready" | "scheduled" | "completed";

export type InterviewSession = {
  id: string;
  title: string;
  company: string;
  role: string;
  language: string;
  difficulty: "Warmup" | "Medium" | "Senior";
  durationMinutes: number;
  status: InterviewStatus;
  focusAreas: string[];
};

export type InterviewMetric = {
  label: string;
  value: string;
  trend?: string;
};

export type FeedbackItem = {
  title: string;
  detail: string;
  tone: "strength" | "improvement" | "neutral";
};
