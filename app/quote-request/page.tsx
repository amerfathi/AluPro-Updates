import { QuoteRequestForm } from "@/components/forms/quote-request-form";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { getCurrentLocale } from "@/lib/i18n/locale";

export default async function QuoteRequestPage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  return (
    <PageShell className="py-12">
      <SectionHeading
        title={isAr ? "طلب عرض سعر" : "Quote Request"}
        description={
          isAr
            ? "أرسل تفاصيل مشروعك والمخططات لنقدم لك عرضًا فنيًا وماليًا واضحًا."
            : "Submit your project details and drawings. Our engineering team will respond with a structured proposal."
        }
      />
      <div className="mt-8 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-6">
        <QuoteRequestForm />
      </div>
    </PageShell>
  );
}
