import { ContactForm } from "@/components/forms/contact-form";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentLocale } from "@/lib/i18n/locale";
import { getSiteContactSettings } from "@/lib/services/platform-data";

export default async function ContactPage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";
  const contact = await getSiteContactSettings();

  return (
    <PageShell className="py-12">
      <SectionHeading
        title={isAr ? "تواصل معنا" : "Contact"}
        description={isAr ? "تواصل مباشرة مع الفريق التجاري والفني." : "Reach our commercial and technical teams directly."}
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "بيانات التواصل المباشر" : "Direct Contact"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[var(--text-secondary)]">
              <p>{isAr ? "العنوان" : "Address"}: {isAr ? contact.addressAr : contact.addressEn}</p>
              <p>{isAr ? "الهاتف" : "Phone"}: {contact.phone}</p>
              <p>{isAr ? "البريد الإلكتروني" : "Email"}: {contact.email}</p>
              <p>WhatsApp: {contact.whatsapp}</p>
              <p>{isAr ? "ساعات العمل" : "Working Hours"}: {isAr ? contact.workingHoursAr : contact.workingHoursEn}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "الموقع" : "Location"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-[var(--border-soft)] text-sm text-[var(--text-muted)]">
                {isAr ? contact.mapLabelAr : contact.mapLabelEn}
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "نموذج تواصل سريع" : "Quick Contact Form"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
