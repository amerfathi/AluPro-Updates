"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { type Locale } from "@/lib/i18n/config";
import { useLocale } from "@/components/layout/locale-provider";

import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { locale, t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const targetLocale: Locale = locale === "ar" ? "en" : "ar";
  const switchLabel = targetLocale === "ar" ? t("common.switchToArabic") : t("common.switchToEnglish");

  const onSwitch = () => {
    startTransition(async () => {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: targetLocale }),
      });
      router.refresh();
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={onSwitch} disabled={isPending}>
      <Languages className="me-2 h-4 w-4" />
      {switchLabel}
    </Button>
  );
}


