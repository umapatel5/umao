import type { AvatarPlaybackSnapshot, InterviewerAvatarState } from "@/types/avatar";

type AvatarStateView = {
  label: string;
  helperText: string;
  ariaLabel: string;
};

const avatarStateViews: Record<InterviewerAvatarState, AvatarStateView> = {
  idle: {
    label: "Ready",
    helperText: "Waiting for the next response",
    ariaLabel: "AI interviewer is idle"
  },
  listening: {
    label: "Listening",
    helperText: "Candidate voice input is active",
    ariaLabel: "AI interviewer is listening"
  },
  thinking: {
    label: "Thinking",
    helperText: "Reviewing code and test context",
    ariaLabel: "AI interviewer is thinking"
  },
  speaking: {
    label: "Speaking",
    helperText: "Interviewer audio is playing",
    ariaLabel: "AI interviewer is speaking"
  }
};

export function getAvatarStateView(state: InterviewerAvatarState) {
  return avatarStateViews[state];
}

export function getAvatarPlaybackLabel(playback: AvatarPlaybackSnapshot) {
  if (playback.status === "loading") {
    return "Preparing lip-sync";
  }

  if (playback.status === "playing") {
    return `${playback.providerName} active`;
  }

  if (playback.status === "error") {
    return playback.error ?? "Avatar playback failed";
  }

  return "Lip-sync provider standby";
}
