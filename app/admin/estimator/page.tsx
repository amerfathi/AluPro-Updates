import { EstimatorWorkspace } from "@/components/admin/estimator-workspace";
import { getCurrentLocale } from "@/lib/i18n/locale";

export default async function AdminEstimatorPage() {
  const locale = await getCurrentLocale();
  const isAr = locale === "ar";

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{isAr ? "مساحة التسعير" : "Estimator Workspace"}</h2>
      <EstimatorWorkspace />
    </div>
  );
}
