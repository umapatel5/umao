import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-service";
import { buildInterviewAnalytics, summarizeProgress } from "@/lib/results/analytics";
import { listResultsForUser, saveResultForUser } from "@/lib/results/result-repository";
import type { InterviewResult } from "@/types/interview-results";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Log in to view saved interviews." }, { status: 401 });
  }

  const results = await listResultsForUser(user.id);

  return NextResponse.json({
    analytics: buildInterviewAnalytics(results),
    progress: summarizeProgress(results),
    results,
    user
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Log in to save interview results." }, { status: 401 });
  }

  let result: InterviewResult;

  try {
    result = (await request.json()) as InterviewResult;
  } catch {
    return NextResponse.json({ error: "Invalid interview result payload." }, { status: 400 });
  }

  if (!isInterviewResult(result)) {
    return NextResponse.json({ error: "Interview result payload is missing required fields." }, { status: 400 });
  }

  const savedResult = await saveResultForUser(user.id, result, result.input.problemTitle);

  return NextResponse.json({ result: savedResult }, { status: 201 });
}

function isInterviewResult(result: Partial<InterviewResult> | null): result is InterviewResult {
  return Boolean(
    result?.completedAt &&
      result.feedback?.personalizedFeedback &&
      result.input?.problemTitle &&
      result.scores?.coding &&
      typeof result.scores.overall === "number" &&
      result.sessionId
  );
}
