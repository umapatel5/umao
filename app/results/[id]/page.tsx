import Link from "next/link";
import { History, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ResultsReview } from "@/components/ResultsReview";

type ResultsPageProps = {
  params: {
    id: string;
  };
};

export default function ResultsPage({ params }: ResultsPageProps) {
  return (
    <AppShell active="results">
      <PageHeader
        eyebrow="Interview results"
        title="Final interview feedback"
        copy="Scores combine code execution, interview conversation, voice timing, and local webcam-attention metrics."
        actions={
          <>
            <Link className="button button-secondary" href="/history">
              <History aria-hidden size={17} />
              History
            </Link>
            <Link className="button button-primary" href="/practice">
              <RotateCcw aria-hidden size={17} />
              Practice again
            </Link>
          </>
        }
      />

      <ResultsReview sessionId={params.id} />
    </AppShell>
  );
}
