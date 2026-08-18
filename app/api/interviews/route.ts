import { NextResponse } from "next/server";
import { sessions } from "@/lib/interview-data";

export async function GET() {
  return NextResponse.json({
    message: "Interview API placeholder. Replace mock data when backend persistence is added.",
    sessions
  });
}
