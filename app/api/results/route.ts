import { NextResponse } from "next/server";
import { saveResultForUser } from "@/lib/results/result-repository";
import { guardRequest, readJson, requestError } from "@/lib/security/request-guard";
import { validResult } from "@/lib/security/interview-validation";

export async function POST(request: Request) {
  const guard = await guardRequest(request, "results-save", 20);
  if (guard.error) return guard.error;
  try {
    const result = await readJson(request, 200_000);
    if (!validResult(result)) return NextResponse.json({ error: "Invalid interview result." }, { status: 400 });
    const savedResult = await saveResultForUser(guard.user!.id, result, result.input.problemTitle);
    return NextResponse.json({ result: savedResult });
  } catch (error) { return requestError(error); }
}
