import { NextResponse } from "next/server";
import { signUpUser } from "@/lib/auth/auth-service";
import { guardRequest, isRecord, readJson, requestError } from "@/lib/security/request-guard";

export async function POST(request: Request) {
  const guard = await guardRequest(request, "signup", 5, false);
  if (guard.error) return guard.error;
  let body;
  try { body = await readJson(request, 4096); } catch (error) { return requestError(error); }
  if (!isRecord(body) || typeof body.email !== "string" || body.email.length > 254 || typeof body.name !== "string" || body.name.length > 80 || typeof body.password !== "string" || body.password.length > 128) {
    return NextResponse.json({ error: "Invalid signup details." }, { status: 400 });
  }
  const result = await signUpUser({
    email: body.email ?? "",
    name: body.name ?? "",
    password: body.password ?? ""
  }).catch(() => null);

  if (!result) {
    return NextResponse.json({ error: "Account storage is unavailable. Please try again later; your account has not been created." }, { status: 503 });
  }

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
