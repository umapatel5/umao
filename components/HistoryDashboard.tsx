"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, BarChart3, Calendar, Target, TrendingUp } from "lucide-react";
import type { AuthUser, InterviewAnalytics, InterviewProgressSummary, SavedInterviewResult } from "@/types/account";

type HistoryPayload = {
  analytics: InterviewAnalytics;
  error?: string;
  progress: InterviewProgressSummary;
  results: SavedInterviewResult[];
  user: AuthUser;
};

export function HistoryDashboard() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [payload, setPayload] = useState<HistoryPayload | null>(null);

  useEffect(() => {
    fetch("/api/history")
      .then(async (response) => {
        const body = (await response.json()) as HistoryPayload;

        if (!response.ok) {
          throw new Error(body.error ?? "Could not load interview history.");
        }

        setPayload(body);
      })
      .catch((historyError: Error) => setError(historyError.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="console-notice">Loading interview history...</div>;
  }

  if (error) {
    return (
      <section className="card panel empty-history">
        <h2 className="section-title">Login required</h2>
        <p>{error}</p>
            <Link className="button button-primary" href="/login">
              Login to view history
            </Link>
      </section>
    );
  }

  if (!payload) {
    return null;
  }

  return (
    <div className="history-dashboard">
      <section className="grid grid-3" aria-label="Progress over time">
        <ProgressCard label="Completed" value={String(payload.progress.completedCount)} detail="saved interviews" />
        <ProgressCard label="Average score" value={`${payload.progress.averageOverallScore}%`} detail={formatTrend(payload.progress.overallTrend)} />
        <ProgressCard label="Best score" value={`${payload.progress.bestOverallScore}%`} detail={`Latest ${payload.progress.latestOverallScore}%`} />
      </section>

      {payload.results.length ? (
        <section className="card panel history-card">
          <div className="results-section-header">
            <div>
              <h2 className="section-title">Saved sessions</h2>
              <div className="meta">Open any previous result without rerunning the interview.</div>
            </div>
            <span className="pill pill-ready">
              <TrendingUp aria-hidden size={14} />
              Communication trend {formatTrend(payload.progress.communicationTrend)}
            </span>
          </div>

          <HistoryInsights analytics={payload.analytics} />

          <div className="history-list">
            {payload.results.map((result) => (
              <Link className="history-row" href={`/results/${result.id}`} key={result.id}>
                <div>
                  <div className="history-row-title">{result.codingProblem}</div>
                  <div className="history-row-context">
                    <span>{result.role}</span>
                    <span>{result.difficulty}</span>
                    <span>{result.topic}</span>
                  </div>
                  <div className="meta">
                    <Calendar aria-hidden size={13} />
                    {formatDate(result.completedAt)}
                  </div>
                </div>
                <ScoreCluster result={result} />
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="card panel empty-history">
          <h2 className="section-title">No saved interviews yet</h2>
          <p>Complete and submit a practice interview while logged in to start tracking progress.</p>
          <Link className="button button-primary" href="/practice">
            Start practice
          </Link>
        </section>
      )}
    </div>
  );
}

function HistoryInsights({ analytics }: { analytics: InterviewAnalytics }) {
  const strongestTopic = analytics.strongestTopics[0];
  const weakestTopic = analytics.weakestTopics[0];

  return (
    <div className="history-insights-grid" aria-label="Interview analytics">
      <InsightCard
        detail={strongestTopic ? `${strongestTopic.averageOverallScore}% average` : "Complete an interview to measure this."}
        icon={Target}
        label="Strongest topic"
        value={strongestTopic?.topic ?? "Not enough data"}
      />
      <InsightCard
        detail={weakestTopic ? `${weakestTopic.averageOverallScore}% average` : "Complete an interview to measure this."}
        icon={Activity}
        label="Focus topic"
        value={analytics.recommendedTopic ?? "Arrays"}
      />
      <div className="history-difficulty-card">
        <h3>
          <BarChart3 aria-hidden size={16} />
          Average by difficulty
        </h3>
        <div>
          {analytics.averageScoreByDifficulty.map((item) => (
            <span key={item.difficulty}>
              {item.difficulty}: {item.attempts ? `${item.averageOverallScore}%` : "No attempts"}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function InsightCard({
  detail,
  icon: Icon,
  label,
  value
}: {
  detail: string;
  icon: typeof Target;
  label: string;
  value: string;
}) {
  return (
    <div className="history-insight-card">
      <Icon aria-hidden size={16} />
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  );
}

function ProgressCard({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <section className="card panel history-progress-card">
      <BarChart3 aria-hidden size={18} />
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      <div className="meta">{detail}</div>
    </section>
  );
}

function ScoreCluster({ result }: { result: SavedInterviewResult }) {
  return (
    <div className="history-score-cluster">
      <span>{result.codingScore} Coding</span>
      <span>{result.problemSolvingScore} Problem</span>
      <span>{result.communicationScore} Comms</span>
      <strong>{result.overallScore}</strong>
    </div>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(date));
}

function formatTrend(value: number) {
  if (value > 0) {
    return `+${value} over time`;
  }

  if (value < 0) {
    return `${value} over time`;
  }

  return "steady";
}
