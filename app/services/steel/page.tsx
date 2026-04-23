import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Button } from "@/components/ui/button";
import { getCurrentLocale } from "@/lib/i18n/locale";

export default async function SteelServicePage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  return (
    <PageShell className="py-12">
      <SectionHeading
        eyebrow={isAr ? "الحديد" : "Steel"}
        title={isAr ? "أعمال حديد وحدادة احترافية" : "Professional Steel and Blacksmithing Works"}
        description={
          isAr
            ? "تنفيذ وتشكيل الحديد للأعمال المعمارية والزخرفية والاستخدامات الثقيلة."
            : "Custom steel fabrication and blacksmithing for decorative and heavy-duty architectural needs."
        }
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-6">
          <h3 className="text-lg font-semibold">{isAr ? "أنواع المشاريع" : "Project Types"}</h3>
          <ul className="mt-3 list-disc space-y-2 ps-5 text-sm text-[var(--text-secondary)]">
            <li>{isAr ? "بوابات وحلول حماية محيطية" : "Gates and perimeter security works"}</li>
            <li>{isAr ? "درابزينات وأنظمة سلالم معمارية" : "Architectural railings and staircase systems"}</li>
            <li>{isAr ? "تصنيع وصيانة هياكل الحديد الصناعية" : "Industrial steel fabrication and repairs"}</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-6">
          <h3 className="text-lg font-semibold">{isAr ? "قوة التنفيذ" : "Execution Strength"}</h3>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            {isAr
              ? "يتم ضبط اللحام ومعالجات مقاومة التآكل والتركيب الموقعي وفق نقاط جودة موثقة."
              : "Welding standards, anti-corrosion treatments, and precise site fitting are controlled through documented QC checkpoints."}
          </p>
        </article>
      </div>
      <Link href="/field-visit" className="mt-6 inline-block">
        <Button>{isAr ? "احجز زيارة موقع" : "Book a Site Visit"}</Button>
      </Link>
    </PageShell>
  );
}
