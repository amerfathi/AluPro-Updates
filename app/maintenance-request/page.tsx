import { MaintenanceRequestForm } from "@/components/forms/maintenance-request-form";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { getCurrentLocale } from "@/lib/i18n/locale";

export default async function MaintenanceRequestPage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  return (
    <PageShell className="py-12">
      <SectionHeading
        title={isAr ? "طلب صيانة" : "Maintenance Request"}
        description={
          isAr
            ? "أبلغ عن أي ملاحظة أو عطل في مشروعك ليقوم فريق Ultra Frame بالمتابعة."
            : "Report issues with installed systems and receive response tracking from the Ultra Frame service team."
        }
      />
      <div className="mt-8 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-6">
        <MaintenanceRequestForm />
      </div>
    </PageShell>
  );
}
