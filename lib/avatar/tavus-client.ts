import type { TavusAvatarSession } from "@/types/avatar";

type StartTavusAvatarSessionInput = {
  conversationalContext: string;
  customGreeting: string;
};

let sharedSession: TavusAvatarSession | null = null;
let sharedSessionPromise: Promise<TavusAvatarSession> | null = null;
let releaseTimer: number | null = null;
let activeConsumers = 0;

export async function startTavusAvatarSession(
  input: StartTavusAvatarSessionInput
): Promise<TavusAvatarSession> {
  activeConsumers += 1;
  clearReleaseTimer();

  if (sharedSession) {
    return sharedSession;
  }

  if (sharedSessionPromise) {
    return sharedSessionPromise;
  }

  sharedSessionPromise = createTavusAvatarSession(input).then((session) => {
    sharedSession = session;
    sharedSessionPromise = null;
    return session;
  });

  return sharedSessionPromise;
}

export function releaseTavusAvatarSession() {
  activeConsumers = Math.max(activeConsumers - 1, 0);

  if (activeConsumers > 0) {
    return;
  }

  clearReleaseTimer();

  releaseTimer = window.setTimeout(() => {
    const conversationId = sharedSession?.status === "active" ? sharedSession.conversationId : null;

    sharedSession = null;
    sharedSessionPromise = null;
    releaseTimer = null;

    if (conversationId) {
      void endTavusAvatarSession(conversationId);
    }
  }, 2000);
}

async function createTavusAvatarSession(
  input: StartTavusAvatarSessionInput
): Promise<TavusAvatarSession> {
  const response = await fetch("/api/avatar/tavus/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  const payload = (await response.json()) as TavusAvatarSession;

  if (!response.ok) {
    return {
      ...payload,
      status: "error"
    };
  }

  return payload;
}

export async function endTavusAvatarSession(conversationId: string) {
  await fetch("/api/avatar/tavus/end", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ conversationId })
  });
}

function clearReleaseTimer() {
  if (releaseTimer) {
    window.clearTimeout(releaseTimer);
    releaseTimer = null;
  }
}
