import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { dictionaries } from "./dictionaries";

/** Cookie choice first; otherwise the browser's Accept-Language; otherwise Ukrainian. */
export const getLocale = cache(async (): Promise<Locale> => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;

  const accept = (await headers()).get("accept-language") ?? "";
  for (const part of accept.split(",")) {
    const tag = part.split(";")[0].trim().toLowerCase();
    if (tag.startsWith("uk") || tag.startsWith("ru")) return "uk";
    if (tag.startsWith("en")) return "en";
  }
  return DEFAULT_LOCALE;
});

export async function getDictionary() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
