import Link from "next/link";
import { Download, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FeedbackList } from "@/components/FeedbackList";
import { PageHeader } from "@/components/PageHeader";
import { feedback, sessions } from "@/lib/interview-data";

type ResultsPageProps = {
  params: {
    id: string;
  };
};

export default function ResultsPage({ params }: ResultsPageProps) {
  const session = sessions.find((item) => item.id === params.id) ?? sessions[0];

  return (
    <AppShell active="results">
      <PageHeader
        eyebrow={`${session.company} · results`}
        title="Interview review"
        copy="A structured results shell for future AI scoring, rubric breakdowns, transcript highlights, and replay links."
        actions={
          <>
            <button className="button button-secondary" type="button">
              <Download aria-hidden size={17} />
              Export
            </button>
            <Link className="button button-primary" href={`/interview/${session.id}`}>
              <RotateCcw aria-hidden size={17} />
              Retry
            </Link>
          </>
        }
      />

      <div className="grid grid-2">
        <section className="card panel">
          <h2 className="section-title">Overall score</h2>
          <div className="score-ring" aria-label="Overall score 82 percent">
            <span>82</span>
          </div>
          <div className="meta" style={{ textAlign: "center" }}>
            Strong hire signal with room to sharpen tradeoff narration.
          </div>
        </section>

        <section className="card panel">
          <h2 className="section-title">Rubric snapshot</h2>
          <div className="timeline">
            <div className="timeline-item">
              <span className="meta">Coding</span>
              <span>Correct solution, readable structure, limited test coverage.</span>
            </div>
            <div className="timeline-item">
              <span className="meta">Comms</span>
              <span>Clear assumptions and steady narration throughout implementation.</span>
            </div>
            <div className="timeline-item">
              <span className="meta">Design</span>
              <span>Good API shape; future review will include deeper architecture notes.</span>
            </div>
          </div>
        </section>
      </div>

      <section className="card panel" style={{ marginTop: 18 }}>
        <h2 className="section-title">Feedback</h2>
        <FeedbackList items={feedback} />
      </section>
    </AppShell>
  );
}
