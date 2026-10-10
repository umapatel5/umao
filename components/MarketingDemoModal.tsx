"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, PlayCircle, Volume2, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { CodeRunResponse } from "@/types/code-execution";

const demoCode = `def two_sum(nums, target):
    seen = {}
    for i, value in enumerate(nums):
        if target - value in seen:
            return [seen[target - value], i]
        seen[value] = i
    return []`;

export function MarketingDemoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [step, setStep] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [code, setCode] = useState(demoCode);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<CodeRunResponse | null>(null);
  const [runError, setRunError] = useState("");

  const runDemo = async () => {
    setIsPlaying(false);
    setRunning(true);
    setRunError("");
    setRunResult(null);
    try {
      const response = await fetch("/api/code/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: "Python", problemId: "two-sum-follow-up" }),
        signal: AbortSignal.timeout(30000)
      });
      const result = await response.json() as CodeRunResponse;
      if (!Array.isArray(result.results)) throw new Error(result.error || "The runner is unavailable. Please try again.");
      setRunResult(result);
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Couldn't run the tests.");
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const updateVoices = () => setVoices(window.speechSynthesis.getVoices());
    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
  }, []);

  const playVoice = () => {
    if (!("speechSynthesis" in window)) {
      setAudioError("Voice preview is unavailable in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance("Hi! Glad you're here. Take a moment to read the problem. When you're ready, talk me through how you'd approach it. We can work through the tricky parts together.");
    const availableVoices = voices.length ? voices : window.speechSynthesis.getVoices();
    const englishVoices = availableVoices.filter((voice) => /^en([-_]|$)/i.test(voice.lang));
    const preferredVoice = englishVoices.find((voice) => /natural|premium|enhanced|aria|jenny|samantha|ava|google us english/i.test(voice.name))
      ?? englishVoices.find((voice) => voice.lang === "en-US")
      ?? englishVoices[0];
    if (preferredVoice) speech.voice = preferredVoice;
    speech.lang = preferredVoice?.lang ?? "en-US";
    speech.rate = 0.94;
    speech.pitch = 1;
    speech.onstart = () => setSpeaking(true);
    speech.onend = () => setSpeaking(false);
    speech.onerror = () => { setSpeaking(false); setAudioError("Couldn't play the voice preview. You can still read the conversation below."); };
    setAudioError("");
    window.speechSynthesis.speak(speech);
  };
  const steps = ["Choose a problem", "Code and run tests", "Talk it through", "Review feedback"];

  useEffect(() => {
    if (!isOpen || !isPlaying) return;
    const timer = window.setInterval(() => setStep((current) => (current + 1) % 4), 7000);
    return () => window.clearInterval(timer);
  }, [isOpen, isPlaying]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button className="site-button site-button-secondary site-button-large" onClick={() => { setStep(0); setIsPlaying(true); setIsOpen(true); }} type="button">
        <PlayCircle aria-hidden size={18} />
        Watch demo
      </button>

      {isOpen ? (
        <div aria-labelledby="demo-modal-title" aria-modal="true" className="demo-modal-backdrop" role="dialog">
          <div className="demo-modal">
            <button aria-label="Close demo" className="demo-modal-close" onClick={() => setIsOpen(false)} type="button">
              <X aria-hidden size={20} />
            </button>

            <div className="demo-modal-copy">
              <span>A quick peek</span>
              <h2 id="demo-modal-title">See how a practice round works.</h2>
              <p>
                Take a look around before you start. This walkthrough uses example code,
                conversation, and scores.
              </p>
            </div>

            <div className="demo-video demo-walkthrough" aria-label="Umao product walkthrough">
              <div className="demo-video-topbar">
                <strong>umao interview</strong>
                <span>{step + 1} / 4 · Example session</span>
              </div>
              <div className="demo-chapters" aria-label="Demo chapters">
                {steps.map((title, index) => <button key={title} type="button" aria-pressed={step === index} onClick={() => { setStep(index); setIsPlaying(false); }}>{String(index + 1).padStart(2, "0")} <span>{title}</span></button>)}
              </div>
              <div className="demo-visual-layout">
                <aside className="demo-avatar-preview">
                  <div className="demo-avatar-photo">
                    <Image src="/avatar/interviewer.png" alt="Umao interviewer preview" fill sizes="(max-width: 700px) 90vw, 320px" />
                    <span className="demo-avatar-label">Your interviewer</span>
                  </div>
                  <button type="button" className="site-button site-button-secondary" onClick={playVoice}><Volume2 size={17} />{speaking ? "Speaking…" : "Hear a sample"}</button>
                  <p className="demo-avatar-note">Portrait preview with a sample browser voice.</p>
                  {audioError && <p role="status">{audioError}</p>}
                </aside>
              <div className="demo-video-stage">
                {step === 0 && <div className="demo-slide">
                  <span>Step 1</span>
                  <h3>Choose what you want to practice</h3>
                  <dl className="demo-setup-details">
                    <div><dt>Role</dt><dd>Software Engineer</dd></div>
                    <div><dt>Difficulty</dt><dd>Easy</dd></div>
                    <div><dt>Topic</dt><dd>Arrays</dd></div>
                  </dl>
                  <div className="demo-problem-preview">
                    <span>Your practice problem</span>
                    <h4>Two Sum</h4>
                    <p>Find the indices of two numbers that add up to a target.</p>
                    <pre>{`nums = [2, 7, 11, 15]\ntarget = 9\n\nExpected result: [0, 1]`}</pre>
                    <p className="demo-problem-meta">35 minutes · Python, JavaScript, Java or C++</p>
                  </div>
                </div>}
                {step === 1 && <div className="demo-slide">
                  <span>Step 2</span>
                  <h3>Try a coding question</h3>
                  <p>Two Sum: return the indices of two numbers that add up to the target.</p>
                  <label className="demo-editor-label" htmlFor="demo-code">two_sum.py · Python</label>
                  <textarea id="demo-code" className="demo-code-editor" spellCheck={false} value={code} onChange={(event) => { setCode(event.target.value); setIsPlaying(false); setRunResult(null); }} />
                  <div className="demo-run-actions">
                    <button className="site-button site-button-primary" disabled={running} onClick={runDemo} type="button"><PlayCircle size={16} />{running ? "Running tests…" : "Run tests"}</button>
                    <button className="site-button site-button-secondary" disabled={running} onClick={() => { setCode(demoCode); setRunResult(null); setRunError(""); setIsPlaying(false); }} type="button">Reset code</button>
                  </div>
                  <div className="demo-test-output" aria-live="polite">
                    {runError && <p role="alert">{runError}</p>}
                    {runResult && <>
                      <p><strong>{runResult.results.filter((result) => result.passed).length} / {runResult.results.length} tests passed</strong> · {runResult.runtimeMs} ms</p>
                      {runResult.error && <p>{runResult.error}</p>}
                      {runResult.results.map((result) => <div className="demo-test-row" key={result.name}><strong>{result.name} · {result.timedOut ? "Timed out" : result.passed ? "Passed" : "Failed"}</strong><span>Expected: {result.expected} · Actual: {result.actual}</span>{result.error && <span>{result.error}</span>}</div>)}
                      {runResult.stdout && <pre>{runResult.stdout}</pre>}
                    </>}
                    {!runResult && !runError && !running && <p>Edit the code or run the sample to see the test results.</p>}
                  </div>
                </div>}
                {step === 2 && <div className="demo-slide">
                  <span>Step 3</span>
                  <h3>Explain the choices behind your code</h3>
                  <div className="demo-conversation">
                    <p><strong>Interviewer</strong><br />How does your approach handle duplicate values?</p>
                    <p><strong>You</strong><br />I check for the complement before adding the current number, so I never reuse the same index.</p>
                    <p><strong>Interviewer</strong><br />Good. What are the time and space costs of keeping that map?</p>
                  </div>
                </div>}
                {step === 3 && <div className="demo-slide">
                  <span>Step 4</span>
                  <h3>Review what to improve next</h3>
                  <div className="demo-score-chart">
                    {[["Coding", 88], ["Problem solving", 85], ["Communication", 76]].map(([label, score]) => <div key={label}><p>{label} <b>{score}/100</b></p><meter min={0} max={100} value={Number(score)} aria-label={`${label} example score`} /></div>)}
                  </div>
                  <p>Next time: explain your edge cases before coding, then summarize time and space complexity.</p>
                </div>}
              </div>
              </div>
              <div className="demo-video-controls">
                <button onClick={() => setIsPlaying((current) => !current)} type="button">
                  {isPlaying ? <Pause aria-hidden size={18} /> : <PlayCircle aria-hidden size={18} />}
                  {isPlaying ? "Pause" : "Play"}
                </button>
                <button aria-label="Previous step" onClick={() => { setIsPlaying(false); setStep((step + 3) % 4); }} type="button"><ArrowLeft size={18} /></button>
                <span>{steps[step]}</span>
                <button aria-label="Next step" onClick={() => { setIsPlaying(false); setStep((step + 1) % 4); }} type="button"><ArrowRight size={18} /></button>
              </div>
            </div>

            <div className="demo-modal-actions">
              <Link className="site-button site-button-primary site-button-large" href="/practice" onClick={() => setIsOpen(false)}>
                Start practicing
                <ArrowRight aria-hidden size={18} />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
