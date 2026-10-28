import type { Locale } from "./config";

/**
 * Picks the English column (`fieldEn`) for each listed field when the locale is English
 * and a translation exists; otherwise keeps the Ukrainian value. Drops the *En columns.
 */
export function localize<T extends Record<string, unknown>, K extends string & keyof T>(
  row: T,
  locale: Locale,
  fields: readonly K[],
): Omit<T, `${K}En`> {
  const out: Record<string, unknown> = { ...row };
  for (const field of fields) {
    const en = row[`${field}En` as keyof T];
    const hasEn = Array.isArray(en) ? en.length > 0 : typeof en === "string" && en.trim() !== "";
    if (locale === "en" && hasEn) out[field] = en;
    delete out[`${field}En`];
  }
  return out as Omit<T, `${K}En`>;
}
