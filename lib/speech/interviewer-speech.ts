export type SpeechPlaybackStatus = "idle" | "loading" | "speaking" | "error";

type SpeakCallbacks = {
  onEnd: () => void;
  onError: (message: string) => void;
  onStart: () => void;
};

export type SpeechPlaybackHandle = {
  cancel: () => void;
};

export function speakInterviewerText(
  text: string,
  callbacks: SpeakCallbacks
): SpeechPlaybackHandle {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    throw new Error("Speech playback is not supported in this browser.");
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.pitch = 1;
  utterance.rate = 0.96;
  utterance.volume = 1;

  const voice = window.speechSynthesis
    .getVoices()
    .find((candidate) => candidate.lang.startsWith("en") && /female|samantha|victoria/i.test(candidate.name));

  if (voice) {
    utterance.voice = voice;
  }

  utterance.onstart = callbacks.onStart;
  utterance.onend = callbacks.onEnd;
  utterance.onerror = () => callbacks.onError("Interviewer speech playback failed.");

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);

  return {
    cancel: () => window.speechSynthesis.cancel()
  };
}

export function stopInterviewerSpeech() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
