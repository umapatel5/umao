export type InterviewerAvatarState = "idle" | "listening" | "thinking" | "speaking";

export type AvatarPlaybackStatus = "idle" | "loading" | "playing" | "error";

export type AvatarMouthShape = "closed" | "narrow" | "wide" | "round";

export type AvatarMouthCue = {
  intensity: number;
  shape: AvatarMouthShape;
};

export type AvatarPlaybackSnapshot = {
  cue: AvatarMouthCue | null;
  error: string | null;
  providerName: string;
  status: AvatarPlaybackStatus;
};

export type TavusAvatarSession = {
  conversationId: string | null;
  conversationUrl: string | null;
  echoModeEnabled: boolean;
  isTestMode: boolean;
  provider: "local" | "tavus";
  reason: string | null;
  status: "idle" | "loading" | "active" | "fallback" | "error";
};
