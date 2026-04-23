import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentLocale } from "@/lib/i18n/locale";
import { buildMetadata } from "@/lib/utils/metadata";

export const metadata = buildMetadata({
  title: "Technical Library",
  description: "Explore profile systems, glass specifications, and finishing standards.",
});

export default async function TechnicalLibraryPage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  const categories = isAr
    ? [
        { href: "/technical-library/profiles", title: "قطاعات الألمنيوم", text: "عائلات القطاعات وعمق الأنظمة وفق متطلبات الأداء." },
        { href: "/technical-library/glass", title: "خيارات الزجاج", text: "سماكات الزجاج وأنواعه وحلول العزل الحراري والصوتي." },
        { href: "/technical-library/finishes", title: "التشطيبات", text: "أنظمة التشطيب المعدني ومقاومة العوامل الجوية." },
      ]
    : [
        { href: "/technical-library/profiles", title: "Profiles", text: "Aluminum profile families and system depth classes." },
        { href: "/technical-library/glass", title: "Glass", text: "Glass thickness ranges and thermal/acoustic options." },
        { href: "/technical-library/finishes", title: "Finishes", text: "Powder-coat, anodized, and specialty finish systems." },
      ];

  return (
    <PageShell className="py-12">
      <SectionHeading
        title={isAr ? "المكتبة الفنية" : "Technical Library"}
        description={isAr ? "مرجع هندسي منظم للمواصفات والأنظمة." : "Specification-ready entries managed from admin CMS."}
      />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.href}>
            <CardHeader>
              <CardTitle>{category.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--text-secondary)]">{category.text}</p>
              <Link href={category.href} className="mt-4 inline-flex text-sm text-[var(--brand-primary)] hover:underline">
                {isAr ? "فتح المكتبة" : "Open library"}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
