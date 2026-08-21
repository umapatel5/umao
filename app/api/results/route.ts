import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-service";
import { codingProblem } from "@/lib/coding-problem";
import { saveResultForUser } from "@/lib/results/result-repository";
import type { InterviewResult } from "@/types/interview-results";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Log in to save interview results." }, { status: 401 });
  }

  const result = (await request.json()) as InterviewResult;
  const savedResult = await saveResultForUser(user.id, result, codingProblem.title);

  return NextResponse.json({ result: savedResult });
}
