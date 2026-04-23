import Link from "next/link";

import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { getCurrentLocale } from "@/lib/i18n/locale";

export default async function PortalMaintenancePage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  const maintenanceRows = isAr
    ? [
        ["MT-001", "انحراف قفل الباب", "عالية", "مفتوحة"],
        ["MT-002", "معالجة سيليكون", "متوسطة", "قيد التنفيذ"],
      ]
    : [
        ["MT-001", "Lock misalignment", "High", "Open"],
        ["MT-002", "Sealant touch-up", "Medium", "In Progress"],
      ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{isAr ? "الصيانة" : "Maintenance"}</h2>
        <Link href="/maintenance-request">
          <Button size="sm">{isAr ? "طلب صيانة جديد" : "New Maintenance Request"}</Button>
        </Link>
      </div>
      <DataTable columns={isAr ? ["رقم الطلب", "المشكلة", "الأولوية", "الحالة"] : ["Ticket", "Issue", "Priority", "Status"]} rows={maintenanceRows} />
    </div>
  );
}
