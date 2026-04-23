import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { getCurrentLocale } from "@/lib/i18n/locale";

export default async function AdminProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  const stageRows = isAr
    ? [
        ["التوثيق", "مكتمل", "2026-03-05"],
        ["التوريد", "مكتمل", "2026-03-20"],
        ["الإنتاج", "قيد التنفيذ", "2026-04-20"],
        ["اللوجستيات", "معلق", "-"],
        ["التسليم", "معلق", "-"],
      ]
    : [
        ["Documentation", "Completed", "2026-03-05"],
        ["Procurement", "Completed", "2026-03-20"],
        ["Production", "In Progress", "2026-04-20"],
        ["Logistics", "Pending", "-"],
        ["Handover", "Pending", "-"],
      ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? `المشروع ${projectId}` : `Project ${projectId}`}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--text-secondary)]">
          {isAr
            ? "يمكنك من هنا متابعة المراحل، تحديث الجداول، وإدارة مستندات المشروع."
            : "Stage updates, schedule coordination, and document controls are managed here."}
        </CardContent>
      </Card>
      <DataTable columns={isAr ? ["المرحلة", "الحالة", "آخر تحديث"] : ["Stage", "Status", "Updated"]} rows={stageRows} />
    </div>
  );
}
