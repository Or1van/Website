"use server";

import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n/server";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { clientIp, rateLimit, retryMessage } from "@/lib/rate-limit";
import { createSession, destroySession } from "@/lib/session";
import { echo, fieldErrors, loginSchema, registerSchema, safeNext, type FormState } from "@/lib/validation";

const MINUTE = 60_000;

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = echo(formData, "name", "email");
  const { t } = await getDictionary();
  const ip = await clientIp();
  const limit = await rateLimit(`register:ip:${ip}`, 5, 60 * MINUTE);
  if (!limit.ok) return { message: retryMessage(limit.retryAfterSec, t), values };

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error, t), values };

  const { name, email, password } = parsed.data;
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { errors: { email: t.errors.emailTaken }, values };
  }

  const user = await db.user.create({
    data: { name, email, passwordHash: await hashPassword(password) },
    select: { id: true },
  });
  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = echo(formData, "email");
  const { t } = await getDictionary();
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error, t), values };
  const { email, password } = parsed.data;

  // Per-IP limit slows spraying across accounts; per-email limit slows guessing one account
  // even from many addresses.
  const ip = await clientIp();
  const [byIp, byEmail] = await Promise.all([
    rateLimit(`login:ip:${ip}`, 30, 15 * MINUTE),
    rateLimit(`login:email:${email}`, 8, 15 * MINUTE),
  ]);
  if (!byIp.ok || !byEmail.ok) {
    return { message: retryMessage(Math.max(byIp.retryAfterSec, byEmail.retryAfterSec), t), values };
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });
  const valid = await verifyPassword(user?.passwordHash ?? null, password);
  if (!user || !valid) return { message: t.errors.badLogin, values };

  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
