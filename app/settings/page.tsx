import Link from "next/link";
import { Braces } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { SettingsPanel } from "@/components/SettingsPanel";

export default function SettingsPage() {
  return (
    <AppShell active="settings">
      <PageHeader
        eyebrow="Workspace settings"
        title="Tune your interview setup"
        copy="Manage local practice defaults, account status, and privacy-facing controls for Umao."
        actions={
          <Link className="button button-primary" href="/practice">
            <Braces aria-hidden size={17} />
            Start Practice
          </Link>
        }
      />

      <SettingsPanel />
    </AppShell>
  );
}
