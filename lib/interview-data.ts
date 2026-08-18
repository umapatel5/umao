import type { FeedbackItem, InterviewMetric, InterviewSession } from "@/types/interview";

export const metrics: InterviewMetric[] = [
  { label: "Mock interviews", value: "12", trend: "+3 this week" },
  { label: "Average score", value: "82%", trend: "+6%" },
  { label: "Problem coverage", value: "7/10", trend: "DSA track" }
];

export const sessions: InterviewSession[] = [
  {
    id: "system-design-lite",
    title: "Backend Coding Screen",
    company: "Northstar Labs",
    role: "Full Stack Engineer",
    language: "TypeScript",
    difficulty: "Medium",
    durationMinutes: 45,
    status: "ready",
    focusAreas: ["arrays", "API reasoning", "testing"]
  },
  {
    id: "frontend-state",
    title: "Frontend Architecture Round",
    company: "Atlas Health",
    role: "Senior Frontend Engineer",
    language: "React",
    difficulty: "Senior",
    durationMinutes: 60,
    status: "scheduled",
    focusAreas: ["state modeling", "accessibility", "performance"]
  },
  {
    id: "warmup-dsa",
    title: "DSA Warmup",
    company: "Practice Mode",
    role: "Software Engineer",
    language: "Python",
    difficulty: "Warmup",
    durationMinutes: 30,
    status: "completed",
    focusAreas: ["hash maps", "edge cases", "complexity"]
  }
];

export const feedback: FeedbackItem[] = [
  {
    title: "Problem framing",
    detail: "Clarified inputs and constraints before coding, then restated the target complexity.",
    tone: "strength"
  },
  {
    title: "Implementation pace",
    detail: "Reached a working solution with time left for tests and a small refactor.",
    tone: "strength"
  },
  {
    title: "Tradeoff narration",
    detail: "Add more explicit reasoning when choosing between memory and runtime approaches.",
    tone: "improvement"
  }
];
