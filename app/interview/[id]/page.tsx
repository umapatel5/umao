import Link from "next/link";
import { BarChart3, Clock3, Radio, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { InterviewWorkspace } from "@/components/InterviewWorkspace";
import {
  getInterviewRole,
  getProblemById,
  getProblemCategory,
  getProblemDifficulty
} from "@/lib/problems/problem-library";

type InterviewPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    difficulty?: string;
    role?: string;
    topic?: string;
  }>;
};

export default async function InterviewPage({ params, searchParams }: InterviewPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const problem = getProblemById(id);
  const role = getInterviewRole(resolvedSearchParams?.role);
  const selectedDifficulty = getProblemDifficulty(resolvedSearchParams?.difficulty) ?? problem.difficulty;
  const selectedTopic = getProblemCategory(resolvedSearchParams?.topic) ?? problem.topics[0];

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
            <strong>{role}</strong>
          </div>
        </div>
        <div className="status-segment">
          <Clock3 aria-hidden size={17} />
          <div>
            <span>{selectedDifficulty} · {selectedTopic}</span>
            <strong>{problem.durationMinutes} minutes</strong>
          </div>
        </div>
        <Link className="button button-secondary end-interview-link" href={`/results/${problem.id}`}>
          <BarChart3 aria-hidden size={17} />
          View results
        </Link>
      </section>

      <InterviewWorkspace
        problem={problem}
        role={role}
        selectedDifficulty={selectedDifficulty}
        selectedTopic={selectedTopic}
        sessionId={problem.id}
      />
    </AppShell>
  );
}
