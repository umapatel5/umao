import type { TavusAvatarSession } from "@/types/avatar";

const tavusApiBaseUrl = "https://tavusapi.com/v2";

type TavusConversationResponse = {
  conversation_id?: string;
  conversation_url?: string;
  meeting_token?: string;
  status?: "active" | "ended" | string;
};

type StartTavusSessionInput = {
  conversationalContext: string;
  customGreeting: string;
};

export async function startTavusAvatarSession({
  conversationalContext,
  customGreeting
}: StartTavusSessionInput): Promise<TavusAvatarSession> {
  const apiKey = process.env.TAVUS_API_KEY;
  const personaId = process.env.TAVUS_ECHO_PERSONA_ID ?? process.env.TAVUS_PERSONA_ID;
  const replicaId = process.env.TAVUS_REPLICA_ID;
  const isTestMode = process.env.TAVUS_TEST_MODE !== "false";

  if (!apiKey || (!personaId && !replicaId)) {
    return createFallbackSession(
      "Tavus is not configured. Add TAVUS_API_KEY plus TAVUS_PERSONA_ID or TAVUS_REPLICA_ID."
    );
  }

  const requestBody = {
    ...(personaId ? { persona_id: personaId } : {}),
    ...(replicaId ? { replica_id: replicaId } : {}),
    conversation_name: "Umao technical interview",
    conversational_context: conversationalContext,
    custom_greeting: customGreeting,
    max_participants: 3,
    properties: {
      language: "english"
    },
    test_mode: isTestMode
  };

  const response = await fetch(`${tavusApiBaseUrl}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey
    },
    body: JSON.stringify(requestBody)
  });

  const payload = (await response.json().catch(() => null)) as TavusConversationResponse | { message?: string } | null;

  if (!response.ok) {
    throw new Error(getTavusErrorMessage(payload) ?? "Tavus could not start an avatar session.");
  }

  const conversation = payload as TavusConversationResponse;

  if (conversation.status === "ended" || !conversation.conversation_url || !conversation.conversation_id) {
    return createFallbackSession(
      isTestMode
        ? "Tavus test mode validated session creation and returned an ended room, so Umao is using the local avatar fallback."
        : "Tavus did not return an active room, so Umao is using the local avatar fallback.",
      isTestMode
    );
  }

  return {
    conversationId: conversation.conversation_id,
    conversationUrl: getJoinUrl(conversation.conversation_url, conversation.meeting_token),
    echoModeEnabled: Boolean(process.env.TAVUS_ECHO_PERSONA_ID),
    isTestMode,
    provider: "tavus",
    reason: null,
    status: "active"
  };
}

export async function endTavusAvatarSession(conversationId: string) {
  const apiKey = process.env.TAVUS_API_KEY;

  if (!apiKey) {
    return;
  }

  const response = await fetch(`${tavusApiBaseUrl}/conversations/${conversationId}/end`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey
    }
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(getTavusErrorMessage(payload) ?? "Tavus could not end the avatar session.");
  }
}

function createFallbackSession(reason: string, isTestMode = false): TavusAvatarSession {
  return {
    conversationId: null,
    conversationUrl: null,
    echoModeEnabled: false,
    isTestMode,
    provider: "local",
    reason,
    status: "fallback"
  };
}

function getJoinUrl(conversationUrl: string, meetingToken?: string) {
  if (!meetingToken) {
    return conversationUrl;
  }

  const url = new URL(conversationUrl);
  url.searchParams.set("t", meetingToken);
  return url.toString();
}

function getTavusErrorMessage(payload: unknown) {
  return isRecord(payload) && typeof payload.message === "string"
    ? payload.message
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
