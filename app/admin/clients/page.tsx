import { DataTable } from "@/components/ui/data-table";
import { getCurrentLocale } from "@/lib/i18n/locale";

export default async function AdminClientsPage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  const rows = isAr
    ? [
        ["CL-001", "شركة النور للتطوير", "client@alnoor.sa", "2 مشروع نشط"],
        ["CL-002", "م. العتيبي", "otaibi@example.com", "1 مشروع نشط"],
      ]
    : [
        ["CL-001", "Al Noor Development", "client@alnoor.sa", "2 active projects"],
        ["CL-002", "M. Alotaibi", "otaibi@example.com", "1 active project"],
      ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{isAr ? "حسابات العملاء" : "Client Accounts"}</h2>
      <DataTable columns={isAr ? ["رقم العميل", "الاسم", "البريد", "المشاريع"] : ["Client ID", "Name", "Email", "Projects"]} rows={rows} />
    </div>
  );
}
