"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Factory, Hammer, ShieldCheck, Wrench } from "lucide-react";

import { useLocale } from "@/components/layout/locale-provider";
import { SectionHeading } from "@/components/layout/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { demoPortfolio } from "@/lib/services/demo-data";

export function HomeSections() {
  const { t, locale } = useLocale();
  const isAr = locale === "ar";
  const categoryLabel: Record<string, string> = {
    Residential: isAr ? "سكني" : "Residential",
    Commercial: isAr ? "تجاري" : "Commercial",
    Industrial: isAr ? "صناعي" : "Industrial",
  };

  const trustPoints = isAr
    ? [
        "تخطيط وتنفيذ بمنهج هندسي منضبط.",
        "رؤية واضحة لمراحل المشروع خطوة بخطوة.",
        "رقابة جودة مصنعية مع تنسيق ميداني دقيق.",
        "خدمة ما بعد البيع والصيانة ضمن خطة متابعة.",
      ]
    : [
        "Engineering-first planning and execution.",
        "Clear stage-by-stage project visibility.",
        "Factory quality control with site coordination.",
        "After-sales maintenance and warranty support.",
      ];

  const services = isAr
    ? [
        {
          title: "أنظمة الألمنيوم",
          icon: Factory,
          href: "/services/aluminum",
          desc: "نوافذ وأبواب وواجهات ستائرية بأنظمة حرارية مصممة للمشاريع عالية الجودة.",
        },
        {
          title: "الحديد والحدادة",
          icon: Hammer,
          href: "/services/steel",
          desc: "أعمال حديدية مخصصة تشمل البوابات والدرابزين والتشكيلات المعمارية المعدنية.",
        },
        {
          title: "حلول الزجاج",
          icon: ShieldCheck,
          href: "/services/glass",
          desc: "خيارات زجاج متقدمة للعزل والأمان والتكامل مع أنظمة الألمنيوم والحديد.",
        },
        {
          title: "الصيانة",
          icon: Wrench,
          href: "/maintenance-request",
          desc: "صيانة وقائية وتصحيحية للأنظمة المنفذة مع متابعة موثقة.",
        },
      ]
    : [
        {
          title: "Aluminum Systems",
          icon: Factory,
          href: "/services/aluminum",
          desc: "Thermal windows, doors, curtain walls, and facade systems.",
        },
        {
          title: "Steel & Blacksmithing",
          icon: Hammer,
          href: "/services/steel",
          desc: "Custom steel works, gates, railings, and architectural metal fabrication.",
        },
        {
          title: "Glass Solutions",
          icon: ShieldCheck,
          href: "/services/glass",
          desc: "High-performance glazing, insulated glass units, and specialty glass integration.",
        },
        {
          title: "Maintenance",
          icon: Wrench,
          href: "/maintenance-request",
          desc: "Scheduled and corrective maintenance for installed systems.",
        },
      ];

  const process = isAr
    ? [
        {
          step: "01",
          title: "الرفع الفني وزيارة الموقع",
          text: "نراجع متطلبات المشروع وقيود الموقع ونوثق القياسات بدقة.",
        },
        {
          step: "02",
          title: "الهندسة والعرض الفني المالي",
          text: "نقدّم نطاق عمل واضحًا مع الرسومات والعرض التجاري بشفافية.",
        },
        {
          step: "03",
          title: "التصنيع وضبط الجودة",
          text: "تنفيذ المصنعية يتم عبر مسارات إنتاج مضبوطة ونقاط فحص موثقة.",
        },
        {
          step: "04",
          title: "التركيب والتسليم",
          text: "تسليم الموقع يتم وفق جدول واضح مع وثائق الضمان والإغلاق.",
        },
      ]
    : [
        {
          step: "01",
          title: "Technical Brief & Site Survey",
          text: "We review project intent, constraints, and collect accurate measurements.",
        },
        {
          step: "02",
          title: "Engineering & Quotation",
          text: "We provide structured scope, drawings, and a transparent commercial proposal.",
        },
        {
          step: "03",
          title: "Fabrication & Quality Control",
          text: "Production follows controlled workflows with traceable quality checkpoints.",
        },
        {
          step: "04",
          title: "Installation & Handover",
          text: "Delivery, installation, and final handover include warranty and closeout files.",
        },
      ];

  const pipelineLabels = isAr
    ? ["التوثيق", "المشتريات", "الإنتاج", "اللوجستيات", "التسليم"]
    : ["Documentation", "Procurement", "Production", "Logistics", "Handover"];

  return (
    <div className="space-y-18 py-12">
      <section className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <p className="inline-flex items-center rounded-full border border-[var(--border-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-primary)]">
            {isAr ? "Ultra Frame - الصناعات المعدنية" : "Ultra Frame - Metal Industries"}
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-[var(--text-primary)] sm:text-5xl">{t("hero.headline")}</h1>
          <p className="max-w-2xl text-lg text-[var(--text-secondary)]">{t("hero.description")}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/quote-request">
              <Button>{t("hero.quoteCta")}</Button>
            </Link>
            <Link href="/field-visit">
              <Button variant="secondary">{t("hero.visitCta")}</Button>
            </Link>
            <Link href="/portal">
              <Button variant="outline">{t("hero.trackCta")}</Button>
            </Link>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl border border-[var(--border-soft)] bg-[linear-gradient(160deg,#0f1726_0%,#11294e_40%,#0f1726_100%)] p-8"
        >
          <div className="absolute -end-12 -top-14 h-56 w-56 rounded-full bg-[radial-gradient(circle,#0b66ff_0%,transparent_70%)] opacity-70" />
          <h3 className="text-xl font-semibold text-[var(--text-primary)]">{isAr ? "لوحة التحكم بالمشروع" : "Project Control Panel"}</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {isAr ? "متابعة حية لمراحل المشروع من العقد حتى التسليم النهائي." : "Live pipeline visibility from contract to final handover."}
          </p>
          <div className="mt-6 space-y-3">
            {pipelineLabels.map((item, index) => (
              <div key={item} className="flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-black/20 px-3 py-2 text-sm">
                <span>{item}</span>
                <span className="text-[var(--brand-primary)]">{index < 3 ? (isAr ? "نشط" : "Active") : isAr ? "قادم" : "Pending"}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="space-y-6">
        <SectionHeading title={t("home.trustTitle")} description={t("home.trustDescription")} />
        <div className="grid gap-4 sm:grid-cols-2">
          {trustPoints.map((point) => (
            <div key={point} className="flex items-start gap-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--brand-primary)]" />
              <p className="text-sm text-[var(--text-secondary)]">{point}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading title={t("home.servicesTitle")} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <Card key={service.title} className="h-full">
                <CardHeader>
                  <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-primary-muted)] text-[var(--brand-primary)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{service.title}</CardTitle>
                  <CardDescription>{service.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={service.href} className="inline-flex items-center text-sm text-[var(--brand-primary)] hover:underline">
                    {t("common.learnMore")} <ArrowRight className="ms-1 h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading title={t("home.showcaseTitle")} />
        <div className="grid gap-4 lg:grid-cols-3">
          {demoPortfolio.slice(0, 3).map((project) => (
            <Link key={project.slug} href={`/portfolio/${project.slug}`} className="group rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-5 transition hover:border-[var(--brand-primary)]">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-primary)]">{categoryLabel[project.category] ?? project.category}</p>
              <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{isAr ? project.titleAr : project.titleEn}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{isAr ? project.summaryAr : project.summaryEn}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-8">
        <SectionHeading title={t("home.trackTitle")} description={t("home.trackDescription")} />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Info
            title={isAr ? "مراحل لحظية" : "Real-time Milestones"}
            text={isAr ? "يمكن للعميل متابعة كل مرحلة مع التوقيت والملاحظات." : "Clients can track each stage with timestamps and notes."}
          />
          <Info
            title={isAr ? "مستندات منظمة" : "Controlled Documents"}
            text={
              isAr
                ? "العقود والرسومات والشهادات والضمانات ضمن مساحة واحدة آمنة."
                : "Contracts, drawings, certificates, and warranties in one secure place."
            }
          />
          <Info
            title={isAr ? "استمرارية الصيانة" : "Maintenance Continuity"}
            text={
              isAr
                ? "بعد التسليم تبقى تذاكر الصيانة مرتبطة بتاريخ المشروع كاملاً."
                : "After handover, maintenance tickets stay connected to project history."
            }
          />
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading title={t("home.processTitle")} />
        <div className="grid gap-4 md:grid-cols-2">
          {process.map((item) => (
            <Card key={item.step}>
              <CardHeader>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary)]">{isAr ? `الخطوة ${item.step}` : `Step ${item.step}`}</p>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--text-secondary)]">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,#0b66ff1c,#0f1726)] p-8 text-center">
        <h3 className="text-2xl font-semibold text-[var(--text-primary)]">{t("home.leadTitle")}</h3>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">
          {isAr
            ? "شارك متطلبات مشروعك واحصل على رد فني وتجاري منظم من فريق Ultra Frame."
            : "Share your project requirements and receive a structured technical and commercial response from Ultra Frame."}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link href="/quote-request">
            <Button>{t("hero.quoteCta")}</Button>
          </Link>
          <Link href="/field-visit">
            <Button variant="outline">{t("hero.visitCta")}</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
      <h4 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h4>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{text}</p>
    </div>
  );
}
