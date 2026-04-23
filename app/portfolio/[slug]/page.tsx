import { notFound } from "next/navigation";

import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Badge } from "@/components/ui/badge";
import { getCurrentLocale } from "@/lib/i18n/locale";
import { getPortfolioProjectBySlug } from "@/lib/services/platform-data";

export const dynamic = "force-dynamic";

export default async function PortfolioProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getPortfolioProjectBySlug(slug);
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  if (!project) {
    notFound();
  }

  const beforeImages = project.images.filter((image) => image.isBefore);
  const afterImages = project.images.filter((image) => image.isAfter);
  const locationMap: Record<string, string> = {
    Riyadh: "الرياض",
    Jeddah: "جدة",
    Dammam: "الدمام",
  };
  const categoryMap: Record<string, string> = {
    Residential: "سكني",
    Commercial: "تجاري",
    Industrial: "صناعي",
  };

  return (
    <PageShell className="py-12">
      <SectionHeading title={isAr ? project.titleAr : project.titleEn} description={isAr ? project.summaryAr : project.summaryEn} />
      <div className="mt-4 flex items-center gap-2">
        <Badge>{isAr ? categoryMap[project.category] ?? project.category : project.category}</Badge>
        <Badge>{isAr ? locationMap[project.location] ?? project.location : project.location}</Badge>
        <Badge>{project.completionYear}</Badge>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {project.images.map((image, index) => (
          <figure key={`${image.url}-${index}`} className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${image.url}?auto=format&fit=crop&w=1200&q=80`} alt={isAr ? image.altAr : image.altEn} className="h-64 w-full object-cover" />
          </figure>
        ))}
      </div>

      {(beforeImages.length > 0 || afterImages.length > 0) && (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-5">
            <h3 className="text-lg font-semibold">{isAr ? "قبل" : "Before"}</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {isAr ? "صور الحالة الأولية قبل التنفيذ أو المعالجة." : "Pre-restoration/initial condition snapshots."}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-5">
            <h3 className="text-lg font-semibold">{isAr ? "بعد" : "After"}</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {isAr ? "نتيجة التنفيذ النهائية وجودة التشطيب بعد الإنجاز." : "Post-execution transformation and final finish."}
            </p>
          </div>
        </div>
      )}
    </PageShell>
  );
}
