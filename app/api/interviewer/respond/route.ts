import { NextResponse } from "next/server";
import { generateInterviewerReply } from "@/lib/ai/interviewer";
import type { InterviewerContext } from "@/types/interviewer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const context = (await request.json().catch(() => null)) as Partial<InterviewerContext> | null;

  if (!context || typeof context.candidateMessage !== "string") {
    return NextResponse.json({ error: "Expected interviewer context." }, { status: 400 });
  }

  if (!context.problem || typeof context.currentCode !== "string" || !Array.isArray(context.messages)) {
    return NextResponse.json({ error: "Interview context is incomplete." }, { status: 400 });
  }

  const response = await generateInterviewerReply(context as InterviewerContext);
  return NextResponse.json(response);
}
