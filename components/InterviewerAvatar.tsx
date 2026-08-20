import Image from "next/image";
import type { CSSProperties } from "react";
import { AudioLines, Brain, Ear, Sparkles } from "lucide-react";
import { getAvatarPlaybackLabel, getAvatarStateView } from "@/lib/avatar/interviewer-avatar";
import type { AvatarPlaybackSnapshot, InterviewerAvatarState } from "@/types/avatar";

type InterviewerAvatarProps = {
  playback: AvatarPlaybackSnapshot;
  state: InterviewerAvatarState;
};

export function InterviewerAvatar({ playback, state }: InterviewerAvatarProps) {
  const stateView = getAvatarStateView(state);
  const StateIcon = getStateIcon(state);
  const mouthOpen = playback.status === "playing" ? playback.cue?.intensity ?? 0.2 : 0;
  const mouthShape = playback.cue?.shape ?? "closed";

  return (
    <div
      aria-label={stateView.ariaLabel}
      className={`interviewer-avatar-frame ${state} avatar-playback-${playback.status}`}
      role="img"
    >
      <div className="avatar-portrait-shell">
        <Image
          alt=""
          className="avatar-portrait"
          fill
          priority
          sizes="(max-width: 900px) 100vw, 420px"
          src="/avatar/interviewer.png"
        />
        <div className="avatar-video-light" />
        <div
          aria-hidden
          className={`avatar-lip-sync-track ${mouthShape}`}
          style={{ "--mouth-open": mouthOpen } as CSSProperties}
        >
          <span className="avatar-mouth-cue" />
          <span className="avatar-mouth-label">Lip-sync</span>
        </div>
      </div>

      <div className="avatar-state-card">
        <div className="avatar-state-icon">
          <StateIcon aria-hidden size={18} />
        </div>
        <div>
          <strong>{stateView.label}</strong>
          <span>{getAvatarPlaybackLabel(playback)}</span>
        </div>
      </div>
    </div>
  );
}

function getStateIcon(state: InterviewerAvatarState) {
  if (state === "listening") {
    return Ear;
  }

  if (state === "thinking") {
    return Brain;
  }

  if (state === "speaking") {
    return AudioLines;
  }

  return Sparkles;
}
