import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { DataTable } from "@/components/ui/data-table";
import { getCurrentLocale } from "@/lib/i18n/locale";
import { getTechnicalEntries } from "@/lib/services/platform-data";

export default async function TechnicalGlassPage() {
  const entries = await getTechnicalEntries("glass");
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  return (
    <PageShell className="py-12">
      <SectionHeading
        title={isAr ? "خيارات الزجاج" : "Glass Options"}
        description={isAr ? "حزم الزجاج المتاحة وسماكاتها ومؤشرات الأداء." : "Available glazing packages, thicknesses, and performance ranges."}
      />
      <div className="mt-8">
        <DataTable
          columns={isAr ? ["نوع الزجاج", "الملخص", "المواصفات"] : ["Glass Type", "Summary", "Specs"]}
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
