import { Camera, UserRound } from "lucide-react";
import { InterviewerAvatar } from "@/components/InterviewerAvatar";
import { TavusAvatarFrame } from "@/components/TavusAvatarFrame";
import { getAvatarPlaybackLabel, getAvatarStateView } from "@/lib/avatar/interviewer-avatar";
import type { AvatarPlaybackSnapshot, InterviewerAvatarState, TavusAvatarSession } from "@/types/avatar";
import type { InterviewMessage } from "@/types/interviewer";

type InterviewerPanelProps = {
  avatarPlayback: AvatarPlaybackSnapshot;
  avatarState: InterviewerAvatarState;
  latestInterviewerMessage: InterviewMessage | null;
  onAvatarPlaybackChange: (snapshot: AvatarPlaybackSnapshot) => void;
  tavusSession: TavusAvatarSession;
};

export function InterviewerPanel({
  avatarPlayback,
  avatarState,
  latestInterviewerMessage,
  onAvatarPlaybackChange,
  tavusSession
}: InterviewerPanelProps) {
  const stateView = getAvatarStateView(avatarState);
  const isTavusActive = tavusSession.status === "active" && tavusSession.conversationUrl;

  return (
    <section className="card panel interview-support-card" aria-labelledby="interviewer-title">
      <div className="side-panel-header compact-panel-header">
        <div>
          <h2 className="section-title" id="interviewer-title">
            AI interviewer
          </h2>
          <div className="meta">Local avatar preview</div>
        </div>
        <span className={`pill avatar-pill ${avatarState}`}>{stateView.label}</span>
      </div>

      <div className="video-stage">
        {isTavusActive ? (
          <TavusAvatarFrame
            echoMessage={latestInterviewerMessage}
            onPlaybackChange={onAvatarPlaybackChange}
            session={tavusSession}
          />
        ) : (
          <InterviewerAvatar playback={avatarPlayback} state={avatarState} />
        )}

        <div className="user-webcam-tile">
          <UserRound aria-hidden size={22} />
          <div>
            <strong>User webcam</strong>
            <span>Preview placeholder</span>
          </div>
        </div>
      </div>

      <div className="media-status-row">
        <span>
          <Camera aria-hidden size={15} />
          Camera not connected
        </span>
        <span>
          {getMediaStatus({
            avatarPlayback,
            fallbackText: stateView.helperText,
            tavusSession
          })}
        </span>
      </div>
      {tavusSession.reason ? <div className="avatar-provider-note">{tavusSession.reason}</div> : null}
    </section>
  );
}

function getMediaStatus({
  avatarPlayback,
  fallbackText,
  tavusSession
}: {
  avatarPlayback: AvatarPlaybackSnapshot;
  fallbackText: string;
  tavusSession: TavusAvatarSession;
}) {
  if (tavusSession.status === "loading") {
    return "Connecting Tavus avatar...";
  }

  if (tavusSession.status === "active") {
    return avatarPlayback.status === "idle" ? "Tavus avatar connected" : getAvatarPlaybackLabel(avatarPlayback);
  }

  if (avatarPlayback.status !== "idle") {
    return getAvatarPlaybackLabel(avatarPlayback);
  }

  return fallbackText;
}
