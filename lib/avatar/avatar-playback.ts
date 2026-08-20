import type { AvatarMouthCue, AvatarPlaybackSnapshot } from "@/types/avatar";

export type AvatarPlaybackInput = {
  messageId: string;
  text: string;
};

export type TavusEchoInput = AvatarPlaybackInput & {
  conversationId: string;
};

export type AvatarPlaybackSession = {
  stop: () => void;
};

type AvatarPlaybackCallbacks = {
  onError: (message: string) => void;
  onUpdate: (snapshot: AvatarPlaybackSnapshot) => void;
};

export type AvatarPlaybackProvider = {
  name: string;
  start: (
    input: AvatarPlaybackInput,
    callbacks: AvatarPlaybackCallbacks
  ) => AvatarPlaybackSession;
};

const localProviderName = "Local lip-sync preview";

export function createIdleAvatarPlayback(): AvatarPlaybackSnapshot {
  return {
    cue: null,
    error: null,
    providerName: localProviderName,
    status: "idle"
  };
}

export function createAvatarLoadingPlayback(): AvatarPlaybackSnapshot {
  return {
    cue: null,
    error: null,
    providerName: localProviderName,
    status: "loading"
  };
}

export function createTavusAvatarLoadingPlayback(): AvatarPlaybackSnapshot {
  return {
    cue: null,
    error: null,
    providerName: "Tavus conversation",
    status: "loading"
  };
}

export function createTavusAvatarPlayingPlayback(): AvatarPlaybackSnapshot {
  return {
    cue: null,
    error: null,
    providerName: "Tavus conversation",
    status: "playing"
  };
}

export function createAvatarErrorPlayback(message: string): AvatarPlaybackSnapshot {
  return {
    cue: null,
    error: message,
    providerName: localProviderName,
    status: "error"
  };
}

export function createLocalLipSyncAvatarProvider(): AvatarPlaybackProvider {
  return {
    name: localProviderName,
    start(input, callbacks) {
      const words = input.text.trim().split(/\s+/).filter(Boolean);

      if (!words.length) {
        const message = "Avatar playback needs interviewer text.";
        callbacks.onError(message);
        return { stop: () => undefined };
      }

      let cueIndex = 0;
      const cues = buildMouthCues(words);

      callbacks.onUpdate({
        cue: cues[0] ?? null,
        error: null,
        providerName: localProviderName,
        status: "playing"
      });

      const interval = window.setInterval(() => {
        cueIndex = (cueIndex + 1) % cues.length;
        callbacks.onUpdate({
          cue: cues[cueIndex],
          error: null,
          providerName: localProviderName,
          status: "playing"
        });
      }, 110);

      return {
        stop: () => window.clearInterval(interval)
      };
    }
  };
}

function buildMouthCues(words: string[]): AvatarMouthCue[] {
  return words.flatMap((word) => {
    const vowelCount = word.match(/[aeiou]/gi)?.length ?? 0;
    const intensity = clamp(0.3 + vowelCount / Math.max(word.length, 1), 0.35, 1);
    const shape = getMouthShape(word);

    return [
      { intensity: intensity * 0.68, shape },
      { intensity, shape },
      { intensity: 0.2, shape: "closed" }
    ];
  });
}

function getMouthShape(word: string): AvatarMouthCue["shape"] {
  if (/[oquw]/i.test(word)) {
    return "round";
  }

  if (/[aeh]/i.test(word)) {
    return "wide";
  }

  if (/[iy]/i.test(word)) {
    return "narrow";
  }

  return "closed";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
