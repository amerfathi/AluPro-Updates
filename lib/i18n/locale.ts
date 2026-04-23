import { cookies } from "next/headers";

import { defaultLocale, isLocale, localeCookieName, type Locale } from "./config";

export async function getCurrentLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;

  if (cookieLocale && isLocale(cookieLocale)) {
    return cookieLocale;
  }

  // Always default to Arabic unless user explicitly chooses another locale.
  return defaultLocale;
}


