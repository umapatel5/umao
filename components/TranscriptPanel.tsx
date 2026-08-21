"use client";

import { FormEvent, useState } from "react";
import { Lightbulb, Loader2, MessageSquareText, SendHorizontal } from "lucide-react";
import { InterviewerSpeechControls } from "@/components/InterviewerSpeechControls";
import { VoiceInputControl } from "@/components/VoiceInputControl";
import type { SpeechPlaybackStatus } from "@/lib/speech/interviewer-speech";
import type { AvatarPlaybackSnapshot } from "@/types/avatar";
import type { SpeakingMetrics } from "@/types/candidate-analysis";
import type { InterviewMessage } from "@/types/interviewer";

type TranscriptPanelProps = {
  avatarProvider: "local" | "tavus";
  error: string | null;
  isThinking: boolean;
  messages: InterviewMessage[];
  onAvatarPlaybackChange?: (snapshot: AvatarPlaybackSnapshot) => void;
  onSpeechStatusChange?: (status: SpeechPlaybackStatus) => void;
  onSpeakingMetricsChange?: (metrics: SpeakingMetrics) => void;
  onVoiceListeningChange?: (isListening: boolean) => void;
  onSendMessage: (message: string, options?: { isHintRequest?: boolean }) => Promise<void>;
};

export function TranscriptPanel({
  avatarProvider,
  error,
  isThinking,
  messages,
  onAvatarPlaybackChange,
  onSpeechStatusChange,
  onSpeakingMetricsChange,
  onVoiceListeningChange,
  onSendMessage
}: TranscriptPanelProps) {
  const [draft, setDraft] = useState("");
  const latestInterviewerMessage =
    [...messages].reverse().find((message) => message.role === "interviewer") ?? null;

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draft.trim();

    if (!trimmed || isThinking) {
      return;
    }

    setDraft("");
    await onSendMessage(trimmed);
  }

  async function askForHint() {
    if (isThinking) {
      return;
    }

    await onSendMessage("Can I get a small hint?", { isHintRequest: true });
  }

  function applyVoiceTranscript(transcript: string) {
    setDraft((current) => `${current} ${transcript}`.trim());
  }

  return (
    <section className="card panel interview-support-card" aria-labelledby="transcript-title">
      <div className="side-panel-header compact-panel-header">
        <div>
          <h2 className="section-title" id="transcript-title">
            Live transcript
          </h2>
          <div className="meta">Typed and spoken responses</div>
        </div>
        <MessageSquareText aria-hidden size={19} />
      </div>

      <div className="transcript-list">
        {messages.map((line) => (
          <article className={`transcript-line ${line.role}`} key={line.id}>
            <div className="transcript-speaker-row">
              <strong>{formatRole(line.role)}</strong>
              <span>{line.timestamp}</span>
            </div>
            <p>{line.text}</p>
          </article>
        ))}

        {isThinking ? (
          <div className="console-notice">
            <Loader2 aria-hidden className="spin-icon" size={17} />
            Interviewer is thinking...
          </div>
        ) : null}

        {error ? <div className="console-notice warning">{error}</div> : null}
      </div>

      <InterviewerSpeechControls
        avatarProvider={avatarProvider}
        latestMessage={latestInterviewerMessage}
        onAvatarPlaybackChange={onAvatarPlaybackChange}
        onStatusChange={onSpeechStatusChange}
      />

      <form className="transcript-input-row" onSubmit={submitMessage}>
        <label className="sr-only" htmlFor="candidate-message">
          Message the interviewer
        </label>
        <input
          id="candidate-message"
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type a response or ask for a hint..."
          value={draft}
        />
        <button className="button button-primary" disabled={isThinking || !draft.trim()} type="submit">
          <SendHorizontal aria-hidden size={17} />
          Send
        </button>
      </form>

      <VoiceInputControl
        disabled={isThinking}
        onListeningChange={onVoiceListeningChange}
        onSpeakingMetricsChange={onSpeakingMetricsChange}
        onTranscriptReady={applyVoiceTranscript}
      />

      <button
        className="button button-secondary hint-action"
        disabled={isThinking}
        onClick={askForHint}
        type="button"
      >
        <Lightbulb aria-hidden size={17} />
        Ask for Hint
      </button>
    </section>
  );
}

function formatRole(role: InterviewMessage["role"]) {
  if (role === "interviewer") {
    return "Interviewer";
  }

  if (role === "candidate") {
    return "Candidate";
  }

  return "System";
}
