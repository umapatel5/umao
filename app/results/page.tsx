import Link from "next/link";
import { Braces, History } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { HistoryDashboard } from "@/components/HistoryDashboard";
import { PageHeader } from "@/components/PageHeader";

export default function ResultsIndexPage() {
  return (
    <AppShell active="results">
      <PageHeader
        eyebrow="Results"
        title="Saved interview reports"
        copy="Open a completed interview report from your saved history, or run a new practice session to generate fresh feedback."
        actions={
          <>
            <Link className="button button-secondary" href="/history">
              <History aria-hidden size={17} />
              History
            </Link>
            <Link className="button button-primary" href="/practice">
              <Braces aria-hidden size={17} />
              New practice
            </Link>
          </>
        }
      />

      <HistoryDashboard />
    </AppShell>
  );
}
