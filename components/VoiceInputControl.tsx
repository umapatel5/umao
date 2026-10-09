"use client";

import { useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import {
  emptySpeakingMetrics,
  recordSpeakingPause,
  recordSpeechActivity,
  startSpeakingSession
} from "@/lib/webcam/candidate-webcam";
import { stopInterviewerSpeech } from "@/lib/speech/interviewer-speech";
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
  const interimTranscriptRef = useRef("");
  const micPermissionGrantedRef = useRef(false);
  const speakingMetricsRef = useRef<SpeakingMetrics>(emptySpeakingMetrics);
  const userStoppedRecordingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    "Voice input is ready when your browser supports speech recognition."
  );

  async function startRecording() {
    setError(null);
    setInterimTranscript("");
    setLastTranscript("");
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    micPermissionGrantedRef.current = false;
    userStoppedRecordingRef.current = false;
    setStatusMessage("Checking microphone access...");
    stopInterviewerSpeech();

    const SpeechRecognition =
      (window as SpeechWindow).SpeechRecognition ?? (window as SpeechWindow).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Use typed input instead.");
      setStatusMessage("Typed input is still available.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices?.getUserMedia({ audio: true });
      stream?.getTracks().forEach((track) => track.stop());
      micPermissionGrantedRef.current = true;
      setStatusMessage("Microphone is allowed. Start speaking when the listening state appears.");
    } catch {
      setError("Microphone permission was denied. You can still type your response.");
      setStatusMessage("Typed input is still available.");
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

      interimTranscriptRef.current = interim.trim();
      setInterimTranscript(interim.trim());
    };

    recognition.onerror = (event) => {
      const transcript = getCurrentTranscript();

      if (event.error === "aborted" && userStoppedRecordingRef.current) {
        return;
      }

      if (transcript) {
        setLastTranscript(transcript);
        onTranscriptReady(transcript);
        setError(null);
      } else {
        setError(getSpeechErrorMessage(event.error, micPermissionGrantedRef.current));
      }

      setStatusMessage("Typed input is still available if speech recognition keeps failing.");
      setIsListening(false);
      onListeningChange?.(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      onListeningChange?.(false);
      updateSpeakingMetrics(recordSpeakingPause(speakingMetricsRef.current));
      const transcript = getCurrentTranscript();

      if (transcript) {
        setLastTranscript(transcript);
        setInterimTranscript("");
        interimTranscriptRef.current = "";
        finalTranscriptRef.current = "";
        onTranscriptReady(transcript);
        setError(null);
        setStatusMessage("Transcript added below. Review or edit it, then press Send.");
      } else if (userStoppedRecordingRef.current) {
        setError("No transcript was captured. Try speaking for a few seconds before pressing Stop, or type your response.");
        setStatusMessage("Microphone permission is allowed, but speech-to-text did not capture words.");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    updateSpeakingMetrics(startSpeakingSession(speakingMetricsRef.current));
    setIsListening(true);
    setStatusMessage("Listening... speak clearly, then press Stop when you are done.");
    onListeningChange?.(true);
  }

  function stopRecording() {
    userStoppedRecordingRef.current = true;
    setStatusMessage("Processing your transcript...");
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    onListeningChange?.(false);
  }

  function updateSpeakingMetrics(metrics: SpeakingMetrics) {
    speakingMetricsRef.current = metrics;
    onSpeakingMetricsChange?.(metrics);
  }

  function getCurrentTranscript() {
    return `${finalTranscriptRef.current} ${interimTranscriptRef.current}`.trim();
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
        {statusMessage}
      </div>

      {interimTranscript ? <div className="voice-preview">{interimTranscript}</div> : null}
      {error ? <div className="console-notice warning">{error}</div> : null}
    </div>
  );
}

function getSpeechErrorMessage(error?: string, micPermissionGranted = false) {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return micPermissionGranted
      ? "Your microphone is allowed, but browser speech recognition is blocked or unavailable. Try Chrome, refresh, or use typed input."
      : "Microphone permission was denied. You can still type your response.";
  }

  if (error === "no-speech") {
    return "No speech was detected. Speak for a few seconds before pressing Stop, or type your response.";
  }

  if (error === "audio-capture") {
    return "No microphone was detected. Check your input device or type your response.";
  }

  if (error === "network") {
    return "Your microphone is allowed, but the browser speech-recognition service could not connect. Refresh, try Chrome, or use typed input.";
  }

  if (error === "aborted") {
    return "Recording stopped before speech recognition returned text. Try again and speak for a few seconds first.";
  }

  return micPermissionGranted
    ? "Your microphone is allowed, but speech recognition failed. Try again, refresh the page, or use typed input."
    : "Transcription failed. Try again or use typed input.";
}
