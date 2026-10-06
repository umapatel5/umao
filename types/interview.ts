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
