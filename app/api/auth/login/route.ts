import { NextResponse } from "next/server";
import { loginUser } from "@/lib/auth/auth-service";
import { guardRequest, isRecord, readJson, requestError } from "@/lib/security/request-guard";

export async function POST(request: Request) {
  const guard = await guardRequest(request, "login", 10, false);
  if (guard.error) return guard.error;
  let body;
  try { body = await readJson(request, 128_000); } catch (error) { return requestError(error); }
  if (!isRecord(body) || typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "Invalid login details." }, { status: 400 });
  }
  const result = await loginUser({
    email: body.email ?? "",
    password: body.password ?? ""
  }).catch(() => null);

  if (!result) {
    return NextResponse.json({ error: "Account storage is unavailable. Please try again later." }, { status: 503 });
  }

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 401 });
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
