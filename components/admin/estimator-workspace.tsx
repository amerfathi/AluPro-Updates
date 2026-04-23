"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Download } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useLocale } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { calculateEstimate } from "@/lib/services/estimator";
import { estimatorSchema, type EstimatorInput } from "@/lib/validations/forms";

export function EstimatorWorkspace() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [loadingPdf, setLoadingPdf] = useState(false);

  const form = useForm<EstimatorInput>({
    resolver: zodResolver(estimatorSchema),
    defaultValues: {
      projectName: "",
      clientName: "",
      areaM2: 120,
      systemType: "aluminum",
      materialCostPerM2: 420,
      laborCostPerM2: 160,
      accessoriesCost: 6000,
      overheadCost: 3000,
      marginPercent: 18,
    },
  });

  const parsedEstimateInput = estimatorSchema.safeParse(form.getValues());
  const estimate = parsedEstimateInput.success ? calculateEstimate(parsedEstimateInput.data) : null;

  const onDownloadPdf = async () => {
    const parsed = estimatorSchema.safeParse(form.getValues());

    if (!parsed.success) {
      return;
    }

    setLoadingPdf(true);
    try {
      const response = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${parsed.data.projectName || "proposal"}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setLoadingPdf(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "مدخلات التسعير" : "Estimator Inputs"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="projectName">{isAr ? "اسم المشروع" : "Project Name"}</Label>
              <Input id="projectName" {...form.register("projectName")} />
            </div>
            <div>
              <Label htmlFor="clientName">{isAr ? "اسم العميل" : "Client Name"}</Label>
              <Input id="clientName" {...form.register("clientName")} />
            </div>
            <div>
              <Label htmlFor="areaM2">{isAr ? "المساحة (م2)" : "Area (m2)"}</Label>
              <Input id="areaM2" type="number" step="0.01" {...form.register("areaM2")} />
            </div>
            <div>
              <Label htmlFor="systemType">{isAr ? "نوع النظام" : "System Type"}</Label>
              <Select id="systemType" {...form.register("systemType")}>
                <option value="aluminum">{isAr ? "ألمنيوم" : "Aluminum"}</option>
                <option value="steel">{isAr ? "حديد" : "Steel"}</option>
                <option value="glass">{isAr ? "زجاج" : "Glass"}</option>
                <option value="mixed">{isAr ? "مختلط" : "Mixed"}</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="materialCostPerM2">{isAr ? "تكلفة المواد / م2" : "Material Cost / m2"}</Label>
              <Input id="materialCostPerM2" type="number" step="0.01" {...form.register("materialCostPerM2")} />
            </div>
            <div>
              <Label htmlFor="laborCostPerM2">{isAr ? "تكلفة العمالة / م2" : "Labor Cost / m2"}</Label>
              <Input id="laborCostPerM2" type="number" step="0.01" {...form.register("laborCostPerM2")} />
            </div>
            <div>
              <Label htmlFor="accessoriesCost">{isAr ? "تكلفة الإكسسوارات" : "Accessories Cost"}</Label>
              <Input id="accessoriesCost" type="number" step="0.01" {...form.register("accessoriesCost")} />
            </div>
            <div>
              <Label htmlFor="overheadCost">{isAr ? "تكلفة المصاريف العامة" : "Overhead Cost"}</Label>
              <Input id="overheadCost" type="number" step="0.01" {...form.register("overheadCost")} />
            </div>
            <div>
              <Label htmlFor="marginPercent">{isAr ? "نسبة الهامش %" : "Margin %"}</Label>
              <Input id="marginPercent" type="number" step="0.01" {...form.register("marginPercent")} />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "ملخص التسعير" : "Pricing Summary"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <SummaryRow label={isAr ? "تقدير المواد" : "Material Estimate"} value={estimate?.materialEstimate ?? 0} />
          <SummaryRow label={isAr ? "تقدير العمالة" : "Labor Estimate"} value={estimate?.laborEstimate ?? 0} />
          <SummaryRow label={isAr ? "الإجمالي قبل الهامش" : "Subtotal"} value={estimate?.subtotal ?? 0} />
          <SummaryRow label={isAr ? "الهامش" : "Margin"} value={estimate?.marginAmount ?? 0} />
          <SummaryRow label={isAr ? "إجمالي العرض" : "Total Proposal"} value={estimate?.total ?? 0} strong />

          <Button className="mt-4 w-full" onClick={onDownloadPdf} disabled={loadingPdf}>
            <Download className="me-2 h-4 w-4" />
            {loadingPdf ? (isAr ? "جاري إنشاء PDF..." : "Generating PDF...") : isAr ? "تنزيل عرض السعر PDF" : "Download Proposal PDF"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className={strong ? "text-base font-bold text-[var(--text-primary)]" : "font-medium text-[var(--text-primary)]"}>
        SAR {value.toFixed(2)}
      </span>
    </div>
  );
}
