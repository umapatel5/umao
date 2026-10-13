import { NextResponse } from "next/server";
import { endTavusAvatarSession } from "@/lib/avatar/tavus-server";
import { ownsAvatarSession } from "@/lib/avatar/session-repository";
import { guardRequest, readJson, requestError } from "@/lib/security/request-guard";

export const runtime = "nodejs";

type EndAvatarRequest = {
  conversationId?: string;
};

export async function POST(request: Request) {
  const guard = await guardRequest(request, "avatar-end", 30);
  if (guard.error) return guard.error;
  let body;
  try { body = await readJson(request, 4096) as EndAvatarRequest | null; } catch (error) { return requestError(error); }

  if (typeof body?.conversationId !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(body.conversationId)) {
    return NextResponse.json({ error: "Expected Tavus conversationId." }, { status: 400 });
  }

  try {
    if (!await ownsAvatarSession(guard.user!.id, body.conversationId)) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    await endTavusAvatarSession(body.conversationId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not end Tavus avatar session." },
      { status: 502 }
    );
  }
}
