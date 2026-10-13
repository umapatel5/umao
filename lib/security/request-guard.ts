import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-service";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import type { AuthUser } from "@/types/account";

export class RequestError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function rejectCrossOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return request.headers.get("sec-fetch-site") === "cross-site" || (origin !== null && origin !== new URL(request.url).origin);
}

export function clientAddress(request: Request) {
  // Only Vercel's overwritten proxy headers are trusted. Local callers cannot choose their quota key.
  return process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() || "unknown" : "local";
}

type GuardResult = { error: NextResponse; user?: never } | { error?: never; user: AuthUser | null };
export async function guardRequest(request: Request, scope: string, limit: number, authenticated = true, windowMs = 600_000): Promise<GuardResult> {
  if (rejectCrossOrigin(request)) return { error: NextResponse.json({ error: "Cross-site request rejected." }, { status: 403 }) };
  try {
    const ipLimit = await consumeRateLimit(`${scope}:ip`, clientAddress(request), limit * (authenticated ? 5 : 1), windowMs);
    if (!ipLimit.allowed) return { error: limited(ipLimit.retryAfter) };
    const user = authenticated ? await getCurrentUser() : null;
    if (authenticated && !user) return { error: NextResponse.json({ error: "Sign in to continue." }, { status: 401 }) };
    if (user) {
      const decision = await consumeRateLimit(`${scope}:user`, user.id, limit, windowMs);
      if (!decision.allowed) return { error: limited(decision.retryAfter) };
    }
    return { user };
  } catch {
    return { error: NextResponse.json({ error: "This service is temporarily unavailable. Try again later." }, { status: 503 }) };
  }
}

function limited(retryAfter: number) {
  return NextResponse.json({ error: "Too many requests. Please wait before trying again." }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
}

export async function readJson(request: Request, maxBytes = 100_000): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new RequestError("Expected application/json.", 415);
  if (Number(request.headers.get("content-length")) > maxBytes) throw new RequestError("Request is too large.", 413);
  if (!request.body) throw new RequestError("Expected JSON body.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) { await reader.cancel(); throw new RequestError("Request is too large.", 413); }
      chunks.push(value);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
    catch { throw new RequestError("Invalid JSON."); }
  } finally { reader.releaseLock(); }
}

export function requestError(error: unknown) {
  return NextResponse.json({ error: error instanceof RequestError ? error.message : "Service unavailable. Try again later." }, { status: error instanceof RequestError ? error.status : 503 });
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
