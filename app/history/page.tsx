import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { HistoryDashboard } from "@/components/HistoryDashboard";
import { PageHeader } from "@/components/PageHeader";

export default function HistoryPage() {
  return (
    <AppShell active="history">
      <PageHeader
        eyebrow="Interview history"
        title="Progress across practice interviews"
        copy="Review saved interview results and track how your coding, problem-solving, and communication scores change over time."
        actions={
          <Link className="button button-primary" href="/interview/system-design-lite">
            <PlayCircle aria-hidden size={17} />
            Start practice
          </Link>
        }
      />

      <HistoryDashboard />
    </AppShell>
  );
}
