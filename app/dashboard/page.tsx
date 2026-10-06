import Link from "next/link";
import { ArrowRight, Braces } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DashboardAnalytics } from "@/components/DashboardAnalytics";
import { FeedbackList } from "@/components/FeedbackList";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { codingProblems, interviewRoles, problemCategories } from "@/lib/problems/problem-library";
import type { FeedbackItem, InterviewMetric } from "@/types/interview";

const dashboardMetrics: InterviewMetric[] = [
  { label: "Problems", value: String(codingProblems.length), trend: "ready to practice" },
  { label: "Languages", value: "4", trend: "Python, JS, Java, C++" },
  { label: "Role tracks", value: String(interviewRoles.length), trend: "role-specific prompts" }
];

const dashboardTips: FeedbackItem[] = [
  {
    detail: "Start every session by saying the brute-force idea, then explain why your optimized approach is better.",
    title: "Explain the tradeoff",
    tone: "neutral"
  },
  {
    detail: "Run the tests before submitting and use the first failing case to guide your next explanation.",
    title: "Use tests as signal",
    tone: "neutral"
  },
  {
    detail: "After the code passes, summarize time complexity, space complexity, and one edge case you would add.",
    title: "Close like an interview",
    tone: "neutral"
  }
];

const suggestedProblems = codingProblems.slice(0, 3);

export default function DashboardPage() {
  return (
    <AppShell active="dashboard">
      <PageHeader
        eyebrow="Dashboard"
        title="Your Umao interview workspace"
        copy="Jump into practice, review recent sessions, and track progress across coding, communication, and problem-solving."
        actions={
          <Link className="button button-primary" href="/practice">
            <Braces aria-hidden size={17} />
            Start practice
          </Link>
        }
      />

      <section className="grid grid-3" aria-label="Current Umao workspace stats">
        {dashboardMetrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <DashboardAnalytics />

      <section className="grid grid-2 dashboard-content-grid">
        <div className="card panel">
          <div className="results-section-header">
            <div>
              <h2 className="section-title">Suggested practice</h2>
              <div className="meta">
                Pick a problem from the real library. Topics available: {problemCategories.join(", ")}.
              </div>
            </div>
            <Link className="button button-secondary" href="/practice">
              Problem library
              <ArrowRight aria-hidden size={16} />
            </Link>
          </div>

          <div className="session-list">
            {suggestedProblems.map((problem) => (
              <article className="session-row" key={problem.id}>
                <div>
                  <h3 className="session-title">{problem.title}</h3>
                  <div className="meta">
                    {problem.difficulty} · {problem.durationMinutes} min · {problem.topics.join(", ")}
                  </div>
                  <div className="toolbar" style={{ marginTop: 10 }}>
                    {problem.topics.slice(0, 2).map((topic) => (
                      <span className="pill" key={topic}>
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                <Link className="button button-secondary" href={`/interview/${problem.id}`}>
                  Open
                  <ArrowRight aria-hidden size={17} />
                </Link>
              </article>
            ))}
          </div>
        </div>

        <FeedbackList items={dashboardTips} />
      </section>
    </AppShell>
  );
}
