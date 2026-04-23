import Link from "next/link";

import { DataTable } from "@/components/ui/data-table";
import { getCurrentLocale } from "@/lib/i18n/locale";
import { getPortalProjectsForCurrentUser } from "@/lib/services/platform-data";

export default async function PortalProjectsPage() {
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
  const statusMap: Record<string, string> = {
    "Production Running": "الإنتاج جارٍ",
    Procurement: "التوريد",
    Completed: "مكتمل",
    Pending: "قيد الانتظار",
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{isAr ? "المشاريع" : "Projects"}</h2>
      <DataTable
        columns={isAr ? ["المشروع", "المدينة", "الحالة", "التقدم", "عرض"] : ["Project", "City", "Status", "Progress", "Open"]}
        rows={projects.map((project) => [
          isAr ? projectNameMap[project.name] ?? project.name : project.name,
          isAr ? cityMap[project.city] ?? project.city : project.city,
          isAr ? statusMap[project.status] ?? project.status : project.status,
          `${project.progress}%`,
          <Link key={project.id} href={`/portal/projects/${project.id}`} className="text-[var(--brand-primary)] hover:underline">
            {isAr ? "عرض" : "View"}
          </Link>,
        ])}
      />
    </div>
  );
}
