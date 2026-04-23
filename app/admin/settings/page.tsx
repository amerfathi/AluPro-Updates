import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentLocale } from "@/lib/i18n/locale";

export default async function AdminSettingsPage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{isAr ? "الإعدادات" : "Settings"}</h2>
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "تهيئة المنصة" : "Platform Configuration"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[var(--text-secondary)]">
          <p>
            {isAr
              ? "إدخال بيانات الشركة الحقيقية يتم عبر ملف data/company-content.json ثم تشغيل الأمر npm run import:company-content"
              : "Import real company content from data/company-content.json, then run npm run import:company-content."}
          </p>
          <p>
            {isAr
              ? "قنوات الإشعارات الحقيقية تدعم Twilio (WhatsApp/SMS) و Resend (Email) عبر متغيرات البيئة."
              : "Real notification providers support Twilio (WhatsApp/SMS) and Resend (Email) via environment variables."}
          </p>
          <p>
            {isAr
              ? "لنشر نسخة تجريبية: vercel link ثم vercel --yes بعد ضبط متغيرات البيئة في Vercel."
              : "For preview deployment: vercel link then vercel --yes after setting environment variables in Vercel."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
