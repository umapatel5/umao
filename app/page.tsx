import Link from "next/link";
import { CalendarPlus, PlayCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { SessionCard } from "@/components/SessionCard";
import { metrics, sessions } from "@/lib/interview-data";

export default function DashboardPage() {
  return (
    <AppShell active="dashboard">
      <PageHeader
        eyebrow="Interview dashboard"
        title="Practice loop for technical screens"
        copy="Track mock sessions, open a coding room, and review structured feedback from one clean workspace."
        actions={
          <>
            <button className="button button-secondary" type="button">
              <CalendarPlus aria-hidden size={17} />
              Schedule
            </button>
            <Link className="button button-primary" href="/interview/system-design-lite">
              <PlayCircle aria-hidden size={17} />
              Start practice
            </Link>
          </>
        }
      />

      <section className="grid grid-3" aria-label="Interview metrics">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="card panel" style={{ marginTop: 18 }}>
        <h2 className="section-title">Interview queue</h2>
        <div className="session-list">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
