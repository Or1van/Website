import { INTL_LOCALE, type Locale } from "@/i18n/config";

export function formatPrice(cents: number, currency = "usd", locale: Locale = "uk") {
  return new Intl.NumberFormat(INTL_LOCALE[locale], { style: "currency", currency: currency.toUpperCase() }).format(
    cents / 100,
  );
}

export function formatDate(date: Date, locale: Locale = "uk") {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { dateStyle: "medium", timeStyle: "short" }).format(date);
}
