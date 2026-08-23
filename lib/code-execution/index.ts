import { runCppCode } from "@/lib/code-execution/cpp-runner";
import { runJavaCode } from "@/lib/code-execution/java-runner";
import { runJavaScriptCode } from "@/lib/code-execution/javascript-runner";
import { runPythonCode } from "@/lib/code-execution/python-runner";
import { isRemoteRunnerConfigured, runRemoteCode } from "@/lib/code-execution/remote-runner";
import type { RunnerInput } from "@/lib/code-execution/shared";
import type { CodeRunResponse } from "@/types/code-execution";

export async function runCodeForProblem(input: RunnerInput): Promise<CodeRunResponse> {
  if (isRemoteRunnerConfigured()) {
    return runRemoteCode(input);
  }

  const { code, language, problem } = input;

  switch (language) {
    case "Python":
      return runPythonCode(code, problem);
    case "JavaScript":
      return runJavaScriptCode(code, problem);
    case "Java":
      return runJavaCode(code, problem);
    case "C++":
      return runCppCode(code, problem);
  }
}
