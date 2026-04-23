import ar from "@/messages/ar.json";
import en from "@/messages/en.json";

import { defaultLocale, type Locale } from "./config";

const dictionaries = {
  ar,
  en,
};

export type Dictionary = typeof ar;

export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}


