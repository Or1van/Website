import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "./db";

export const SESSION_COOKIE = "hm_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
};

// Only the hash is stored, so a database leak does not hand out working cookies.
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Call only from Server Actions or Route Handlers (it sets a cookie). */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({ data: { id: hashToken(token), userId, expiresAt } });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Reads and validates the session cookie. Memoised per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !TOKEN_PATTERN.test(token)) return null;

  const session = await db.session.findUnique({
    where: { id: hashToken(token) },
    select: {
      id: true,
      expiresAt: true,
      user: { select: { id: true, email: true, name: true, role: true } },
    },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session.user;
});

/** Call only from Server Actions or Route Handlers (it clears a cookie). */
export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token && TOKEN_PATTERN.test(token)) {
    await db.session.deleteMany({ where: { id: hashToken(token) } });
  }
  jar.delete(SESSION_COOKIE);
}
