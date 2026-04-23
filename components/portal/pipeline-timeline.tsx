import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { PipelineStage } from "@/types/domain";

export function PipelineTimeline({ stages, locale }: { stages: PipelineStage[]; locale: "ar" | "en" }) {
  const isAr = locale === "ar";
  const stageNotesAr: Record<string, string> = {
    documentation: "العقد، عرض السعر، والمخططات المعتمدة مرفوعة بالنظام.",
    procurement: "تم استلام كامل المقاطع والإكسسوارات المطلوبة.",
    production: "أعمال التصنيع والتجميع جارية على خط الإنتاج.",
    logistics: "بانتظار جاهزية الإنتاج للترتيب اللوجستي.",
    handover: "لم يبدأ بعد.",
  };

  return (
    <div className="space-y-4">
      {stages.map((stage) => {
        const statusVariant =
          stage.status === "completed" ? "success" : stage.status === "in_progress" ? "warning" : "default";

        const statusLabel =
          stage.status === "completed"
            ? isAr
              ? "مكتمل"
              : "Completed"
            : stage.status === "in_progress"
              ? isAr
                ? "قيد التنفيذ"
                : "In Progress"
              : isAr
                ? "معلق"
                : "Pending";

        return (
          <Card key={stage.key}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>{isAr ? stage.titleAr : stage.titleEn}</CardTitle>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{isAr ? stageNotesAr[stage.key] ?? stage.notes : stage.notes}</p>
              </div>
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>{stage.progressPercent}%</span>
                <span>{format(new Date(stage.updatedAt), "yyyy-MM-dd")}</span>
              </div>
              <Progress value={stage.progressPercent} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
