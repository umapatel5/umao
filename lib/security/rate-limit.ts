import { createHash } from "crypto";

export type RateLimitDecision = { allowed: boolean; retryAfter: number };
type Bucket = { count: number; expiresAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export function rateLimitKey(scope: string, subject: string) {
  return createHash("sha256").update(`${scope}:${subject}`).digest("hex");
}

export function consumeMemoryLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitDecision {
  buckets.forEach((entry, id) => { if (entry.expiresAt <= now) buckets.delete(id); });
  const existing = buckets.get(key);
  if (!existing && buckets.size >= MAX_BUCKETS) return { allowed: false, retryAfter: Math.ceil(windowMs / 1000) };
  const entry = existing ?? { count: 0, expiresAt: now + windowMs };
  entry.count++;
  buckets.set(key, entry);
  return { allowed: entry.count <= limit, retryAfter: Math.max(1, Math.ceil((entry.expiresAt - now) / 1000)) };
}

export async function consumeRateLimit(scope: string, subject: string, limit: number, windowMs: number) {
  const key = rateLimitKey(scope, subject);
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    const { consumePersistentLimit } = await import("../db/postgres-db");
    return consumePersistentLimit(key, limit, windowMs);
  }
  // A process-local limit is useful for development, but cannot protect distributed deployments.
  if (process.env.VERCEL) throw new Error("Persistent rate-limit storage is required.");
  return consumeMemoryLimit(key, limit, windowMs);
}
