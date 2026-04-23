import { DataTable } from "@/components/ui/data-table";
import { getCurrentLocale } from "@/lib/i18n/locale";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLeadsPage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  const supabase = await getSupabaseServerClient();
  const { data } =
    supabase
      ? await supabase
          .from("leads")
          .select("id, full_name, lead_type, status, city")
          .order("created_at", { ascending: false })
          .limit(50)
      : { data: null };

  const rows =
    data?.map((lead) => [
      lead.id,
      lead.full_name,
      isAr
        ? lead.lead_type === "quote"
          ? "طلب عرض"
          : lead.lead_type === "field_visit"
            ? "زيارة ميدانية"
            : lead.lead_type === "maintenance"
              ? "صيانة"
              : "تواصل"
        : lead.lead_type,
      lead.status,
      lead.city ?? "-",
    ]) ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{isAr ? "إدارة العملاء المحتملين" : "Leads Management"}</h2>
      <DataTable columns={isAr ? ["المعرف", "الاسم", "النوع", "الحالة", "المدينة"] : ["ID", "Name", "Type", "Status", "City"]} rows={rows} />
    </div>
  );
}
