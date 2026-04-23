"use client";

import { createContext, useContext, useMemo } from "react";

import { localeMeta, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type LocaleContextValue = {
  locale: Locale;
  dictionary: Dictionary;
  dir: "rtl" | "ltr";
  t: (path: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function pickValue(dictionary: Dictionary, path: string): string {
  const keys = path.split(".");
  let current: unknown = dictionary;

  for (const key of keys) {
    if (!current || typeof current !== "object" || !(key in (current as Record<string, unknown>))) {
      return path;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === "string" ? current : path;
}

export function LocaleProvider({
  children,
  locale,
  dictionary,
}: {
  children: React.ReactNode;
  locale: Locale;
  dictionary: Dictionary;
}) {
  const value = useMemo<LocaleContextValue>(() => {
    return {
      locale,
      dictionary,
      dir: localeMeta[locale].dir,
      t: (path: string) => pickValue(dictionary, path),
    };
  }, [locale, dictionary]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
}


