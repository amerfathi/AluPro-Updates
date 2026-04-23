import { DataTable } from "@/components/ui/data-table";
import { getCurrentLocale } from "@/lib/i18n/locale";

export default async function PortalSchedulePage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  const scheduleRows = isAr
    ? [
        ["توريد المواد - الدفعة 1", "2026-05-12", "مؤكد"],
        ["بداية التركيب", "2026-05-24", "مجدول"],
        ["الفحص النهائي", "2026-06-03", "مخطط"],
      ]
    : [
        ["Material Delivery Lot-1", "2026-05-12", "Confirmed"],
        ["Installation Start", "2026-05-24", "Scheduled"],
        ["Final Inspection", "2026-06-03", "Planned"],
      ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{isAr ? "الجدول" : "Schedule"}</h2>
      <DataTable columns={isAr ? ["النشاط", "التاريخ", "الحالة"] : ["Activity", "Date", "Status"]} rows={scheduleRows} />
    </div>
  );
}
