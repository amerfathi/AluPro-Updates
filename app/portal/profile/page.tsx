import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentLocale } from "@/lib/i18n/locale";

export default async function PortalProfilePage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{isAr ? "الملف الشخصي" : "Profile"}</h2>
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "حساب العميل" : "Client Account"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[var(--text-secondary)]">
          <p>{isAr ? "الاسم" : "Name"}: Demo Client</p>
          <p>{isAr ? "البريد الإلكتروني" : "Email"}: client@ultraframe.sa</p>
          <p>{isAr ? "الهاتف" : "Phone"}: +966 55 101 0101</p>
          <p>{isAr ? "اللغة المفضلة" : "Preferred language"}: {isAr ? "العربية" : "Arabic"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
