import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentLocale } from "@/lib/i18n/locale";
import { getPortalProjectsForCurrentUser } from "@/lib/services/platform-data";

export default async function PortalHomePage() {
  const projects = await getPortalProjectsForCurrentUser();
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "مرحبًا بك في Ultra-Track" : "Welcome to Ultra-Track"}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--text-secondary)]">
          {isAr
            ? "تابع مراحل مشروعك، واطلع على المستندات، وجدولة الأعمال، وطلبات الصيانة من مساحة واحدة آمنة."
            : "Track active milestones, view documents, monitor schedules, and submit maintenance requests from one secure workspace."}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <Link key={project.id} href={`/portal/projects/${project.id}`} className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-5 transition hover:border-[var(--brand-primary)]">
            <p className="text-xs text-[var(--text-muted)]">{project.id}</p>
            <h3 className="mt-1 text-lg font-semibold">{isAr ? projectNameMap[project.name] ?? project.name : project.name}</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{isAr ? cityMap[project.city] ?? project.city : project.city}</p>
            <p className="mt-3 text-sm text-[var(--brand-primary)]">{isAr ? `${project.progress}% مكتمل` : `${project.progress}% complete`}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
