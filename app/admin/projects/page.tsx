import Link from "next/link";

import { DataTable } from "@/components/ui/data-table";
import { getCurrentLocale } from "@/lib/i18n/locale";

export default async function AdminProjectsPage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  const projects = isAr
    ? [
        ["PRJ-24019", "مركز النور للأعمال", "الإنتاج", "68%"],
        ["PRJ-24027", "فيلا الملقا", "التوريد", "33%"],
      ]
    : [
        ["PRJ-24019", "Al Noor Business Hub", "Production", "68%"],
        ["PRJ-24027", "Villa Al Malqa", "Procurement", "33%"],
      ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{isAr ? "إدارة المشاريع" : "Project Management"}</h2>
      <DataTable
        columns={isAr ? ["رقم المشروع", "اسم المشروع", "المرحلة الحالية", "التقدم"] : ["Project ID", "Project Name", "Current Stage", "Progress"]}
        rows={projects.map((project) => [
          <Link key={project[0]} href={`/admin/projects/${project[0]}`} className="text-[var(--brand-primary)] hover:underline">
            {project[0]}
          </Link>,
          project[1],
          project[2],
          project[3],
        ])}
      />
    </div>
  );
}
