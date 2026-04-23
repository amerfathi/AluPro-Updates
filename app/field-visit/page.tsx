import { FieldVisitForm } from "@/components/forms/field-visit-form";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { getCurrentLocale } from "@/lib/i18n/locale";

export default async function FieldVisitPage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  return (
    <PageShell className="py-12">
      <SectionHeading
        title={isAr ? "طلب زيارة ميدانية" : "Field Visit Request"}
        description={
          isAr
            ? "احجز زيارة موقع لرفع المقاسات ومراجعة المتطلبات الفنية قبل التنفيذ."
            : "Book a site survey to validate technical requirements and execution scope."
        }
      />
      <div className="mt-8 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-6">
        <FieldVisitForm />
      </div>
    </PageShell>
  );
}
