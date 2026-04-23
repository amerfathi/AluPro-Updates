import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentLocale } from "@/lib/i18n/locale";

export default async function PortalWarrantyPage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{isAr ? "الضمان" : "Warranty"}</h2>
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "تغطية الضمان" : "Warranty Coverage"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[var(--text-secondary)]">
          <p>{isAr ? "نوع التغطية" : "Coverage Type"}: {isAr ? "عيوب التصنيع والتركيب" : "Installation and Manufacturing defects"}</p>
          <p>{isAr ? "تاريخ البداية" : "Start Date"}: 2026-06-10</p>
          <p>{isAr ? "تاريخ النهاية" : "End Date"}: 2028-06-10</p>
          <p>{isAr ? "قناة الدعم" : "Support Channel"}: {isAr ? "البوابة + خط خدمة مباشر" : "portal + dedicated service line"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
