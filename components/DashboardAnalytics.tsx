"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, BarChart3, Target } from "lucide-react";
import { buildInterviewAnalytics, summarizeProgress } from "@/lib/results/analytics";
import type { InterviewAnalytics, InterviewProgressSummary, SavedInterviewResult } from "@/types/account";

type HistoryPayload = {
  analytics: InterviewAnalytics;
  progress: InterviewProgressSummary;
  results: SavedInterviewResult[];
};

const mockResults: SavedInterviewResult[] = [
  {
    codingProblem: "Two Sum With Interview Follow-up",
    codingScore: 74,
    communicationScore: 69,
    completedAt: "2026-08-18T14:30:00.000Z",
    difficulty: "Easy",
    feedback: "Good baseline. Keep making complexity explicit.",
    id: "mock-1",
    improvementAreas: ["Talk through edge cases earlier."],
    overallScore: 72,
    problemSolvingScore: 73,
    role: "Software Engineer",
    sessionId: "two-sum-follow-up",
    strengths: ["Clear implementation direction."],
    topic: "Arrays",
    topics: ["Arrays", "Hash Maps"],
    userId: "mock"
  },
  {
    codingProblem: "Valid Palindrome",
    codingScore: 82,
    communicationScore: 76,
    completedAt: "2026-08-19T14:30:00.000Z",
    difficulty: "Easy",
    feedback: "Strong improvement in explanation.",
    id: "mock-2",
    improvementAreas: ["Be more precise with test coverage."],
    overallScore: 80,
    problemSolvingScore: 82,
    role: "Front-End Engineer",
    sessionId: "valid-palindrome",
    strengths: ["Good two-pointer explanation."],
    topic: "Strings",
    topics: ["Strings"],
    userId: "mock"
  },
  {
    codingProblem: "Coin Change",
    codingScore: 58,
    communicationScore: 72,
    completedAt: "2026-08-20T14:30:00.000Z",
    difficulty: "Hard",
    feedback: "DP recurrence needs more practice.",
    id: "mock-3",
    improvementAreas: ["Practice dynamic programming recurrence design."],
    overallScore: 65,
    problemSolvingScore: 62,
    role: "Back-End Engineer",
    sessionId: "coin-change",
    strengths: ["Stayed calm through a harder prompt."],
    topic: "Dynamic Programming",
    topics: ["Dynamic Programming", "Arrays"],
    userId: "mock"
  }
];

export function DashboardAnalytics() {
  const [payload, setPayload] = useState<HistoryPayload | null>(null);
  const mockPayload = useMemo(
    () => ({
      analytics: buildInterviewAnalytics(mockResults),
      progress: summarizeProgress(mockResults),
      results: mockResults
    }),
    []
  );
  const data = payload?.results.length ? payload : mockPayload;

  useEffect(() => {
    fetch("/api/history")
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        return (await response.json()) as HistoryPayload;
      })
      .then((history) => setPayload(history))
      .catch(() => setPayload(null));
  }, []);

  return (
    <section className="analytics-panel card panel" aria-labelledby="analytics-title">
      <div className="results-section-header">
        <div>
          <h2 className="section-title" id="analytics-title">
            Progress analytics
          </h2>
          <div className="meta">Based on saved interviews, with mock trend data shown until history grows.</div>
        </div>
        <Link className="button button-secondary" href="/practice">
          Practice {data.analytics.recommendedTopic ?? "Arrays"}
          <ArrowRight aria-hidden size={16} />
        </Link>
      </div>

      <div className="analytics-grid">
        <TrendCard label="Overall" trend={data.analytics.overallScoreTrend} />
        <TrendCard label="Coding" trend={data.analytics.codingScoreTrend} />
        <TrendCard label="Communication" trend={data.analytics.communicationScoreTrend} />
        <TrendCard label="Problem solving" trend={data.analytics.problemSolvingScoreTrend} />
      </div>

      <div className="analytics-detail-grid">
        <AnalyticsList
          icon={Target}
          items={data.analytics.strongestTopics.map((topic) => `${topic.topic}: ${topic.averageOverallScore}%`)}
          title="Strongest topics"
        />
        <AnalyticsList
          icon={Activity}
          items={data.analytics.weakestTopics.map((topic) => `${topic.topic}: ${topic.averageOverallScore}%`)}
          title="Weakest topics"
        />
        <AnalyticsList
          icon={BarChart3}
          items={data.analytics.averageScoreByDifficulty.map(
            (item) => `${item.difficulty}: ${item.attempts ? `${item.averageOverallScore}%` : "No attempts"}`
          )}
          title="Average by difficulty"
        />
      </div>
    </section>
  );
}

function TrendCard({ label, trend }: { label: string; trend: number[] }) {
  const latest = trend.at(-1) ?? 0;
  const first = trend[0] ?? latest;
  const delta = latest - first;

  return (
    <div className="trend-card">
      <span>{label}</span>
      <strong>{latest}%</strong>
      <div className={delta >= 0 ? "trend-positive" : "trend-negative"}>
        {delta >= 0 ? "+" : ""}
        {delta} over time
      </div>
      <div className="sparkline" aria-hidden>
        {trend.map((score, index) => (
          <i key={`${label}-${index}`} style={{ height: `${Math.max(12, score)}%` }} />
        ))}
      </div>
    </div>
  );
}

function AnalyticsList({
  icon: Icon,
  items,
  title
}: {
  icon: typeof Target;
  items: string[];
  title: string;
}) {
  return (
    <div className="analytics-list">
      <h3>
        <Icon aria-hidden size={16} />
        {title}
      </h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
