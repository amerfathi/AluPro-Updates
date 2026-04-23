"use client";

import Link from "next/link";

import { useLocale } from "@/components/layout/locale-provider";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { SiteNavLinks } from "@/components/layout/site-nav-links";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-soft)] bg-[rgba(9,14,24,0.86)] backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">{t("common.brand")}</span>
          <span className="text-xs text-[var(--text-muted)]">{t("common.subtitle")}</span>
        </Link>
        <SiteNavLinks />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link href="/login">
            <Button size="sm">{t("nav.login")}</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}


