import "server-only";
import { headers } from "next/headers";
import { fmt, type Dictionary } from "@/i18n/dictionaries";
import { db } from "./db";

type Result = { ok: boolean; retryAfterSec: number };

/**
 * Fixed-window counter stored in Postgres, so limits hold across server instances.
 * The upsert is a single statement, which keeps concurrent requests from racing.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<Result> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN EXCLUDED."resetAt" ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt"`;
  const row = rows[0];
  return {
    ok: row.count <= limit,
    retryAfterSec: Math.max(1, Math.ceil((new Date(row.resetAt).getTime() - now.getTime()) / 1000)),
  };
}

/**
 * Client address for rate-limit keys. X-Forwarded-For is client-controlled unless a proxy
 * you run (Vercel, nginx…) overwrites it, so it is only read when TRUST_PROXY=true.
 * Without it every client shares one bucket, and the per-email login limit still applies.
 */
export async function clientIp() {
  const h = await headers();
  if (process.env.TRUST_PROXY === "true") {
    const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwarded) return forwarded;
    const real = h.get("x-real-ip")?.trim();
    if (real) return real;
  }
  return "local";
}

export function retryMessage(seconds: number, t: Dictionary) {
  const minutes = Math.ceil(seconds / 60);
  return minutes > 1 ? fmt(t.errors.tooManyMinutes, { n: minutes }) : t.errors.tooManyMinute;
}
