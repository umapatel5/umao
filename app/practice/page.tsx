import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ProblemLibrary } from "@/components/ProblemLibrary";

export default function PracticePage() {
  return (
    <AppShell active="practice">
      <PageHeader
        eyebrow="Practice setup"
        title="Choose your interview role and problem"
        copy="Pick the role, difficulty, and topic Umao should use, or start a randomized interview from the current setup."
      />

      <ProblemLibrary />
    </AppShell>
  );
}
