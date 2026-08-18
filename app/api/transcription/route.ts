import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      message: "Voice transcription placeholder. Wire this route to a transcription provider later."
    },
    { status: 501 }
  );
}
