"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CodeEditorPanel } from "@/components/CodeEditorPanel";
import { InterviewerPanel } from "@/components/InterviewerPanel";
import { ProblemPanel } from "@/components/ProblemPanel";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { createIdleAvatarPlayback } from "@/lib/avatar/avatar-playback";
import {
  releaseTavusAvatarSession,
  startTavusAvatarSession
} from "@/lib/avatar/tavus-client";
import { codingProblem } from "@/lib/coding-problem";
import { createInterviewResult, saveInterviewResult } from "@/lib/scoring/interview-result-store";
import { emptySpeakingMetrics, emptyWebcamMetrics } from "@/lib/webcam/candidate-webcam";
import type { SpeechPlaybackStatus } from "@/lib/speech/interviewer-speech";
import type { AvatarPlaybackSnapshot, InterviewerAvatarState, TavusAvatarSession } from "@/types/avatar";
import type { SpeakingMetrics, WebcamAnalysisMetrics } from "@/types/candidate-analysis";
import type { CodeRunResponse } from "@/types/code-execution";
import type { InterviewMessage, InterviewerResponse } from "@/types/interviewer";

const initialMessages: InterviewMessage[] = [
  {
    id: "initial-interviewer",
    role: "interviewer",
    timestamp: "00:05",
    text: "When you are ready, walk me through your understanding of the problem."
  },
  {
    id: "initial-candidate",
    role: "candidate",
    timestamp: "00:18",
    text: "I would confirm the input size, the existence of one valid answer, and whether indices should be sorted."
  },
  {
    id: "initial-system",
    role: "system",
    timestamp: "Live",
    text: "Voice input is available when the browser grants microphone and speech recognition access."
  }
];

const idleTavusSession: TavusAvatarSession = {
  conversationId: null,
  conversationUrl: null,
  echoModeEnabled: false,
  isTestMode: false,
  provider: "local",
  reason: null,
  status: "idle"
};

type InterviewWorkspaceProps = {
  sessionId: string;
};

export function InterviewWorkspace({ sessionId }: InterviewWorkspaceProps) {
  const router = useRouter();
  const [currentCode, setCurrentCode] = useState("");
  const [language, setLanguage] = useState("Python");
  const [latestRun, setLatestRun] = useState<CodeRunResponse | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>(initialMessages);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isInterviewerThinking, setIsInterviewerThinking] = useState(false);
  const [interviewerError, setInterviewerError] = useState<string | null>(null);
  const [isCandidateListening, setIsCandidateListening] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<SpeechPlaybackStatus>("idle");
  const [speakingMetrics, setSpeakingMetrics] = useState<SpeakingMetrics>(emptySpeakingMetrics);
  const [webcamMetrics, setWebcamMetrics] = useState<WebcamAnalysisMetrics>(emptyWebcamMetrics);
  const [latestAvatarEchoMessage, setLatestAvatarEchoMessage] = useState<InterviewMessage | null>(null);
  const [avatarPlayback, setAvatarPlayback] = useState<AvatarPlaybackSnapshot>(() =>
    createIdleAvatarPlayback()
  );
  const [tavusSession, setTavusSession] = useState<TavusAvatarSession>(idleTavusSession);

  const tavusContext = useMemo(
    () =>
      [
        "Umao is running a live technical interview workspace.",
        `Coding problem: ${codingProblem.title}.`,
        codingProblem.prompt,
        "Behave like a professional technical interviewer. Ask concise follow-up questions about approach, edge cases, runtime, and space complexity.",
        "Do not reveal the full solution. Do not analyze webcam input."
      ].join(" "),
    []
  );

  useEffect(() => {
    let didCancel = false;

    setTavusSession({
      ...idleTavusSession,
      status: "loading"
    });

    startTavusAvatarSession({
      conversationalContext: tavusContext,
      customGreeting:
        "Hi, I am your Umao interviewer. Start by explaining how you understand the problem."
    }).then((session) => {
      if (didCancel) {
        return;
      }

      setTavusSession(session);
    });

    return () => {
      didCancel = true;
      releaseTavusAvatarSession();
    };
  }, [tavusContext]);

  const avatarState = getAvatarState({
    avatarPlayback,
    isCandidateListening,
    isInterviewerThinking,
    speechStatus
  });

  async function sendCandidateMessage(text: string, options: { isHintRequest?: boolean } = {}) {
    if (options.isHintRequest) {
      setHintsUsed((current) => current + 1);
    }

    const candidateMessage: InterviewMessage = {
      id: crypto.randomUUID(),
      role: "candidate",
      text,
      timestamp: "Now"
    };
    const nextMessages = [...messages, candidateMessage];

    setMessages(nextMessages);
    setIsInterviewerThinking(true);
    setInterviewerError(null);

    try {
      const response = await fetch("/api/interviewer/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          problem: {
            title: codingProblem.title,
            prompt: codingProblem.prompt,
            constraints: codingProblem.constraints,
            examples: codingProblem.examples
          },
          currentCode,
          language,
          latestRun,
          messages: nextMessages,
          candidateMessage: text
        })
      });
      const payload = (await response.json()) as InterviewerResponse | { error?: string };

      if (!response.ok) {
        setInterviewerError(getResponseError(payload) ?? "The interviewer could not respond.");
        return;
      }

      const interviewerMessage = (payload as InterviewerResponse).message;
      setMessages((current) => [...current, interviewerMessage]);
      setLatestAvatarEchoMessage(interviewerMessage);
    } catch {
      setInterviewerError("Could not reach the interviewer service.");
    } finally {
      setIsInterviewerThinking(false);
    }
  }

  async function submitInterview() {
    const result = createInterviewResult(sessionId, {
      code: currentCode,
      hintsUsed,
      language,
      latestRun,
      messages,
      speakingMetrics,
      webcamMetrics
    });

    saveInterviewResult(result);

    try {
      const response = await fetch("/api/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(result)
      });
      const payload = (await response.json()) as { result?: { id: string } };

      if (response.ok && payload.result?.id) {
        router.push(`/results/${payload.result.id}`);
        return;
      }
    } catch {
      // Temporary browser result still lets users review the interview when offline or logged out.
    }

    router.push(`/results/${sessionId}`);
  }

  return (
    <div className="technical-interview-layout">
      <ProblemPanel problem={codingProblem} />
      <CodeEditorPanel
        onCodeChange={setCurrentCode}
        onLanguageChange={setLanguage}
        onRunResult={setLatestRun}
        onSubmitInterview={submitInterview}
      />
      <aside className="interview-support-rail">
        <InterviewerPanel
          avatarPlayback={avatarPlayback}
          avatarState={avatarState}
          latestInterviewerMessage={latestAvatarEchoMessage}
          onAvatarPlaybackChange={setAvatarPlayback}
          onWebcamMetricsChange={setWebcamMetrics}
          speakingMetrics={speakingMetrics}
          tavusSession={tavusSession}
        />
        <TranscriptPanel
          avatarProvider={tavusSession.status === "active" ? "tavus" : "local"}
          error={interviewerError}
          isThinking={isInterviewerThinking}
          messages={messages}
          onAvatarPlaybackChange={setAvatarPlayback}
          onSpeechStatusChange={setSpeechStatus}
          onSendMessage={sendCandidateMessage}
          onSpeakingMetricsChange={setSpeakingMetrics}
          onVoiceListeningChange={setIsCandidateListening}
        />
      </aside>
    </div>
  );
}

function getResponseError(payload: InterviewerResponse | { error?: string }) {
  return "error" in payload ? payload.error : undefined;
}

function getAvatarState({
  avatarPlayback,
  isCandidateListening,
  isInterviewerThinking,
  speechStatus
}: {
  avatarPlayback: AvatarPlaybackSnapshot;
  isCandidateListening: boolean;
  isInterviewerThinking: boolean;
  speechStatus: SpeechPlaybackStatus;
}): InterviewerAvatarState {
  if (
    avatarPlayback.status === "loading" ||
    avatarPlayback.status === "playing" ||
    speechStatus === "loading" ||
    speechStatus === "speaking"
  ) {
    return "speaking";
  }

  if (isInterviewerThinking) {
    return "thinking";
  }

  if (isCandidateListening) {
    return "listening";
  }

  return "idle";
}
