import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ResultsReview } from "@/components/ResultsReview";
import { sessions } from "@/lib/interview-data";

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
        title="Final interview feedback"
        copy="Scores combine code execution, interview conversation, voice timing, and local webcam-attention metrics from this browser session."
        actions={
          <Link className="button button-primary" href={`/interview/${session.id}`}>
            <RotateCcw aria-hidden size={17} />
            Retry
          </Link>
        }
      />

      <ResultsReview sessionId={session.id} />
    </AppShell>
  );
}
