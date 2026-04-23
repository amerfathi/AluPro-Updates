import { DataTable } from "@/components/ui/data-table";
import { getCurrentLocale } from "@/lib/i18n/locale";

export default async function AdminMaintenancePage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  const rows = isAr
    ? [
        ["MT-001", "انحراف قفل الباب", "عالية", "مفتوحة"],
        ["MT-002", "معالجة سيليكون", "متوسطة", "قيد التنفيذ"],
        ["MT-003", "خدش زجاج", "منخفضة", "مغلقة"],
      ]
    : [
        ["MT-001", "Lock misalignment", "High", "Open"],
        ["MT-002", "Sealant touch-up", "Medium", "In Progress"],
        ["MT-003", "Glass scratch", "Low", "Closed"],
      ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{isAr ? "طلبات الصيانة" : "Maintenance Tickets"}</h2>
      <DataTable columns={isAr ? ["الطلب", "المشكلة", "الأولوية", "الحالة"] : ["Ticket", "Issue", "Priority", "Status"]} rows={rows} />
    </div>
  );
}
