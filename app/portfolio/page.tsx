import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Badge } from "@/components/ui/badge";
import { getCurrentLocale } from "@/lib/i18n/locale";
import { getPortfolioProjects } from "@/lib/services/platform-data";
import { buildMetadata } from "@/lib/utils/metadata";

export const metadata = buildMetadata({
  title: "Portfolio",
  description: "Browse Ultra Frame portfolio across residential, commercial, and industrial categories.",
});

export default async function PortfolioPage() {
  const projects = await getPortfolioProjects();
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  const categoryLabel: Record<string, string> = {
    Residential: isAr ? "سكني" : "Residential",
    Commercial: isAr ? "تجاري" : "Commercial",
    Industrial: isAr ? "صناعي" : "Industrial",
  };

  return (
    <PageShell className="py-12">
      <SectionHeading
        title={isAr ? "المشاريع" : "Portfolio"}
        description={
          isAr
            ? "نماذج من مشاريعنا التي تعكس دقة الهندسة وجودة التنفيذ."
            : "Selected projects demonstrating engineering precision and delivery quality."
        }
      />
      <div className="mt-6 flex flex-wrap gap-2">
        <Badge>{isAr ? "سكني" : "Residential"}</Badge>
        <Badge>{isAr ? "تجاري" : "Commercial"}</Badge>
        <Badge>{isAr ? "صناعي" : "Industrial"}</Badge>
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {projects.map((project) => (
          <Link key={project.slug} href={`/portfolio/${project.slug}`} className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-5 transition hover:border-[var(--brand-primary)]">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-primary)]">{categoryLabel[project.category] ?? project.category}</p>
            <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{isAr ? project.titleAr : project.titleEn}</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{isAr ? project.summaryAr : project.summaryEn}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
