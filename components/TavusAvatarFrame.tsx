"use client";

import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import {
  createAvatarErrorPlayback,
  createIdleAvatarPlayback,
  createTavusAvatarLoadingPlayback,
  createTavusAvatarPlayingPlayback
} from "@/lib/avatar/avatar-playback";
import { createTavusEchoInteraction } from "@/lib/avatar/tavus-echo";
import type { AvatarPlaybackSnapshot, TavusAvatarSession } from "@/types/avatar";
import type { InterviewMessage } from "@/types/interviewer";

type DailyCallFrame = {
  destroy: () => Promise<void>;
  join: (options: {
    startAudioOff?: boolean;
    startVideoOff?: boolean;
    userName?: string;
  }) => Promise<void>;
  leave: () => Promise<void>;
  meetingState: () => "new" | "loading" | "loaded" | "joining-meeting" | "joined-meeting" | "left-meeting" | "error";
  on: (eventName: string, callback: (event: { data?: unknown }) => void) => void;
  sendAppMessage: (message: unknown, recipient: string) => void;
};

type DailyMeetingState = ReturnType<DailyCallFrame["meetingState"]>;

type DailyIframeModule = {
  createCallObject: () => DailyCallFrame;
  getCallInstance?: () => DailyCallFrame | undefined;
};

type TavusAvatarFrameProps = {
  echoMessage: InterviewMessage | null;
  onPlaybackChange: (snapshot: AvatarPlaybackSnapshot) => void;
  session: TavusAvatarSession;
};

const estimatedSpeechMsPerCharacter = 62;

export function TavusAvatarFrame({
  echoMessage,
  onPlaybackChange,
  session
}: TavusAvatarFrameProps) {
  const callRef = useRef<DailyCallFrame | null>(null);
  const echoedMessageIdRef = useRef<string | null>(null);
  const speakingTimeoutRef = useRef<number | null>(null);
  const readinessIntervalRef = useRef<number | null>(null);
  const readinessTimeoutRef = useRef<number | null>(null);
  const [dailyState, setDailyState] = useState<DailyMeetingState>("new");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let didCancel = false;

    async function joinTavusRoom() {
      if (!session.conversationUrl) {
        return;
      }

      setIsReady(false);
      onPlaybackChange(createTavusAvatarLoadingPlayback());

      try {
        const DailyIframe = (await import("@daily-co/daily-js")).default as DailyIframeModule;
        const existingCall = DailyIframe.getCallInstance?.();

        if (existingCall) {
          await cleanupCallFrame(existingCall);
        }

        const call = DailyIframe.createCallObject();

        if (didCancel) {
          await cleanupCallFrame(call);
          return;
        }

        const markReady = () => {
          if (!didCancel) {
            clearReadinessTimers(readinessIntervalRef, readinessTimeoutRef);
            setDailyState("joined-meeting");
            setIsReady(true);
            onPlaybackChange(createIdleAvatarPlayback());
          }
        };

        call.on("joined-meeting", markReady);
        call.on("error", () => {
          onPlaybackChange(createAvatarErrorPlayback("Tavus room connection failed."));
        });
        call.on("app-message", (event) => {
          const payload = event.data;

          if (isTavusUtteranceEvent(payload)) {
            onPlaybackChange(
              payload.properties.interrupted
                ? createIdleAvatarPlayback()
                : createTavusAvatarPlayingPlayback()
            );
          }
        });

        callRef.current = call;
        void call.join({
          startAudioOff: true,
          startVideoOff: true,
          userName: "Umao Echo Controller"
        }).catch((error) => {
          setDailyState("error");
          onPlaybackChange(
            createAvatarErrorPlayback(
              error instanceof Error ? error.message : "Could not join Tavus Echo room."
            )
          );
        });

        readinessIntervalRef.current = window.setInterval(() => {
          const meetingState = call.meetingState();
          setDailyState(meetingState);

          if (meetingState === "joined-meeting") {
            markReady();
          }
        }, 300);

        readinessTimeoutRef.current = window.setTimeout(() => {
          if (!didCancel && call.meetingState() !== "joined-meeting") {
            clearReadinessTimers(readinessIntervalRef, readinessTimeoutRef);
            setDailyState(call.meetingState());
            onPlaybackChange(createAvatarErrorPlayback("Tavus room did not finish joining."));
          }
        }, 20000);
      } catch (error) {
        onPlaybackChange(
          createAvatarErrorPlayback(
            error instanceof Error ? error.message : "Could not connect Tavus Echo avatar."
          )
        );
      }
    }

    void joinTavusRoom();

    return () => {
      didCancel = true;
      clearSpeakingTimer(speakingTimeoutRef);
      clearReadinessTimers(readinessIntervalRef, readinessTimeoutRef);
      setIsReady(false);
      void callRef.current?.leave();
      void callRef.current?.destroy();
      callRef.current = null;
      onPlaybackChange(createIdleAvatarPlayback());
    };
  }, [onPlaybackChange, session.conversationUrl]);

  useEffect(() => {
    if (!echoMessage || !session.conversationId || !isReady || !callRef.current) {
      return;
    }

    if (echoedMessageIdRef.current === echoMessage.id) {
      return;
    }

    echoedMessageIdRef.current = echoMessage.id;
    onPlaybackChange(createTavusAvatarLoadingPlayback());

    try {
      callRef.current.sendAppMessage(
        createTavusEchoInteraction({
          conversationId: session.conversationId,
          messageId: echoMessage.id,
          text: echoMessage.text
        }),
        "*"
      );

      onPlaybackChange(createTavusAvatarPlayingPlayback());
      clearSpeakingTimer(speakingTimeoutRef);
      speakingTimeoutRef.current = window.setTimeout(() => {
        onPlaybackChange(createIdleAvatarPlayback());
      }, getEstimatedSpeechDuration(echoMessage.text));
    } catch (error) {
      onPlaybackChange(
        createAvatarErrorPlayback(
          error instanceof Error ? error.message : "Could not send Tavus Echo message."
        )
      );
    }
  }, [echoMessage, isReady, onPlaybackChange, session.conversationId]);

  return (
    <div className="tavus-avatar-frame" data-daily-state={dailyState}>
      <iframe
        allow="microphone; autoplay; fullscreen; display-capture"
        className="tavus-avatar-iframe"
        src={session.conversationUrl ?? undefined}
        title="Tavus AI interviewer avatar"
      />
    </div>
  );
}

function getEstimatedSpeechDuration(text: string) {
  return Math.min(Math.max(text.length * estimatedSpeechMsPerCharacter, 1800), 12000);
}

function clearSpeakingTimer(timerRef: MutableRefObject<number | null>) {
  if (timerRef.current) {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}

function clearReadinessTimers(
  intervalRef: MutableRefObject<number | null>,
  timeoutRef: MutableRefObject<number | null>
) {
  if (intervalRef.current) {
    window.clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  if (timeoutRef.current) {
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
}

async function cleanupCallFrame(call: DailyCallFrame) {
  await call.leave().catch(() => undefined);
  await call.destroy().catch(() => undefined);
}

function isTavusUtteranceEvent(value: unknown): value is {
  event_type: "conversation.utterance";
  properties: {
    interrupted?: boolean;
  };
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "event_type" in value &&
    value.event_type === "conversation.utterance"
  );
}
