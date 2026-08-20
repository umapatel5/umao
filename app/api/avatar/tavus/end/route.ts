import { NextResponse } from "next/server";
import { endTavusAvatarSession } from "@/lib/avatar/tavus-server";

export const runtime = "nodejs";

type EndAvatarRequest = {
  conversationId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as EndAvatarRequest | null;

  if (!body?.conversationId) {
    return NextResponse.json({ error: "Expected Tavus conversationId." }, { status: 400 });
  }

  try {
    await endTavusAvatarSession(body.conversationId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not end Tavus avatar session." },
      { status: 502 }
    );
  }
}
