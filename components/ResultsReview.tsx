"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Code2, MessageSquareText, RotateCcw, UserCheck } from "lucide-react";
import { readInterviewResult } from "@/lib/scoring/interview-result-store";
import { scoreInterview } from "@/lib/scoring/interview-scoring";
import { generateQualitativeFeedback } from "@/lib/scoring/qualitative-feedback";
import { emptySpeakingMetrics, emptyWebcamMetrics } from "@/lib/webcam/candidate-webcam";
import type { SavedInterviewResult } from "@/types/account";
import type { InterviewResult } from "@/types/interview-results";

type ResultsReviewProps = {
  sessionId: string;
};

export function ResultsReview({ sessionId }: ResultsReviewProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoadingSavedResult, setIsLoadingSavedResult] = useState(true);
  const [savedResult, setSavedResult] = useState<SavedInterviewResult | null>(null);
  const [storedResult, setStoredResult] = useState<InterviewResult | null>(null);
  const fallbackResult = useMemo(() => createFallbackResult(sessionId), [sessionId]);
  const result = savedResult ? createResultFromSaved(savedResult) : storedResult ?? fallbackResult;
  const retrySessionId = savedResult?.sessionId ?? result.sessionId;
  const completedAt = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(result.completedAt));

  useEffect(() => {
    let didCancel = false;

    fetch(`/api/results/${sessionId}`)
      .then(async (response) => {
        const body = (await response.json()) as { error?: string; result?: SavedInterviewResult };

        if (!response.ok) {
          throw new Error(body.error ?? "Saved result was not available.");
        }

        if (!didCancel) {
          setSavedResult(body.result ?? null);
        }
      })
      .catch((savedResultError: Error) => {
        if (!didCancel) {
          setError(savedResultError.message);
          setStoredResult(readInterviewResult(sessionId));
        }
      })
      .finally(() => {
        if (!didCancel) {
          setIsLoadingSavedResult(false);
        }
      });

    return () => {
      didCancel = true;
    };
  }, [sessionId]);

  return (
    <div className="results-review">
      {isLoadingSavedResult ? <div className="console-notice">Loading saved interview result...</div> : null}

      {!savedResult && !storedResult ? (
        <div className="console-notice warning">
          <AlertCircle aria-hidden size={17} />
          {error === "Log in to view this interview result."
            ? "Log in to view saved interview history. Showing a baseline preview for now."
            : "No completed interview result was found in this browser session. Showing a baseline preview."}
        </div>
      ) : null}

      <div className="results-hero card panel">
        <div>
          <span className="meta">Completed {completedAt}</span>
          <h2>{result.scores.overall}</h2>
          <p>{result.feedback.personalizedFeedback}</p>
        </div>
        <div className="score-ring dynamic-score" style={{ "--score": `${result.scores.overall}%` } as React.CSSProperties}>
          <span>{result.scores.overall}</span>
        </div>
      </div>

      <div className="score-card-grid">
        <ScoreCard icon={Code2} score={result.scores.coding} />
        <ScoreCard icon={MessageSquareText} score={result.scores.problemSolving} />
        <ScoreCard icon={UserCheck} score={result.scores.communication} />
      </div>

      <div className="grid grid-2 results-feedback-grid">
        <FeedbackSection items={result.feedback.strengths} title="Strengths" tone="positive" />
        <FeedbackSection items={result.feedback.areasToImprove} title="Areas to improve" tone="focus" />
      </div>

      <section className="card panel results-signal-panel">
        <div className="results-section-header">
          <div>
            <h2 className="section-title">Scoring signals</h2>
            <div className="meta">
              Scores are deterministic. Qualitative feedback provider: {result.feedback.provider}.
            </div>
          </div>
          <Link className="button button-secondary" href={`/interview/${retrySessionId}`}>
            <RotateCcw aria-hidden size={17} />
            Retry
          </Link>
        </div>

        <div className="signal-grid">
          {[result.scores.coding, result.scores.problemSolving, result.scores.communication].map((score) => (
            <div className="signal-column" key={score.label}>
              <h3>{score.label}</h3>
              <p>{score.summary}</p>
              <ul>
                {score.signals.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ScoreCard({
  icon: Icon,
  score
}: {
  icon: typeof Code2;
  score: InterviewResult["scores"]["coding"];
}) {
  return (
    <section className="card panel score-breakdown-card">
      <div className="score-breakdown-header">
        <Icon aria-hidden size={20} />
        <div>
          <h2>{score.label}</h2>
          <span>{score.score}/100</span>
        </div>
      </div>
      <div className="score-meter" aria-label={`${score.label} score ${score.score} out of 100`}>
        <span style={{ width: `${score.score}%` }} />
      </div>
      <p>{score.summary}</p>
    </section>
  );
}

function FeedbackSection({
  items,
  title,
  tone
}: {
  items: string[];
  title: string;
  tone: "positive" | "focus";
}) {
  return (
    <section className={`card panel feedback-summary-card ${tone}`}>
      <h2 className="section-title">{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <CheckCircle2 aria-hidden size={16} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function createFallbackResult(sessionId: string): InterviewResult {
  const input = {
    code: "",
    hintsUsed: 0,
    language: "Python",
    latestRun: null,
    messages: [],
    speakingMetrics: emptySpeakingMetrics,
    webcamMetrics: emptyWebcamMetrics
  };
  const scores = scoreInterview(input);

  return {
    completedAt: new Date().toISOString(),
    feedback: generateQualitativeFeedback(scores),
    input,
    scores,
    sessionId
  };
}

function createResultFromSaved(result: SavedInterviewResult): InterviewResult {
  return {
    completedAt: result.completedAt,
    feedback: {
      areasToImprove: result.improvementAreas,
      personalizedFeedback: result.feedback,
      provider: "deterministic-local",
      strengths: result.strengths
    },
    input: {
      code: "",
      hintsUsed: 0,
      language: "Python",
      latestRun: null,
      messages: [],
      speakingMetrics: emptySpeakingMetrics,
      webcamMetrics: emptyWebcamMetrics
    },
    scores: {
      coding: {
        label: "Coding",
        score: result.codingScore,
        signals: [`Saved coding score: ${result.codingScore}/100`, `Problem: ${result.codingProblem}`],
        summary: "Saved from the completed interview result."
      },
      communication: {
        label: "Communication",
        score: result.communicationScore,
        signals: [`Saved communication score: ${result.communicationScore}/100`],
        summary: "Saved from the completed interview result."
      },
      overall: result.overallScore,
      problemSolving: {
        label: "Problem Solving",
        score: result.problemSolvingScore,
        signals: [`Saved problem-solving score: ${result.problemSolvingScore}/100`],
        summary: "Saved from the completed interview result."
      }
    },
    sessionId: result.sessionId
  };
}
