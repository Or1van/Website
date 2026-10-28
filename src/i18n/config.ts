export const LOCALES = ["uk", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "uk";
export const LOCALE_COOKIE = "hm_lang";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** BCP 47 tags for Intl formatting and <html lang>. */
export const INTL_LOCALE: Record<Locale, string> = { uk: "uk-UA", en: "en-US" };
