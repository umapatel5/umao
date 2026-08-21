"use client";

import { useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import {
  emptySpeakingMetrics,
  recordSpeakingPause,
  recordSpeechActivity,
  startSpeakingSession
} from "@/lib/webcam/candidate-webcam";
import type { SpeakingMetrics } from "@/types/candidate-analysis";

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
  message?: string;
};

type SpeechRecognitionResultEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type SpeechWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

type VoiceInputControlProps = {
  disabled?: boolean;
  onListeningChange?: (isListening: boolean) => void;
  onSpeakingMetricsChange?: (metrics: SpeakingMetrics) => void;
  onTranscriptReady: (transcript: string) => void;
};

export function VoiceInputControl({
  disabled = false,
  onListeningChange,
  onSpeakingMetricsChange,
  onTranscriptReady
}: VoiceInputControlProps) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef("");
  const speakingMetricsRef = useRef<SpeakingMetrics>(emptySpeakingMetrics);
  const [error, setError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);

  async function startRecording() {
    setError(null);
    setInterimTranscript("");
    finalTranscriptRef.current = "";

    const SpeechRecognition =
      (window as SpeechWindow).SpeechRecognition ?? (window as SpeechWindow).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Use typed input instead.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices?.getUserMedia({ audio: true });
      stream?.getTracks().forEach((track) => track.stop());
    } catch {
      setError("Microphone permission was denied. You can still type your response.");
      setIsListening(false);
      onListeningChange?.(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript;

        if (event.results[index].isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }

      if (finalText.trim()) {
        finalTranscriptRef.current = `${finalTranscriptRef.current} ${finalText}`.trim();
        updateSpeakingMetrics(recordSpeechActivity(speakingMetricsRef.current));
      }

      setInterimTranscript(interim.trim());
    };

    recognition.onerror = (event) => {
      setError(getSpeechErrorMessage(event.error));
      setIsListening(false);
      onListeningChange?.(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      onListeningChange?.(false);
      updateSpeakingMetrics(recordSpeakingPause(speakingMetricsRef.current));
      const transcript = finalTranscriptRef.current.trim();

      if (transcript) {
        onTranscriptReady(transcript);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    updateSpeakingMetrics(startSpeakingSession(speakingMetricsRef.current));
    setIsListening(true);
    onListeningChange?.(true);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    onListeningChange?.(false);
  }

  function updateSpeakingMetrics(metrics: SpeakingMetrics) {
    speakingMetricsRef.current = metrics;
    onSpeakingMetricsChange?.(metrics);
  }

  return (
    <div className="voice-input-control">
      <div className="voice-actions">
        <button
          className={isListening ? "button button-primary recording-button" : "button button-secondary"}
          disabled={disabled || isListening}
          onClick={startRecording}
          type="button"
        >
          <Mic aria-hidden size={17} />
          Start Recording
        </button>
        <button
          className="button button-secondary"
          disabled={disabled || !isListening}
          onClick={stopRecording}
          type="button"
        >
          <MicOff aria-hidden size={17} />
          Stop
        </button>
      </div>

      <div className={isListening ? "voice-status listening" : "voice-status"}>
        {isListening ? "Listening..." : "Voice input is ready when your browser supports speech recognition."}
      </div>

      {interimTranscript ? <div className="voice-preview">{interimTranscript}</div> : null}
      {error ? <div className="console-notice warning">{error}</div> : null}
    </div>
  );
}

function getSpeechErrorMessage(error?: string) {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "Microphone permission was denied. You can still type your response.";
  }

  if (error === "no-speech") {
    return "No speech was detected. Try recording again or type your response.";
  }

  if (error === "audio-capture") {
    return "No microphone was detected. Check your input device or type your response.";
  }

  return "Transcription failed. Try again or use typed input.";
}
