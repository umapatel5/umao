import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import type { InterviewSession } from "@/types/interview";

export function SessionCard({ session }: { session: InterviewSession }) {
  return (
    <article className="session-row">
      <div>
        <h3 className="session-title">{session.title}</h3>
        <div className="meta">
          {session.company} · {session.role} · {session.language}
        </div>
        <div className="toolbar" style={{ marginTop: 10 }}>
          <span className={session.status === "ready" ? "pill pill-ready" : "pill"}>
            {session.status}
          </span>
          <span className="pill">
            <Clock3 aria-hidden size={14} />
            {session.durationMinutes} min
          </span>
          <span className="pill">{session.difficulty}</span>
        </div>
      </div>
      <Link className="button button-secondary" href={`/interview/${session.id}`}>
        Open
        <ArrowRight aria-hidden size={17} />
      </Link>
    </article>
  );
}
