import type { Locale } from "@/lib/i18n/config";

export function pickByLocale<T>(locale: Locale, arabic: T, english: T): T {
  return locale === "ar" ? arabic : english;
}
