import { DataTable } from "@/components/ui/data-table";
import { getCurrentLocale } from "@/lib/i18n/locale";

export default async function AdminQuotesPage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  const rows = isAr
    ? [
        ["UF-2026-001", "مشروع النور", "صادر", "SAR 1,240,000"],
        ["UF-2026-002", "فيلا الملقا", "قيد التعديل", "SAR 380,000"],
      ]
    : [
        ["UF-2026-001", "Al Noor Hub", "Issued", "SAR 1,240,000"],
        ["UF-2026-002", "Villa - Al Malqa", "Under Revision", "SAR 380,000"],
      ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{isAr ? "إدارة عروض الأسعار" : "Quote Management"}</h2>
      <DataTable columns={isAr ? ["رقم العرض", "المشروع", "الحالة", "الإجمالي"] : ["Quote #", "Project", "Status", "Total"]} rows={rows} />
    </div>
  );
}
