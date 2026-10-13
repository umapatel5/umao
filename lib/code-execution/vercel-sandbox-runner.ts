import { Sandbox } from "@vercel/sandbox";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { RunnerInput } from "@/lib/code-execution/shared";
import type { CodeRunResponse } from "@/types/code-execution";

const MAX_RESPONSE_BYTES = 512_000;
const SANDBOX_IMAGE = "umao-code-sandbox:hardening-1";

export function isVercelSandboxConfigured() {
  return Boolean(process.env.VERCEL || process.env.UMAO_USE_VERCEL_SANDBOX === "true");
}

export async function runVercelSandboxCode(input: RunnerInput): Promise<CodeRunResponse> {
  let sandbox: Sandbox | undefined;
  const signal = AbortSignal.timeout(45_000);
  try {
    const [server, processRunner] = await Promise.all([
      readFile(join(process.cwd(), "runner-service/server.mjs")),
      readFile(join(process.cwd(), "runner-service/process-runner.mjs"))
    ]);
    sandbox = await Sandbox.create({
      image: SANDBOX_IMAGE,
      resources: { vcpus: 1 },
      timeout: 35_000,
      persistent: false,
      networkPolicy: "deny-all",
      ports: [],
      env: {},
      signal
    });
    await sandbox.writeFiles([
      { path: "/tmp/umao-runner/server.mjs", content: server },
      { path: "/tmp/umao-runner/process-runner.mjs", content: processRunner },
      { path: "/tmp/umao-runner/input.json", content: Buffer.from(JSON.stringify(input)) }
    ], { signal });
    const command = await sandbox.runCommand({
      cmd: "node",
      args: ["/tmp/umao-runner/server.mjs", "--job", "/tmp/umao-runner/input.json"],
      env: { NODE_ENV: "development", RUNNER_ALLOW_UNSAFE_LOCAL: "true" },
      detached: true,
      timeoutMs: 30_000,
      signal
    });
    let output = "";
    let bytes = 0;
    for await (const log of command.logs({ signal })) {
      bytes += Buffer.byteLength(log.data);
      if (bytes > MAX_RESPONSE_BYTES) throw new Error("Sandbox output exceeded the limit.");
      if (log.stream === "stdout") output += log.data;
    }
    const finished = await command.wait({ signal });
    if (finished.exitCode !== 0) throw new Error("Sandbox job failed.");
    const result = JSON.parse(output.trim()) as CodeRunResponse;
    if (result.language !== input.language || !Array.isArray(result.results) ||
        result.results.length !== input.problem.testCases.length || typeof result.passed !== "boolean") {
      throw new Error("Sandbox returned an invalid response.");
    }
    return result;
  } catch (error) {
    const status = error && typeof error === "object" && "response" in error && error.response instanceof Response
      ? error.response.status : undefined;
    console.warn("Isolated code execution unavailable.", { status });
    return {
      error: "The isolated code runner is temporarily unavailable. Please try again shortly.",
      language: input.language, passed: false, results: [], runtimeMs: 0, stdout: ""
    };
  } finally {
    if (sandbox) {
      try { await sandbox.delete({ signal: AbortSignal.timeout(10_000) }); }
      catch { console.warn("Sandbox cleanup could not be confirmed; its short lifetime remains enforced."); }
    }
  }
}
