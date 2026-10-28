"use client";

import { createContext, use, type ReactNode } from "react";
import type { Locale } from "./config";
import { dictionaries, type Dictionary } from "./dictionaries";

const I18nContext = createContext<{ locale: Locale; t: Dictionary } | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <I18nContext value={{ locale, t: dictionaries[locale] }}>{children}</I18nContext>;
}

export function useI18n() {
  const value = use(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}
