import { DataTable } from "@/components/ui/data-table";
import { getCurrentLocale } from "@/lib/i18n/locale";

export default async function PortalDocumentsPage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  const rows = isAr
    ? [
        ["العقد", "موقع", "2026-03-02"],
        ["المخططات التنفيذية المعتمدة", "معتمد", "2026-03-05"],
        ["شهادة الضمان", "قيد الإصدار", "-"],
      ]
    : [
        ["Contract", "Signed", "2026-03-02"],
        ["Approved Shop Drawings", "Approved", "2026-03-05"],
        ["Warranty Certificate", "Pending", "-"],
      ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{isAr ? "المستندات" : "Documents"}</h2>
      <DataTable columns={isAr ? ["المستند", "الحالة", "التاريخ"] : ["Document", "Status", "Date"]} rows={rows} />
    </div>
  );
}
