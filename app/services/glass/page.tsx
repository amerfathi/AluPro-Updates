import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Button } from "@/components/ui/button";
import { getCurrentLocale } from "@/lib/i18n/locale";

export default async function GlassServicePage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  return (
    <PageShell className="py-12">
      <SectionHeading
        eyebrow={isAr ? "الزجاج" : "Glass"}
        title={isAr ? "حلول الزجاج والواجهات" : "Glass and Glazing Solutions"}
        description={
          isAr
            ? "أنظمة زجاج أمان وعزل حراري وصوتي متكاملة مع أنظمة الألمنيوم والحديد."
            : "Safety, thermal, and acoustic glass systems integrated with aluminum and steel structures."
        }
      />
      <div className="mt-8 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-6">
        <h3 className="text-lg font-semibold">{isAr ? "القدرات" : "Capabilities"}</h3>
        <ul className="mt-3 list-disc space-y-2 ps-5 text-sm text-[var(--text-secondary)]">
          <li>{isAr ? "حلول زجاج مزدوج ومصفح" : "Insulated and laminated glazing packages"}</li>
          <li>{isAr ? "تنسيق وتنفيذ الواجهات الزجاجية الهيكلية" : "Structural glazing coordination"}</li>
          <li>{isAr ? "زجاج متخصص لمقاومة الصدمات والتحكم الشمسي" : "Specialized glass for impact and solar control"}</li>
        </ul>
      </div>
      <Link href="/quote-request" className="mt-6 inline-block">
        <Button>{isAr ? "اطلب عرضًا فنيًا" : "Request Technical Proposal"}</Button>
      </Link>
    </PageShell>
  );
}
