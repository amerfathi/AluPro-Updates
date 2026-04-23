import { DataTable } from "@/components/ui/data-table";
import { demoPortfolio } from "@/lib/services/demo-data";
import { getCurrentLocale } from "@/lib/i18n/locale";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminPortfolioPage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  const supabase = await getSupabaseServerClient();
  const { data } =
    supabase
      ? await supabase
          .from("portfolio_projects")
          .select("slug, category, featured, published")
          .order("created_at", { ascending: false })
      : { data: null };

  const sourceRows =
    data?.map((item) => ({
      slug: item.slug,
      category: item.category,
      featured: item.featured,
      published: item.published,
    })) ??
    demoPortfolio.map((item) => ({
      slug: item.slug,
      category: item.category,
      featured: item.featured,
      published: true,
    }));

  const categoryArMap: Record<string, string> = {
    Residential: "سكني",
    Commercial: "تجاري",
    Industrial: "صناعي",
  };

  const rows = sourceRows.map((row) => [
    row.slug,
    isAr ? (categoryArMap[row.category] ?? row.category) : row.category,
    isAr ? (row.featured ? "نعم" : "لا") : row.featured ? "Yes" : "No",
    isAr ? (row.published ? "منشور" : "مسودة") : row.published ? "Published" : "Draft",
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{isAr ? "إدارة محتوى المشاريع" : "Portfolio CMS"}</h2>
      <DataTable columns={isAr ? ["المعرف", "الفئة", "مميز", "الحالة"] : ["Slug", "Category", "Featured", "Status"]} rows={rows} />
    </div>
  );
}
