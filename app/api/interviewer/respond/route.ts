import { NextResponse } from "next/server";
import { generateInterviewerReply } from "@/lib/ai/interviewer";
import { guardRequest, readJson, requestError } from "@/lib/security/request-guard";
import { validInterviewerContext } from "@/lib/security/interview-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const guard = await guardRequest(request, "ai-response", 40);
  if (guard.error) return guard.error;
  let context;
  try { context = await readJson(request); } catch (error) { return requestError(error); }
  if (!validInterviewerContext(context)) {
    return NextResponse.json({ error: "Interview context is incomplete." }, { status: 400 });
  }

  try { return NextResponse.json(await generateInterviewerReply(context)); }
  catch (error) { return requestError(error); }
}
