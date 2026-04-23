import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { DataTable } from "@/components/ui/data-table";
import { getCurrentLocale } from "@/lib/i18n/locale";
import { getTechnicalEntries } from "@/lib/services/platform-data";

export default async function TechnicalProfilesPage() {
  const entries = await getTechnicalEntries("profiles");
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  return (
    <PageShell className="py-12">
      <SectionHeading
        title={isAr ? "عائلات القطاعات" : "Profile Families"}
        description={isAr ? "الأنظمة الأساسية لقطاعات الألمنيوم ومراجع الأداء." : "Core aluminum profile systems and performance references."}
      />
      <div className="mt-8">
        <DataTable
          columns={isAr ? ["النظام", "الملخص", "المواصفات"] : ["System", "Summary", "Specs"]}
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
