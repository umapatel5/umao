import type { RunnerInput } from "@/lib/code-execution/shared";
import type { CodeRunResponse } from "@/types/code-execution";

const REMOTE_RUNNER_TIMEOUT_MS = 5000;

export function isRemoteRunnerConfigured() {
  return Boolean(process.env.CODE_RUNNER_SERVICE_URL);
}

export async function runRemoteCode({ code, language, problem }: RunnerInput): Promise<CodeRunResponse> {
  const serviceUrl = process.env.CODE_RUNNER_SERVICE_URL;

  if (!serviceUrl) {
    throw new Error("CODE_RUNNER_SERVICE_URL is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REMOTE_RUNNER_TIMEOUT_MS);

  try {
    const response = await fetch(new URL("/run", serviceUrl), {
      body: JSON.stringify({
        code,
        language,
        problem
      }),
      headers: {
        "Content-Type": "application/json",
        ...(process.env.CODE_RUNNER_SERVICE_TOKEN
          ? { Authorization: `Bearer ${process.env.CODE_RUNNER_SERVICE_TOKEN}` }
          : {})
      },
      method: "POST",
      signal: controller.signal
    });

    const payload = (await response.json()) as CodeRunResponse | { error?: string };

    if (!response.ok) {
      return {
        error: payload.error ?? "Remote runner request failed.",
        language,
        passed: false,
        results: [],
        runtimeMs: 0,
        stdout: ""
      };
    }

    return payload as CodeRunResponse;
  } catch (error) {
    return {
      error: error instanceof Error && error.name === "AbortError"
        ? "Remote runner request timed out."
        : "Could not reach the remote code runner.",
      language,
      passed: false,
      results: [],
      runtimeMs: 0,
      stdout: ""
    };
  } finally {
    clearTimeout(timeout);
  }
}
