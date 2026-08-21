import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-service";
import { listResultsForUser, summarizeProgress } from "@/lib/results/result-repository";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Log in to view interview history." }, { status: 401 });
  }

  const results = await listResultsForUser(user.id);

  return NextResponse.json({
    progress: summarizeProgress(results),
    results,
    user
  });
}
