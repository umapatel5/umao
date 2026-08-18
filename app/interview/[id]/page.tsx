import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CodeEditorPanel } from "@/components/CodeEditorPanel";
import { InterviewerPanel } from "@/components/InterviewerPanel";
import { PageHeader } from "@/components/PageHeader";
import { ProblemPanel } from "@/components/ProblemPanel";
import { TranscriptPanel } from "@/components/TranscriptPanel";
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
      <PageHeader
        eyebrow={`${session.company} · ${session.durationMinutes} minutes`}
        title="Umao technical interview workspace"
        copy="Solve a realistic coding prompt with a Monaco editor, language templates, and mock interview media surfaces ready for future AI integrations."
        actions={
          <Link className="button button-secondary" href={`/results/${session.id}`}>
            <BarChart3 aria-hidden size={17} />
            View results
          </Link>
        }
      />

      <div className="technical-interview-layout">
        <ProblemPanel />
        <CodeEditorPanel />
        <aside className="interview-support-rail">
          <InterviewerPanel />
          <TranscriptPanel />
        </aside>
      </div>
    </AppShell>
  );
}
