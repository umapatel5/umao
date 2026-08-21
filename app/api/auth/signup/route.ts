import { NextResponse } from "next/server";
import { signUpUser } from "@/lib/auth/auth-service";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; name?: string; password?: string };
  const result = await signUpUser({
    email: body.email ?? "",
    name: body.name ?? "",
    password: body.password ?? ""
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const response = NextResponse.json({ user: result.user });
  response.cookies.set("umao_session", result.session.id, {
    httpOnly: true,
    maxAge: Math.max(0, Math.floor((new Date(result.session.expiresAt).getTime() - Date.now()) / 1000)),
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  return response;
}
