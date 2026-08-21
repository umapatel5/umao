export type CameraPermissionState = "idle" | "requesting" | "granted" | "denied" | "unsupported" | "error";

export type FacePresenceState = "unknown" | "detected" | "not-detected" | "unavailable";

export type HeadPosition = "unknown" | "centered" | "left" | "right" | "high" | "low" | "away";

export type WebcamAnalysisMetrics = {
  analysisAvailable: boolean;
  extendedAwayMs: number;
  faceState: FacePresenceState;
  headPosition: HeadPosition;
  lastUpdatedAt: number | null;
  lookingAwayCount: number;
  lookingAwayMs: number;
};

export type SpeakingMetrics = {
  lastPauseMs: number;
  longestPauseMs: number;
  pauseCount: number;
  sessionStartedAt: number | null;
  speakingDurationMs: number;
};
