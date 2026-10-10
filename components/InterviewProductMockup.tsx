"use client";
import { useState } from "react";
import type { CodeRunResponse } from "@/types/code-execution";
import Image from "next/image";
import { BarChart3, CheckCircle2, Code2, MessageSquareText, Play, RotateCcw, Settings } from "lucide-react";

type InterviewProductMockupProps = {
  compact?: boolean;
};

export function InterviewProductMockup({ compact = false }: InterviewProductMockupProps) {
  const initialCode = "function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (seen.has(complement)) return [seen.get(complement), i];\n    seen.set(nums[i], i);\n  }\n  return [];\n}";
  const [code, setCode] = useState(initialCode);
  const [tab, setTab] = useState("Coding");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CodeRunResponse | null>(null);
  const [error, setError] = useState("");
  const run = async () => {
    setRunning(true); setError(""); setResult(null); setTab("Test Cases");
    try {
      const response = await fetch("/api/code/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, language: "JavaScript", problemId: "two-sum-follow-up" }), signal: AbortSignal.timeout(30000) });
      const data = await response.json() as CodeRunResponse;
      if (!Array.isArray(data.results)) throw new Error(data.error || "Runner unavailable.");
      setResult(data);
    } catch (error) { setError(error instanceof Error ? error.message : "Couldn't run tests."); }
    finally { setRunning(false); }
  };
  return (
    <div className={compact ? "product-mockup compact" : "product-mockup"} aria-label="Umao interview workspace preview">
      <aside className="mockup-sidebar" aria-hidden>
        <span className="mockup-logo">U</span>
        <Code2 size={20} />
        <MessageSquareText size={20} />
        <BarChart3 size={20} />
        <Settings size={20} />
      </aside>

      <div className="mockup-main">
        <div className="mockup-topbar">
          <strong>Two Sum · Interactive demo</strong>
        </div>

        <div className="mockup-grid">
          <section className="mockup-editor">
            <div className="mockup-tabs">
              <span>two_sum.js</span>
              <span>JavaScript</span>
            </div>
            <textarea className="demo-code-editor" aria-label="Demo JavaScript code" value={code} spellCheck={false} onChange={(event) => { setCode(event.target.value); setResult(null); }} />
            <div className="mockup-runbar">
              <span>
                <CheckCircle2 size={15} />
                {running ? "Running tests…" : "Ready to run"}
              </span>
              <button type="button" disabled={running} onClick={run}>
                <Play size={14} />
                Run
              </button>
              <button type="button" disabled={running} onClick={() => { setCode(initialCode); setResult(null); setError(""); }}>
                <RotateCcw size={14} />
                Reset
              </button>
            </div>
          </section>

          <aside className="mockup-interview">
            <div className="mockup-video">
              <Image
                alt="Umao interviewer preview"
                height={250}
                priority
                src="/avatar/interviewer.png"
                unoptimized
                width={360}
              />
              <span>Interviewer</span>
            </div>
            <button className="site-button site-button-secondary" type="button" onClick={() => { if (!("speechSynthesis" in window)) { setError("Voice playback is unavailable."); return; } window.speechSynthesis.cancel(); const speech = new SpeechSynthesisUtterance("Hi! Can you walk me through your approach to Two Sum? What happens if the array contains duplicate numbers?"); speech.rate = 0.94; speech.onerror = () => setError("Audio couldn't play. Read the transcript below."); window.speechSynthesis.speak(speech); }}>Hear interviewer</button>
            <div className="mockup-transcript" aria-live="polite" style={{ color: "#492b32", maxHeight: 320, overflowY: "auto" }}>
              <div>
                <strong>{tab === "Coding" ? "Conversation" : tab}</strong>
              </div>
              {tab === "Coding" && <><p style={{ color: "#705453" }}><strong>Interviewer</strong> Can you solve this Two Sum problem and walk me through your approach?</p><p style={{ color: "#705453" }}><strong>You</strong> Yes, I can. I&apos;ll walk you through it as I go.</p></>}
              {tab === "Conversation" && <><p style={{ color: "#705453" }}><strong>Interviewer</strong> What is the time complexity?</p><p style={{ color: "#705453" }}><strong>You</strong> It is O(n) time and O(n) space.</p><p style={{ color: "#705453" }}>Sample conversation: try a full practice session for live follow-ups.</p></>}
              {tab === "Test Cases" && <>{!result && <p style={{ color: "#705453" }}>{running ? "Running your code…" : "Click Run to see results."}</p>}{result?.results.map((test) => <div className="demo-test-row" key={test.name}><strong>{test.name}: {test.passed ? "Passed" : test.timedOut ? "Timed out" : "Failed"}</strong><span>Expected: {test.expected} · Actual: {test.actual}</span>{test.error && <span>{test.error}</span>}</div>)}{result && <p style={{ color: "#705453" }}>Runtime: {result.runtimeMs} ms</p>}{result?.error && <p>{result.error}</p>}{result?.stdout && <pre>{result.stdout}</pre>}</>}
              {tab === "Feedback" && <p style={{ color: "#705453" }}>{!result ? "Run your code first to get feedback." : result.passed ? "All tests passed. Explain the time and space complexity and how your map handles duplicate numbers." : "Review the failing cases, compare the expected and actual output, then update your code and run again."}</p>}
              {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
            </div>
          </aside>
        </div>

        <div className="mockup-footer">
          {["Coding", "Conversation", "Test Cases", "Feedback"].map((item, index) => <button type="button" key={item} className={tab === item ? "active" : ""} aria-pressed={tab === item} onClick={() => setTab(item)}>{index + 1}. {item}</button>)}
        </div>
      </div>
    </div>
  );
}
