import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { getCurrentLocale } from "@/lib/i18n/locale";
import { buildMetadata } from "@/lib/utils/metadata";

export const metadata = buildMetadata({
  title: "About",
  description: "Learn more about Ultra Frame's mission, vision, and engineering values.",
});

export default async function AboutPage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  return (
    <PageShell className="py-12">
      <SectionHeading
        title={isAr ? "من نحن" : "About Us"}
        description={
          isAr
            ? "Ultra Frame شركة صناعات معدنية متخصصة في أنظمة الألمنيوم، والأعمال الحديدية، وحلول الزجاج للمشاريع السكنية والتجارية والصناعية."
            : "Ultra Frame is a metal industries company focused on aluminum systems, blacksmithing, and advanced glass works across residential, commercial, and industrial projects."
        }
      />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{isAr ? "الرسالة" : "Mission"}</h3>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            {isAr
              ? "نقدّم تنفيذًا هندسيًا دقيقًا بمعايير جودة ثابتة وخطة زمنية واضحة."
              : "Deliver engineering-grade execution with stable quality and controlled timelines."}
          </p>
        </article>
        <article className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{isAr ? "الرؤية" : "Vision"}</h3>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            {isAr
              ? "أن نكون المرجع الأول في المنطقة لتنفيذ واجهات وأنظمة معدنية عالية الأداء."
              : "Become the regional benchmark for high-performance metal and facade works."}
          </p>
        </article>
        <article className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{isAr ? "لماذا Ultra Frame" : "Why Ultra Frame"}</h3>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            {isAr
              ? "نمزج بين الانضباط التصنيعي والشفافية الرقمية عبر متابعة المشروع مرحلة بمرحلة."
              : "Our difference is disciplined manufacturing paired with transparent digital tracking at every stage."}
          </p>
        </article>
      </div>
    </PageShell>
  );
}
