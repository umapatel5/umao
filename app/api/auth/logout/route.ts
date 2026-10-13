import { NextResponse } from "next/server";
import { logoutUser } from "@/lib/auth/auth-service";
import { rejectCrossOrigin } from "@/lib/security/request-guard";

export async function POST(request: Request) {
  if (rejectCrossOrigin(request)) return NextResponse.json({ error: "Request not allowed." }, { status: 403 });
  await logoutUser();
  const response = NextResponse.json({ ok: true });

  response.cookies.delete("umao_session");
  return response;
}
