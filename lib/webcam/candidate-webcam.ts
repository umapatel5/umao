import type { HeadPosition, SpeakingMetrics, WebcamAnalysisMetrics } from "@/types/candidate-analysis";

type FaceBox = {
  height: number;
  width: number;
  x: number;
  y: number;
};

type WebcamMetricInput = {
  faces: FaceBox[];
  frameHeight: number;
  frameWidth: number;
  previous: WebcamAnalysisMetrics;
  timestamp: number;
};

export const emptyWebcamMetrics: WebcamAnalysisMetrics = {
  analysisAvailable: false,
  extendedAwayMs: 0,
  faceState: "unknown",
  headPosition: "unknown",
  lastUpdatedAt: null,
  lookingAwayCount: 0,
  lookingAwayMs: 0
};

export const emptySpeakingMetrics: SpeakingMetrics = {
  lastPauseMs: 0,
  longestPauseMs: 0,
  pauseCount: 0,
  sessionStartedAt: null,
  speakingDurationMs: 0
};

export function createWebcamMetrics({
  faces,
  frameHeight,
  frameWidth,
  previous,
  timestamp
}: WebcamMetricInput): WebcamAnalysisMetrics {
  const elapsedMs = previous.lastUpdatedAt ? Math.max(0, timestamp - previous.lastUpdatedAt) : 0;

  if (!faces.length) {
    const wasFacing = previous.faceState === "detected" && previous.headPosition !== "away";

    return {
      analysisAvailable: true,
      extendedAwayMs: previous.extendedAwayMs + elapsedMs,
      faceState: "not-detected",
      headPosition: "away",
      lastUpdatedAt: timestamp,
      lookingAwayCount: previous.lookingAwayCount + (wasFacing ? 1 : 0),
      lookingAwayMs: previous.lookingAwayMs + elapsedMs
    };
  }

  const primaryFace = faces[0];
  const headPosition = estimateHeadPosition(primaryFace, frameWidth, frameHeight);
  const isFacing = headPosition === "centered";
  const wasFacing = previous.faceState === "detected" && previous.headPosition === "centered";

  return {
    analysisAvailable: true,
    extendedAwayMs: isFacing ? 0 : previous.extendedAwayMs + elapsedMs,
    faceState: "detected",
    headPosition,
    lastUpdatedAt: timestamp,
    lookingAwayCount: previous.lookingAwayCount + (!isFacing && wasFacing ? 1 : 0),
    lookingAwayMs: previous.lookingAwayMs + (isFacing ? 0 : elapsedMs)
  };
}

export function markWebcamAnalysisUnavailable(previous: WebcamAnalysisMetrics): WebcamAnalysisMetrics {
  return {
    ...previous,
    analysisAvailable: false,
    faceState: "unavailable",
    headPosition: "unknown",
    lastUpdatedAt: Date.now()
  };
}

export function startSpeakingSession(current: SpeakingMetrics, timestamp = Date.now()): SpeakingMetrics {
  return {
    ...current,
    lastPauseMs: 0,
    sessionStartedAt: timestamp
  };
}

export function recordSpeechActivity(current: SpeakingMetrics, timestamp = Date.now()): SpeakingMetrics {
  if (!current.sessionStartedAt) {
    return startSpeakingSession(current, timestamp);
  }

  return {
    ...current,
    lastPauseMs: 0,
    speakingDurationMs: current.speakingDurationMs + Math.max(0, timestamp - current.sessionStartedAt),
    sessionStartedAt: timestamp
  };
}

export function recordSpeakingPause(current: SpeakingMetrics, timestamp = Date.now()): SpeakingMetrics {
  if (!current.sessionStartedAt) {
    return current;
  }

  const pauseMs = Math.max(0, timestamp - current.sessionStartedAt);

  return {
    lastPauseMs: pauseMs,
    longestPauseMs: Math.max(current.longestPauseMs, pauseMs),
    pauseCount: current.pauseCount + (pauseMs > 1200 ? 1 : 0),
    sessionStartedAt: null,
    speakingDurationMs: current.speakingDurationMs
  };
}

function estimateHeadPosition(face: FaceBox, frameWidth: number, frameHeight: number): HeadPosition {
  const centerX = face.x + face.width / 2;
  const centerY = face.y + face.height / 2;
  const horizontalPosition = centerX / frameWidth;
  const verticalPosition = centerY / frameHeight;

  if (horizontalPosition < 0.34) {
    return "left";
  }

  if (horizontalPosition > 0.66) {
    return "right";
  }

  if (verticalPosition < 0.3) {
    return "high";
  }

  if (verticalPosition > 0.72) {
    return "low";
  }

  return "centered";
}
