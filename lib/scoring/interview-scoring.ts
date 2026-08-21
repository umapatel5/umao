import type { InterviewScoringInput, DeterministicInterviewScores, RubricScore } from "@/types/interview-results";

export function scoreInterview(input: InterviewScoringInput): DeterministicInterviewScores {
  const coding = scoreCoding(input);
  const problemSolving = scoreProblemSolving(input);
  const communication = scoreCommunication(input);
  const overall = clampScore(Math.round(coding.score * 0.45 + problemSolving.score * 0.3 + communication.score * 0.25));

  return {
    coding,
    communication,
    overall,
    problemSolving
  };
}

function scoreCoding(input: InterviewScoringInput): RubricScore {
  const totalTests = input.latestRun?.results.length ?? 0;
  const passedTests = input.latestRun?.results.filter((result) => result.passed).length ?? 0;
  const passRate = totalTests ? passedTests / totalTests : 0;
  const hasError = Boolean(input.latestRun?.error || input.latestRun?.results.some((result) => result.error));
  const timedOut = Boolean(input.latestRun?.results.some((result) => result.timedOut));
  const runtimeMs = input.latestRun?.runtimeMs ?? null;
  const runtimeScore = runtimeMs === null ? 28 : runtimeMs <= 1200 ? 100 : runtimeMs <= 2500 ? 78 : runtimeMs <= 5000 ? 55 : 34;
  const hintPenalty = Math.min(18, input.hintsUsed * 6);
  const errorPenalty = hasError ? 18 : 0;
  const timeoutPenalty = timedOut ? 15 : 0;
  const score = clampScore(Math.round(passRate * 68 + runtimeScore * 0.22 + 10 - hintPenalty - errorPenalty - timeoutPenalty));

  return {
    label: "Coding",
    score,
    signals: [
      `${passedTests}/${totalTests || 0} test cases passed`,
      runtimeMs === null ? "Code was not run before submission" : `Latest runtime was ${runtimeMs} ms`,
      `${input.hintsUsed} hint${input.hintsUsed === 1 ? "" : "s"} used`,
      hasError ? "Latest run included an error" : "No latest execution error"
    ],
    summary:
      totalTests === 0
        ? "No completed code run was available, so the coding score is conservative."
        : `${passedTests} of ${totalTests} tests passed with ${hasError ? "errors to resolve" : "no latest execution error"}.`
  };
}

function scoreProblemSolving(input: InterviewScoringInput): RubricScore {
  const candidateText = input.messages
    .filter((message) => message.role === "candidate")
    .map((message) => message.text.toLowerCase())
    .join(" ");
  const candidateMessages = input.messages.filter((message) => message.role === "candidate");
  const approachSignals = countMatches(candidateText, ["approach", "use", "map", "hash", "scan", "iterate", "store", "complement"]);
  const edgeCaseSignals = countMatches(candidateText, ["edge", "duplicate", "empty", "negative", "same", "sorted", "invalid"]);
  const complexitySignals = countMatches(candidateText, ["runtime", "time complexity", "space complexity", "o(n)", "linear", "constant"]);
  const responseQualityScore = Math.min(26, candidateMessages.length * 5 + Math.min(10, averageCandidateWords(input) / 3));
  const latestRunBonus = input.latestRun?.passed ? 12 : input.latestRun ? 5 : 0;
  const score = clampScore(
    Math.round(
      Math.min(20, approachSignals * 4) +
        Math.min(16, edgeCaseSignals * 4) +
        Math.min(18, complexitySignals * 6) +
        responseQualityScore +
        latestRunBonus +
        8
    )
  );

  return {
    label: "Problem Solving",
    score,
    signals: [
      `${candidateMessages.length} candidate response${candidateMessages.length === 1 ? "" : "s"}`,
      `${approachSignals} approach signal${approachSignals === 1 ? "" : "s"}`,
      `${edgeCaseSignals} edge-case signal${edgeCaseSignals === 1 ? "" : "s"}`,
      `${complexitySignals} complexity signal${complexitySignals === 1 ? "" : "s"}`
    ],
    summary:
      complexitySignals > 0
        ? "The conversation included reasoning about implementation and complexity."
        : "The approach discussion is started, but complexity and tradeoffs need more explicit coverage."
  };
}

function scoreCommunication(input: InterviewScoringInput): RubricScore {
  const speakingSeconds = input.speakingMetrics.speakingDurationMs / 1000;
  const speakingScore = speakingSeconds === 0 ? 35 : speakingSeconds < 8 ? 62 : speakingSeconds <= 120 ? 92 : 76;
  const pausePenalty = Math.min(18, input.speakingMetrics.pauseCount * 4);
  const awayPenalty = Math.min(22, input.webcamMetrics.lookingAwayCount * 4 + input.webcamMetrics.lookingAwayMs / 1500);
  const extendedAwayPenalty = input.webcamMetrics.extendedAwayMs > 8000 ? 18 : input.webcamMetrics.extendedAwayMs > 4000 ? 10 : 0;
  const facePresenceBonus = input.webcamMetrics.faceState === "detected" ? 8 : input.webcamMetrics.faceState === "not-detected" ? -8 : 0;
  const score = clampScore(Math.round(speakingScore - pausePenalty - awayPenalty - extendedAwayPenalty + facePresenceBonus));

  return {
    label: "Communication",
    score,
    signals: [
      `${Math.round(speakingSeconds)}s spoken response time`,
      `${input.speakingMetrics.pauseCount} extended pause${input.speakingMetrics.pauseCount === 1 ? "" : "s"}`,
      `${input.webcamMetrics.lookingAwayCount} looking-away event${input.webcamMetrics.lookingAwayCount === 1 ? "" : "s"}`,
      `Face state: ${input.webcamMetrics.faceState}`
    ],
    summary:
      input.webcamMetrics.analysisAvailable || speakingSeconds > 0
        ? "Communication score uses local voice timing and camera-attention signals."
        : "Communication score is conservative because little voice or camera signal was available."
  };
}

function averageCandidateWords(input: InterviewScoringInput) {
  const candidateMessages = input.messages.filter((message) => message.role === "candidate");

  if (!candidateMessages.length) {
    return 0;
  }

  const totalWords = candidateMessages.reduce((sum, message) => sum + message.text.trim().split(/\s+/).filter(Boolean).length, 0);

  return totalWords / candidateMessages.length;
}

function countMatches(text: string, keywords: string[]) {
  return keywords.reduce((sum, keyword) => (text.includes(keyword) ? sum + 1 : sum), 0);
}

export function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}
