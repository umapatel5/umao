import { NextResponse } from "next/server";
import { runCodeForProblem } from "@/lib/code-execution";
import { getProblemById } from "@/lib/problems/problem-library";
import type { CodeRunRequest, SupportedExecutionLanguage } from "@/types/code-execution";

export const runtime = "nodejs";

const MAX_CODE_LENGTH = 20_000;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<CodeRunRequest> | null;

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

  const problem = getProblemById(body.problemId);
  const response = await runCodeForProblem({
    code: body.code,
    language: body.language,
    problem
  });

  return NextResponse.json(response, { status: response.error && response.results.length === 0 ? 400 : 200 });
}

function isSupportedLanguage(language: string): language is SupportedExecutionLanguage {
  return ["Python", "Java", "C++", "JavaScript"].includes(language);
}
