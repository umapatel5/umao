import { NextResponse } from "next/server";
import { startTavusAvatarSession } from "@/lib/avatar/tavus-server";

export const runtime = "nodejs";

type StartAvatarRequest = {
  conversationalContext?: string;
  customGreeting?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as StartAvatarRequest | null;

  try {
    const session = await startTavusAvatarSession({
      conversationalContext:
        body?.conversationalContext ??
        "Umao is running a technical coding interview. Keep responses concise, professional, and focused on the candidate's approach.",
      customGreeting:
        body?.customGreeting ??
        "Hi, I am your Umao interviewer. When you are ready, walk me through your approach."
    });

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
