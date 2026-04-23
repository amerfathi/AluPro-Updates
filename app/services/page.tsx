import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentLocale } from "@/lib/i18n/locale";
import { buildMetadata } from "@/lib/utils/metadata";

export const metadata = buildMetadata({
  title: "Services",
  description: "Explore Ultra Frame services in aluminum systems, steel works, and glass solutions.",
});

export default async function ServicesPage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  const servicePages = isAr
    ? [
        {
          href: "/services/aluminum",
          title: "أنظمة الألمنيوم",
          text: "نوافذ وأبواب وواجهات ستائرية بأنظمة حرارية مصممة للمشاريع عالية الجودة.",
        },
        {
          href: "/services/steel",
          title: "الحديد والحدادة",
          text: "أعمال حديدية مخصصة تشمل البوابات والدرابزين والتشكيلات المعمارية المعدنية.",
        },
        {
          href: "/services/glass",
          title: "حلول الزجاج",
          text: "خيارات زجاج متقدمة للعزل والأمان والتكامل مع أنظمة الألمنيوم والحديد.",
        },
        {
          href: "/maintenance-request",
          title: "الصيانة وخدمة ما بعد البيع",
          text: "صيانة وقائية وتصحيحية مع استجابة منظمة وسجل خدمة موثق.",
        },
      ]
    : [
        {
          href: "/services/aluminum",
          title: "Aluminum Systems",
          text: "Premium windows, doors, curtain walls, and facade envelopes with engineering-grade detailing.",
        },
        {
          href: "/services/steel",
          title: "Steel & Blacksmithing",
          text: "Structural and architectural steel works, gates, railings, and custom blacksmithing deliverables.",
        },
        {
          href: "/services/glass",
          title: "Glass Works",
          text: "Double glazing, laminated solutions, and project-specific glass integration for safety and performance.",
        },
        {
          href: "/maintenance-request",
          title: "Maintenance & After-Sales",
          text: "Preventive and corrective maintenance with traceable service records and response timelines.",
        },
      ];

  return (
    <PageShell className="py-12">
      <SectionHeading
        title={isAr ? "خدمات متكاملة في المعادن والزجاج" : "Integrated Metal and Glass Services"}
        description={
          isAr
            ? "تعمل Ultra Frame كشريك تنفيذ متكامل من التنسيق الهندسي حتى التصنيع والتركيب والصيانة."
            : "Ultra Frame operates as a complete execution partner from design coordination to manufacturing, installation, and maintenance."
        }
      />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {servicePages.map((service) => (
          <Card key={service.href}>
            <CardHeader>
              <CardTitle>{service.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--text-secondary)]">{service.text}</p>
              <Link href={service.href} className="mt-4 inline-flex text-sm text-[var(--brand-primary)] hover:underline">
                {isAr ? "عرض التفاصيل" : "View details"}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
