import { NextResponse } from "next/server";
import { startTavusAvatarSession, endTavusAvatarSession } from "@/lib/avatar/tavus-server";
import { rememberAvatarSession } from "@/lib/avatar/session-repository";
import { guardRequest, readJson, requestError } from "@/lib/security/request-guard";

export const runtime = "nodejs";

type StartAvatarRequest = {
  conversationalContext?: string;
  customGreeting?: string;
};

export async function POST(request: Request) {
  const guard = await guardRequest(request, "avatar-start", 6);
  if (guard.error) return guard.error;
  let body;
  try { body = await readJson(request, 12_000) as StartAvatarRequest | null; } catch (error) { return requestError(error); }
  if (!body || [body.conversationalContext, body.customGreeting].some((item) => item !== undefined && (typeof item !== "string" || item.length > 8000))) return NextResponse.json({ error: "Invalid avatar request." }, { status: 400 });

  try {
    const session = await startTavusAvatarSession({
      conversationalContext:
        body?.conversationalContext ??
        "Umao is running a technical coding interview. Keep responses concise, professional, and focused on the candidate's approach.",
      customGreeting:
        body?.customGreeting ??
        "Hey, I'm Daniel, your interviewer. Nice to meet you! Could you tell me a little about yourself and what you've been working on recently?"
    });

    if (session.conversationId) {
      try { await rememberAvatarSession(guard.user!.id, session.conversationId); }
      catch (error) {
        await endTavusAvatarSession(session.conversationId).catch(() => undefined);
        return requestError(error);
      }
    }
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json(
      {
        conversationId: null,
        conversationUrl: null,
        echoModeEnabled: false,
        isTestMode: false,
        provider: "local",
        reason: error instanceof Error ? error.message : "Tavus avatar session failed.",
        status: "error"
      },
      { status: 502 }
    );
  }
}
