import { DataTable } from "@/components/ui/data-table";
import { demoTechnicalLibrary } from "@/lib/services/demo-data";
import { getCurrentLocale } from "@/lib/i18n/locale";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminTechnicalLibraryPage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  const supabase = await getSupabaseServerClient();
  const { data } =
    supabase
      ? await supabase
          .from("technical_library_entries")
          .select("title_ar, title_en, entry_type, published")
          .order("created_at", { ascending: false })
      : { data: null };

  const sourceRows =
    data?.map((item) => ({
      titleAr: item.title_ar,
      titleEn: item.title_en,
      entryType: item.entry_type,
      published: item.published,
    })) ??
    demoTechnicalLibrary.map((item) => ({
      titleAr: item.titleAr,
      titleEn: item.titleEn,
      entryType: item.entryType,
      published: true,
    }));

  const typeArMap: Record<string, string> = {
    profiles: "قطاعات",
    glass: "زجاج",
    finishes: "تشطيبات",
  };

  const typeEnMap: Record<string, string> = {
    profiles: "Profiles",
    glass: "Glass",
    finishes: "Finishes",
  };

  const rows = sourceRows.map((row) => [
    isAr ? row.titleAr : row.titleEn,
    isAr ? (typeArMap[row.entryType] ?? row.entryType) : (typeEnMap[row.entryType] ?? row.entryType),
    isAr ? (row.published ? "منشور" : "مسودة") : row.published ? "Published" : "Draft",
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{isAr ? "إدارة المكتبة الفنية" : "Technical Library CMS"}</h2>
      <DataTable columns={isAr ? ["العنصر", "النوع", "الحالة"] : ["Entry", "Type", "Status"]} rows={rows} />
    </div>
  );
}
