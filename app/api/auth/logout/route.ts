import { NextResponse } from "next/server";
import { logoutUser } from "@/lib/auth/auth-service";

export async function POST() {
  await logoutUser();
  const response = NextResponse.json({ ok: true });

  response.cookies.delete("umao_session");
  return response;
}
