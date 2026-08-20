"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw, Volume2, VolumeX } from "lucide-react";
import {
  createAvatarErrorPlayback,
  createAvatarLoadingPlayback,
  createIdleAvatarPlayback,
  createLocalLipSyncAvatarProvider,
  type AvatarPlaybackSession
} from "@/lib/avatar/avatar-playback";
import {
  speakInterviewerText,
  stopInterviewerSpeech,
  type SpeechPlaybackHandle,
  type SpeechPlaybackStatus
} from "@/lib/speech/interviewer-speech";
import type { AvatarPlaybackSnapshot } from "@/types/avatar";
import type { InterviewMessage } from "@/types/interviewer";

type InterviewerSpeechControlsProps = {
  avatarProvider: "local" | "tavus";
  latestMessage: InterviewMessage | null;
  onAvatarPlaybackChange?: (snapshot: AvatarPlaybackSnapshot) => void;
  onStatusChange?: (status: SpeechPlaybackStatus) => void;
};

export function InterviewerSpeechControls({
  avatarProvider,
  latestMessage,
  onAvatarPlaybackChange,
  onStatusChange
}: InterviewerSpeechControlsProps) {
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState<SpeechPlaybackStatus>("idle");
  const avatarProviderRef = useRef(createLocalLipSyncAvatarProvider());
  const avatarSessionRef = useRef<AvatarPlaybackSession | null>(null);
  const playbackRef = useRef<SpeechPlaybackHandle | null>(null);
  const mountedRef = useRef(false);
  const spokenMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  const stopAvatarPlayback = useCallback(() => {
    avatarSessionRef.current?.stop();
    avatarSessionRef.current = null;
    onAvatarPlaybackChange?.(createIdleAvatarPlayback());
  }, [onAvatarPlaybackChange]);

  const startAvatarPlayback = useCallback(
    (message: InterviewMessage, text: string) => {
      avatarSessionRef.current?.stop();

      try {
        avatarSessionRef.current = avatarProviderRef.current.start(
          {
            messageId: message.id,
            text
          },
          {
            onError: (messageText) => onAvatarPlaybackChange?.(createAvatarErrorPlayback(messageText)),
            onUpdate: (snapshot) => onAvatarPlaybackChange?.(snapshot)
          }
        );
      } catch (avatarError) {
        onAvatarPlaybackChange?.(
          createAvatarErrorPlayback(
            avatarError instanceof Error ? avatarError.message : "Avatar provider failed."
          )
        );
      }
    },
    [onAvatarPlaybackChange]
  );

  const playMessage = useCallback(
    (message = latestMessage) => {
      if (!message?.text || isMuted) {
        return;
      }

      if (avatarProvider === "tavus") {
        setError(null);
        setStatus("idle");
        return;
      }

      setError(null);
      setStatus("loading");
      onAvatarPlaybackChange?.(createAvatarLoadingPlayback());

      try {
        playbackRef.current = speakInterviewerText(message.text, {
          onStart: () => {
            setStatus("speaking");
            startAvatarPlayback(message, message.text);
          },
          onEnd: () => {
            setStatus("idle");
            stopAvatarPlayback();
          },
          onError: (message) => {
            setError(message);
            setStatus("error");
            stopAvatarPlayback();
            onAvatarPlaybackChange?.(createAvatarErrorPlayback(message));
          }
        });
      } catch (speechError) {
        const messageText =
          speechError instanceof Error ? speechError.message : "Speech playback failed.";
        setError(messageText);
        setStatus("error");
        stopAvatarPlayback();
        onAvatarPlaybackChange?.(createAvatarErrorPlayback(messageText));
      }
    },
    [avatarProvider, isMuted, latestMessage, onAvatarPlaybackChange, startAvatarPlayback, stopAvatarPlayback]
  );

  useEffect(() => {
    if (!latestMessage) {
      return;
    }

    if (!mountedRef.current) {
      mountedRef.current = true;
      spokenMessageIdRef.current = latestMessage.id;
      return;
    }

    if (spokenMessageIdRef.current === latestMessage.id) {
      return;
    }

    spokenMessageIdRef.current = latestMessage.id;

    if (!isMuted) {
      playMessage(latestMessage);
    }

    return () => {
      playbackRef.current?.cancel();
      stopAvatarPlayback();
    };
  }, [isMuted, latestMessage, playMessage, stopAvatarPlayback]);

  function toggleMute() {
    setIsMuted((current) => {
      const next = !current;

      if (next) {
        playbackRef.current?.cancel();
        stopInterviewerSpeech();
        setStatus("idle");
        stopAvatarPlayback();
      }

      return next;
    });
  }

  return (
    <div className="interviewer-speech-controls" aria-live="polite">
      <div className="speech-status-row">
        <span className={`speech-status ${status === "speaking" ? "speaking" : ""}`}>
          {status === "loading" ? <Loader2 aria-hidden className="spin-icon" size={15} /> : null}
          {getStatusLabel(status, isMuted, avatarProvider)}
        </span>
        <div className="speech-buttons">
          <button
            aria-label={isMuted ? "Unmute interviewer voice" : "Mute interviewer voice"}
            className="icon-button"
            disabled={avatarProvider === "tavus"}
            onClick={toggleMute}
            title={isMuted ? "Unmute interviewer voice" : "Mute interviewer voice"}
            type="button"
          >
            {isMuted ? <VolumeX aria-hidden size={17} /> : <Volume2 aria-hidden size={17} />}
          </button>
          <button
            aria-label="Replay interviewer response"
            className="icon-button"
            disabled={!latestMessage || isMuted || avatarProvider === "tavus"}
            onClick={() => playMessage()}
            title="Replay interviewer response"
            type="button"
          >
            <RotateCcw aria-hidden size={17} />
          </button>
        </div>
      </div>
      {error ? <div className="console-notice warning">{error}</div> : null}
    </div>
  );
}

function getStatusLabel(
  status: SpeechPlaybackStatus,
  isMuted: boolean,
  avatarProvider: "local" | "tavus"
) {
  if (avatarProvider === "tavus") {
    return "Tavus avatar voice active";
  }

  if (isMuted) {
    return "Interviewer voice muted";
  }

  if (status === "loading") {
    return "Preparing interviewer voice...";
  }

  if (status === "speaking") {
    return "Interviewer is speaking...";
  }

  if (status === "error") {
    return "Speech playback unavailable";
  }

  return "Interviewer voice ready";
}
