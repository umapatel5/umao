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
  const [isListening, setIsListening] = useState(false);
  const latestInterviewerMessage =
    [...messages].reverse().find((message) => message.role === "interviewer") ?? null;

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draft.trim();

    if (!trimmed || isThinking || isListening) {
      return;
    }

    setDraft("");
    await onSendMessage(trimmed);
  }

  async function askForHint() {
    if (isThinking || isListening) {
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

      <form className="interview-composer" onSubmit={submitMessage}>
        <label className="sr-only" htmlFor="candidate-message">
          Message the interviewer
        </label>
        <textarea
          id="candidate-message"
          rows={3}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Your answer..."
          value={draft}
        />
        <VoiceInputControl
        disabled={isThinking}
        onListeningChange={(listening) => {
          setIsListening(listening);
          onVoiceListeningChange?.(listening);
        }}
        onSpeakingMetricsChange={onSpeakingMetricsChange}
        onTranscriptReady={applyVoiceTranscript}
        trailingControls={<>
          <button
        className="composer-tool"
        disabled={isThinking || isListening}
        onClick={askForHint}
        title="Ask for a hint"
        aria-label="Ask for a hint"
        type="button"
      >
        <Lightbulb aria-hidden size={17} />
      </button>
          <button className="composer-send" aria-label="Send answer" title="Send answer" disabled={isThinking || isListening || !draft.trim()} type="submit">
            {isThinking ? <Loader2 aria-hidden className="spin-icon" size={18} /> : <SendHorizontal aria-hidden size={18} />}
          </button>
        </>}
      />
      </form>
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
