"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, ArrowRight, BarChart3, Target } from "lucide-react";
import { buildInterviewAnalytics, summarizeProgress } from "@/lib/results/analytics";
import type { InterviewAnalytics, InterviewProgressSummary, SavedInterviewResult } from "@/types/account";

type HistoryPayload = {
  analytics: InterviewAnalytics;
  progress: InterviewProgressSummary;
  results: SavedInterviewResult[];
};

const emptyPayload: HistoryPayload = {
  analytics: buildInterviewAnalytics([]),
  progress: summarizeProgress([]),
  results: []
};

export function DashboardAnalytics() {
  const [payload, setPayload] = useState<HistoryPayload>(emptyPayload);
  const [isHistoryAvailable, setIsHistoryAvailable] = useState(true);
  const hasSavedResults = payload.results.length > 0;

  useEffect(() => {
    fetch("/api/history")
      .then(async (response) => {
        if (!response.ok) {
          setIsHistoryAvailable(false);
          return null;
        }

        return (await response.json()) as HistoryPayload;
      })
      .then((history) => {
        if (history) {
          setPayload(history);
        }
      })
      .catch(() => setIsHistoryAvailable(false));
  }, []);

  return (
    <section className="analytics-panel card panel" aria-labelledby="analytics-title">
      <div className="results-section-header">
        <div>
          <h2 className="section-title" id="analytics-title">
            Progress analytics
          </h2>
          <div className="meta">
            {hasSavedResults
              ? "Based on your saved interviews."
              : "Complete an interview while logged in to start building a real trend."}
          </div>
        </div>
        <Link className="button button-secondary" href="/practice">
          Practice {payload.analytics.recommendedTopic ?? "Arrays"}
          <ArrowRight aria-hidden size={16} />
        </Link>
      </div>

      {!hasSavedResults ? (
        <div className="analytics-empty-state">
          <strong>No saved interviews yet</strong>
          <p>
            {isHistoryAvailable
              ? "Your dashboard will show score trends, topic strengths, and recommended practice once you submit an interview."
              : "Log in to save interviews and unlock personalized progress tracking across sessions."}
          </p>
        </div>
      ) : null}

      <div className="analytics-grid">
        <TrendCard label="Overall" trend={payload.analytics.overallScoreTrend} />
        <TrendCard label="Coding" trend={payload.analytics.codingScoreTrend} />
        <TrendCard label="Communication" trend={payload.analytics.communicationScoreTrend} />
        <TrendCard label="Problem solving" trend={payload.analytics.problemSolvingScoreTrend} />
      </div>

      <div className="analytics-detail-grid">
        <AnalyticsList
          icon={Target}
          emptyText="No topic strengths yet."
          items={payload.analytics.strongestTopics.map((topic) => `${topic.topic}: ${topic.averageOverallScore}%`)}
          title="Strongest topics"
        />
        <AnalyticsList
          icon={Activity}
          emptyText="No focus topic yet."
          items={payload.analytics.weakestTopics.map((topic) => `${topic.topic}: ${topic.averageOverallScore}%`)}
          title="Weakest topics"
        />
        <AnalyticsList
          icon={BarChart3}
          items={payload.analytics.averageScoreByDifficulty.map(
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
  emptyText = "Nothing to show yet.",
  icon: Icon,
  items,
  title
}: {
  emptyText?: string;
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
        {items.length ? items.map((item) => <li key={item}>{item}</li>) : <li>{emptyText}</li>}
      </ul>
    </div>
  );
}
