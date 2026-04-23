import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentLocale } from "@/lib/i18n/locale";

export default async function AdminHomePage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  const stats = isAr
    ? [
        { label: "عملاء محتملون جدد", value: "18" },
        { label: "عروض أسعار مفتوحة", value: "11" },
        { label: "مشاريع نشطة", value: "7" },
        { label: "طلبات صيانة مفتوحة", value: "5" },
      ]
    : [
        { label: "New Leads", value: "18" },
        { label: "Open Quotes", value: "11" },
        { label: "Active Projects", value: "7" },
        { label: "Open Maintenance Tickets", value: "5" },
      ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{isAr ? "لوحة الإدارة" : "Admin Dashboard"}</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {isAr
            ? "نظرة تشغيلية شاملة على العملاء المحتملين والعروض والمشاريع وتذاكر الخدمة."
            : "Operational overview across leads, quotes, projects, and service tickets."}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardTitle className="text-sm text-[var(--text-secondary)]">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[var(--text-primary)]">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
