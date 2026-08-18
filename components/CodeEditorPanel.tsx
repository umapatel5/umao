"use client";

import { useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import { AlertTriangle, CheckCircle2, Loader2, Play, SendHorizontal, XCircle } from "lucide-react";
import type { CodeRunResponse, CodeTestResult } from "@/types/code-execution";

type LanguageOption = {
  label: "Python" | "Java" | "C++" | "JavaScript";
  monacoLanguage: string;
  fileName: string;
  starterCode: string;
};

const languages: LanguageOption[] = [
  {
    label: "Python",
    monacoLanguage: "python",
    fileName: "main.py",
    starterCode: `def two_sum(nums, target):
    seen = {}

    for index, value in enumerate(nums):
        complement = target - value

        if complement in seen:
            return [seen[complement], index]

        seen[value] = index

    return []`
  },
  {
    label: "Java",
    monacoLanguage: "java",
    fileName: "Solution.java",
    starterCode: `import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();

        for (int index = 0; index < nums.length; index++) {
            int complement = target - nums[index];

            if (seen.containsKey(complement)) {
                return new int[] { seen.get(complement), index };
            }

            seen.put(nums[index], index);
        }

        return new int[] {};
    }
}`
  },
  {
    label: "C++",
    monacoLanguage: "cpp",
    fileName: "solution.cpp",
    starterCode: `#include <unordered_map>
#include <vector>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;

    for (int index = 0; index < nums.size(); index++) {
        int complement = target - nums[index];

        if (seen.count(complement)) {
            return {seen[complement], index};
        }

        seen[nums[index]] = index;
    }

    return {};
}`
  },
  {
    label: "JavaScript",
    monacoLanguage: "javascript",
    fileName: "main.js",
    starterCode: `function twoSum(nums, target) {
  const seen = new Map();

  for (let index = 0; index < nums.length; index += 1) {
    const complement = target - nums[index];

    if (seen.has(complement)) {
      return [seen.get(complement), index];
    }

    seen.set(nums[index], index);
  }

  return [];
}`
  }
];

export function CodeEditorPanel() {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption["label"]>("Python");
  const activeLanguage = useMemo(
    () => languages.find((language) => language.label === selectedLanguage) ?? languages[3],
    [selectedLanguage]
  );
  const [codeByLanguage, setCodeByLanguage] = useState<Record<string, string>>(
    Object.fromEntries(languages.map((language) => [language.label, language.starterCode]))
  );
  const [runResult, setRunResult] = useState<CodeRunResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  async function runCode() {
    setIsRunning(true);
    setRunError(null);
    setRunResult(null);

    try {
      const response = await fetch("/api/code/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          language: activeLanguage.label,
          code: codeByLanguage[activeLanguage.label]
        })
      });
      const payload = (await response.json()) as CodeRunResponse | { error?: string };

      if (!response.ok) {
        setRunError(payload.error ?? "Code execution failed.");
        return;
      }

      setRunResult(payload as CodeRunResponse);
    } catch {
      setRunError("Could not reach the code execution service.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <section className="card editor-card" aria-labelledby="editor-title">
      <div className="workspace-header editor-card-header">
        <div>
          <h2 className="section-title" id="editor-title">
            Solution workspace
          </h2>
          <div className="meta">Monaco Editor mount target</div>
        </div>

        <label className="language-select">
          <span>Language</span>
          <select
            aria-label="Select coding language"
            onChange={(event) =>
              setSelectedLanguage(event.target.value as LanguageOption["label"])
            }
            value={selectedLanguage}
          >
            {languages.map((language) => (
              <option key={language.label} value={language.label}>
                {language.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="editor-placeholder monaco-shell" data-editor-target="monaco">
        <div className="editor-tabs">
          <span className="editor-tab">{activeLanguage.fileName}</span>
          <span className={activeLanguage.label === "Python" ? "pill pill-ready" : "pill"}>
            {activeLanguage.label === "Python" ? "Python runner ready" : "Runner coming later"}
          </span>
        </div>
        <div className="monaco-editor-frame">
          <Editor
            height="100%"
            language={activeLanguage.monacoLanguage}
            onChange={(value) =>
              setCodeByLanguage((current) => ({
                ...current,
                [activeLanguage.label]: value ?? ""
              }))
            }
            options={{
              automaticLayout: true,
              fontFamily: "SFMono-Regular, Consolas, Liberation Mono, monospace",
              fontSize: 14,
              minimap: { enabled: false },
              padding: { top: 16 },
              scrollBeyondLastLine: false,
              tabSize: 2,
              wordWrap: "on"
            }}
            theme="vs-dark"
            value={codeByLanguage[activeLanguage.label]}
          />
        </div>
      </div>

      <div className="editor-actions">
        <button
          className="button button-secondary"
          disabled={isRunning}
          onClick={runCode}
          type="button"
        >
          {isRunning ? <Loader2 aria-hidden className="spin-icon" size={17} /> : <Play aria-hidden size={17} />}
          {isRunning ? "Running" : "Run Code"}
        </button>
        <button className="button button-primary" type="button">
          <SendHorizontal aria-hidden size={17} />
          Submit
        </button>
      </div>

      <ExecutionConsole
        error={runError}
        isRunning={isRunning}
        result={runResult}
        selectedLanguage={activeLanguage.label}
      />
    </section>
  );
}

function ExecutionConsole({
  error,
  isRunning,
  result,
  selectedLanguage
}: {
  error: string | null;
  isRunning: boolean;
  result: CodeRunResponse | null;
  selectedLanguage: LanguageOption["label"];
}) {
  const status = getConsoleStatus(error, result, selectedLanguage);

  return (
    <div className="execution-console" aria-live="polite">
      <div className="execution-console-header">
        <div>
          <h3>Console</h3>
          <p>{status}</p>
        </div>
        {result ? (
          <span className={result.passed ? "pill pill-ready" : "pill pill-failed"}>
            {result.passed ? "All tests passed" : "Needs work"}
          </span>
        ) : null}
      </div>

      {isRunning ? <ConsoleNotice tone="neutral" message="Running Python test cases..." /> : null}
      {error ? <ConsoleNotice tone="warning" message={error} /> : null}

      {result?.error ? <ConsoleNotice tone="warning" message={result.error} /> : null}

      {result?.results.length ? (
        <div className="test-results-grid">
          {result.results.map((testResult) => (
            <TestResultCard key={testResult.name} result={testResult} />
          ))}
        </div>
      ) : null}

      {result?.stdout ? (
        <div className="stdout-block">
          <span>stdout</span>
          <pre>{result.stdout}</pre>
        </div>
      ) : null}
    </div>
  );
}

function TestResultCard({ result }: { result: CodeTestResult }) {
  return (
    <article className={result.passed ? "test-result-card passed" : "test-result-card failed"}>
      <div className="test-result-header">
        <div>
          {result.passed ? (
            <CheckCircle2 aria-hidden size={17} />
          ) : (
            <XCircle aria-hidden size={17} />
          )}
          <strong>{result.name}</strong>
        </div>
        <span>{result.runtimeMs} ms</span>
      </div>
      <dl className="test-result-details">
        <div>
          <dt>Input</dt>
          <dd>{result.input}</dd>
        </div>
        <div>
          <dt>Expected</dt>
          <dd>{result.expected}</dd>
        </div>
        <div>
          <dt>Actual</dt>
          <dd>{result.actual || "No output"}</dd>
        </div>
      </dl>
      {result.error ? <p className="test-error">{result.error}</p> : null}
    </article>
  );
}

function ConsoleNotice({ message, tone }: { message: string; tone: "neutral" | "warning" }) {
  return (
    <div className={tone === "warning" ? "console-notice warning" : "console-notice"}>
      {tone === "warning" ? <AlertTriangle aria-hidden size={17} /> : <Loader2 aria-hidden size={17} />}
      {message}
    </div>
  );
}

function getConsoleStatus(
  error: string | null,
  result: CodeRunResponse | null,
  selectedLanguage: LanguageOption["label"]
) {
  if (error) {
    return "Review the execution message below.";
  }

  if (result) {
    return `${result.results.filter((item) => item.passed).length}/${result.results.length} test cases passed in ${result.runtimeMs} ms.`;
  }

  if (selectedLanguage !== "Python") {
    return "Python execution is available first. Other runners are intentionally not wired yet.";
  }

  return "Run the Python solution against predefined test cases.";
}
