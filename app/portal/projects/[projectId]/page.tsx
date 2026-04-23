import { notFound } from "next/navigation";

import { PipelineTimeline } from "@/components/portal/pipeline-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentLocale } from "@/lib/i18n/locale";
import { getPortalProjectById } from "@/lib/services/platform-data";

export default async function PortalProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getPortalProjectById(projectId);
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";
  const cityMap: Record<string, string> = {
    Riyadh: "الرياض",
    Jeddah: "جدة",
    Dammam: "الدمام",
  };
  const projectNameMap: Record<string, string> = {
    "Al Noor Business Hub": "مركز النور للأعمال",
    "Private Villa - Al Malqa": "فيلا خاصة - الملقا",
  };
  const statusMap: Record<string, string> = {
    "Production Running": "الإنتاج جارٍ",
    Procurement: "التوريد",
    Completed: "مكتمل",
    Pending: "قيد الانتظار",
  };

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? projectNameMap[project.name] ?? project.name : project.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-[var(--text-secondary)] md:grid-cols-2">
          <p>{isAr ? "رقم المشروع" : "Project ID"}: {project.id}</p>
          <p>{isAr ? "الحالة" : "Status"}: {isAr ? statusMap[project.status] ?? project.status : project.status}</p>
          <p>{isAr ? "المدينة" : "City"}: {isAr ? cityMap[project.city] ?? project.city : project.city}</p>
          <p>{isAr ? "موعد الإنجاز المتوقع" : "Expected completion"}: {project.expectedCompletion}</p>
        </CardContent>
      </Card>

      <PipelineTimeline stages={project.stages} locale={locale} />
    </div>
  );
}
