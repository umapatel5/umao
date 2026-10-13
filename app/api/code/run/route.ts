import { NextResponse } from "next/server";
import { runCodeForProblem } from "@/lib/code-execution";
import { codingProblems } from "@/lib/problems/problem-library";
import { guardRequest, readJson, requestError } from "@/lib/security/request-guard";
import type { CodeRunRequest, SupportedExecutionLanguage } from "@/types/code-execution";

export const runtime = "nodejs";

const MAX_CODE_LENGTH = 20_000;

export async function POST(request: Request) {
  const publicGuard = await guardRequest(request, "code-public", 15, false, 60_000);
  if (publicGuard.error) return publicGuard.error;
  let body;
  try { body = await readJson(request, 25_000) as Partial<CodeRunRequest> | null; } catch (error) { return requestError(error); }

  if (!body || typeof body.code !== "string" || typeof body.language !== "string") {
    return NextResponse.json({ error: "Expected language and code." }, { status: 400 });
  }

  if (!isSupportedLanguage(body.language)) {
    return NextResponse.json({ error: "Unsupported language." }, { status: 400 });
  }

  if (body.code.length > MAX_CODE_LENGTH) {
    return NextResponse.json(
      { error: `Code is too large. Limit is ${MAX_CODE_LENGTH} characters.` },
      { status: 413 }
    );
  }

  const problem = codingProblems.find((item) => item.id === body.problemId);
  if (!problem) return NextResponse.json({ error: "Unknown coding problem." }, { status: 400 });
  // Keep the landing-page demo public; other languages/problems require a session.
  if (body.language !== "JavaScript" || problem.id !== "two-sum-follow-up") {
    const guard = await guardRequest(request, "code-run", 20, true, 60_000);
    if (guard.error) return guard.error;
  }
  try {
    const response = await runCodeForProblem({
      code: body.code,
      language: body.language,
      problem
    });

    return NextResponse.json(response, { status: response.error && response.results.length === 0 ? 400 : 200 });
  } catch (error) { return requestError(error); }
}

function isSupportedLanguage(language: string): language is SupportedExecutionLanguage {
  return ["Python", "Java", "C++", "JavaScript"].includes(language);
}
