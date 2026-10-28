import { z } from "zod";
import type { Dictionary } from "@/i18n/dictionaries";

// Public-facing schemas use keys of Dictionary["errors"] as messages; fieldErrors() translates
// them. Admin-only schemas keep literal Ukrainian text, which passes through unchanged.

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "emailTooLong")
  .pipe(z.email("invalidEmail"));

export const passwordSchema = z
  .string()
  .min(10, "passwordMin")
  .max(128, "passwordMax");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "nameShort").max(60, "nameLong"),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "passwordRequired").max(128),
});

// Admin content. Images are restricted to files already in /public/images, so the
// panel can never point the site at an external host.
const imagePath = z
  .string()
  .trim()
  .regex(/^\/images\/[a-z0-9-]+\.(jpg|jpeg|png|webp|avif)$/, "Шлях має бути виду /images/name.jpg");
const focus = z
  .string()
  .trim()
  .regex(/^\d{1,3}% \d{1,3}%$/, "Формат: 50% 30%");
const slug = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]{2,60}$/, "Лише латиниця, цифри та дефіс");
const text = (max: number) => z.string().trim().min(1, "Обов'язкове поле").max(max);
const sortOrder = z.coerce.number().int().min(0).max(999);
// English translations are optional: empty means "show the Ukrainian text".
const optional = (max: number) => z.string().trim().max(max).default("");
const lines = (maxItems: number) =>
  z
    .string()
    .default("")
    .transform((s) => s.split("\n").map((l) => l.trim()).filter(Boolean))
    .pipe(z.array(z.string().max(120)).max(maxItems));
const published = z.preprocess((v) => v === "on" || v === "true", z.boolean());

export const characterSchema = z.object({
  slug,
  name: text(80),
  title: text(120),
  bio: text(1200),
  quote: text(400),
  nameEn: optional(80),
  titleEn: optional(120),
  bioEn: optional(1200),
  quoteEn: optional(400),
  image: imagePath,
  focus,
  sortOrder,
  published,
});

export const editionSchema = z.object({
  slug,
  name: text(80),
  tagline: text(200),
  priceCents: z.coerce.number().int().min(50).max(1_000_000),
  features: z
    .string()
    .transform((s) => s.split("\n").map((l) => l.trim()).filter(Boolean))
    .pipe(z.array(z.string().max(120)).min(1).max(12)),
  nameEn: optional(80),
  taglineEn: optional(200),
  featuresEn: lines(12),
  image: imagePath,
  focus,
  sortOrder,
  active: published,
});

export const locationSchema = z.object({
  slug,
  name: text(80),
  kind: text(60),
  description: text(800),
  nameEn: optional(80),
  kindEn: optional(60),
  descriptionEn: optional(800),
  image: imagePath,
  focus,
  sortOrder,
  published,
});

export const trailerSchema = z.object({
  title: text(120),
  description: text(400),
  titleEn: optional(120),
  descriptionEn: optional(400),
  image: imagePath,
  youtubeId: z
    .string()
    .trim()
    .transform((s) => s || null)
    .pipe(z.string().regex(/^[A-Za-z0-9_-]{11}$/, "11 символів з адреси YouTube").nullable()),
  sortOrder,
  published,
});

export const idSchema = z.string().regex(/^c[a-z0-9]{20,32}$/);

/** Only same-site relative paths; blocks `//evil.com` and `/\evil.com` open redirects. */
export function safeNext(value: unknown, fallback = "/") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

export function fieldErrors(error: z.ZodError, t?: Dictionary) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    const msg = issue.message as keyof Dictionary["errors"];
    out[key] ??= t?.errors[msg] ?? issue.message;
  }
  return out;
}

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Echo of submitted fields (never passwords): React resets forms after an action. */
  values?: Record<string, string>;
};

/** String fields from a FormData, minus anything secret. */
export function echo(formData: FormData, ...keys: string[]) {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === "string") out[key] = value.slice(0, 4000);
  }
  return out;
}
