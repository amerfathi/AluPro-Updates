import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { DataTable } from "@/components/ui/data-table";
import { getCurrentLocale } from "@/lib/i18n/locale";
import { getTechnicalEntries } from "@/lib/services/platform-data";

export default async function TechnicalFinishesPage() {
  const entries = await getTechnicalEntries("finishes");
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  return (
    <PageShell className="py-12">
      <SectionHeading
        title={isAr ? "التشطيبات" : "Finishes"}
        description={isAr ? "معلومات الدهان الحراري والأنودة وأنظمة التشطيب طويلة العمر." : "Powder coating, anodizing, and long-life finishing details."}
      />
      <div className="mt-8">
        <DataTable
          columns={isAr ? ["التشطيب", "الملخص", "المواصفات"] : ["Finish", "Summary", "Specs"]}
          rows={entries.map((entry) => [
            isAr ? entry.titleAr : entry.titleEn,
            isAr ? entry.summaryAr : entry.summaryEn,
            Object.entries(entry.specs)
              .map(([key, value]) => `${key}: ${value}`)
              .join(" | "),
          ])}
        />
      </div>
    </PageShell>
  );
}
