import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-service";
import { buildInterviewAnalytics, summarizeProgress } from "@/lib/results/analytics";
import { listResultsForUser } from "@/lib/results/result-repository";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Log in to view interview history." }, { status: 401 });
  }

  const results = await listResultsForUser(user.id);

  return NextResponse.json({
    analytics: buildInterviewAnalytics(results),
    progress: summarizeProgress(results),
    results,
    user
  });
}
