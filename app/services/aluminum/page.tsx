import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Button } from "@/components/ui/button";
import { getCurrentLocale } from "@/lib/i18n/locale";

export default async function AluminumServicePage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  return (
    <PageShell className="py-12">
      <SectionHeading
        eyebrow={isAr ? "الألمنيوم" : "Aluminum"}
        title={isAr ? "أنظمة ألمنيوم عالية الجودة" : "Premium Aluminum Systems"}
        description={
          isAr
            ? "حلول نوافذ وأبواب وواجهات ألمنيوم بأداء حراري وصوتي متقدم."
            : "High-performance aluminum windows, doors, and facades with thermal and acoustic optimization."
        }
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-6">
          <h3 className="text-lg font-semibold">{isAr ? "الاستخدامات" : "Use Cases"}</h3>
          <ul className="mt-3 list-disc space-y-2 ps-5 text-sm text-[var(--text-secondary)]">
            <li>{isAr ? "فلل سكنية فاخرة ومجمعات راقية" : "Luxury villas and premium residential compounds"}</li>
            <li>{isAr ? "أبراج ومشاريع تجارية متعددة الاستخدام" : "Commercial office towers and mixed-use projects"}</li>
            <li>{isAr ? "مشاريع ضيافة تتطلب دقة عالية في الواجهات" : "Hospitality projects requiring tight facade tolerances"}</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-6">
          <h3 className="text-lg font-semibold">{isAr ? "المواصفات الشائعة" : "Typical Specs"}</h3>
          <ul className="mt-3 list-disc space-y-2 ps-5 text-sm text-[var(--text-secondary)]">
            <li>{isAr ? "أنظمة مقاطع بكسر حراري" : "Thermal break profile systems"}</li>
            <li>{isAr ? "خيارات زجاج من 24 إلى 42 مم" : "24-42mm glazing options"}</li>
            <li>{isAr ? "تشطيبات بودرة حرارية أو أنودة" : "Powder-coated or anodized finishes"}</li>
          </ul>
        </article>
      </div>
      <Link href="/quote-request" className="mt-6 inline-block">
        <Button>{isAr ? "اطلب عرض سعر" : "Request a Quote"}</Button>
      </Link>
    </PageShell>
  );
}
