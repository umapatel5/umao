import Link from "next/link";
import { BarChart3, Clock3, Radio, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { InterviewWorkspace } from "@/components/InterviewWorkspace";
import { sessions } from "@/lib/interview-data";

type InterviewPageProps = {
  params: {
    id: string;
  };
};

export default function InterviewPage({ params }: InterviewPageProps) {
  const session = sessions.find((item) => item.id === params.id) ?? sessions[0];

  return (
    <AppShell active="interview">
      <section className="interview-status-bar" aria-label="Current interview status">
        <div className="status-segment">
          <Radio aria-hidden size={17} />
          <div>
            <span>Current session</span>
            <strong>Live interview</strong>
          </div>
        </div>
        <div className="status-segment">
          <UserRound aria-hidden size={17} />
          <div>
            <span>Role</span>
            <strong>{session.role}</strong>
          </div>
        </div>
        <div className="status-segment">
          <Clock3 aria-hidden size={17} />
          <div>
            <span>Duration</span>
            <strong>{session.durationMinutes} minutes</strong>
          </div>
        </div>
        <Link className="button button-secondary end-interview-link" href={`/results/${session.id}`}>
          <BarChart3 aria-hidden size={17} />
          View results
        </Link>
      </section>

      <InterviewWorkspace sessionId={session.id} />
    </AppShell>
  );
}
