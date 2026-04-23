"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useLocale } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { maintenanceSchema, type MaintenanceInput } from "@/lib/validations/forms";

import { FormFeedback } from "./form-feedback";

export function MaintenanceRequestForm() {
  const { t, locale } = useLocale();
  const isAr = locale === "ar";
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MaintenanceInput>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      projectReference: "",
      issueType: "",
      urgency: "medium",
      description: "",
      preferredContactMethod: "phone",
    },
  });

  const submit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setStatus("idle");

    try {
      const data = new FormData();
      Object.entries(values).forEach(([key, value]) => data.append(key, String(value ?? "")));

      const attachmentsInput = document.getElementById("maintenance-attachments") as HTMLInputElement | null;
      const files = attachmentsInput?.files;
      if (files) {
        Array.from(files).forEach((file) => data.append("attachments", file));
      }

      const response = await fetch("/api/maintenance/public", {
        method: "POST",
        body: data,
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="fullName">{t("forms.name")}</Label>
          <Input id="fullName" {...form.register("fullName")} />
        </div>
        <div>
          <Label htmlFor="phone">{t("forms.phone")}</Label>
          <Input id="phone" {...form.register("phone")} />
        </div>
        <div>
          <Label htmlFor="email">{t("forms.email")}</Label>
          <Input id="email" type="email" {...form.register("email")} />
        </div>
        <div>
          <Label htmlFor="projectReference">{isAr ? "مرجع المشروع (اختياري)" : "Project Reference (Optional)"}</Label>
          <Input id="projectReference" {...form.register("projectReference")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="issueType">{isAr ? "نوع المشكلة" : "Issue Type"}</Label>
          <Input id="issueType" {...form.register("issueType")} />
        </div>
        <div>
          <Label htmlFor="urgency">{isAr ? "درجة الاستعجال" : "Urgency"}</Label>
          <Select id="urgency" {...form.register("urgency")}>
            <option value="low">{isAr ? "منخفض" : "Low"}</option>
            <option value="medium">{isAr ? "متوسط" : "Medium"}</option>
            <option value="high">{isAr ? "مرتفع" : "High"}</option>
            <option value="critical">{isAr ? "حرج" : "Critical"}</option>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">{isAr ? "وصف المشكلة" : "Issue Description"}</Label>
        <Textarea id="description" {...form.register("description")} />
      </div>

      <div>
        <Label htmlFor="preferredContactMethod">{t("forms.preferredContact")}</Label>
        <Select id="preferredContactMethod" {...form.register("preferredContactMethod")}>
          <option value="phone">{isAr ? "اتصال" : "Phone"}</option>
          <option value="whatsapp">{isAr ? "واتساب" : "WhatsApp"}</option>
          <option value="email">{isAr ? "بريد إلكتروني" : "Email"}</option>
        </Select>
      </div>

      <div>
        <Label htmlFor="maintenance-attachments">{t("forms.attachments")}</Label>
        <Input id="maintenance-attachments" type="file" multiple />
      </div>

      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? t("common.loading") : t("common.submit")}
      </Button>

      <FormFeedback state={status} successMessage={t("forms.success")} errorMessage={t("forms.error")} />
    </form>
  );
}
