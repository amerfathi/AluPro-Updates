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
import { quoteRequestSchema, type QuoteRequestInput } from "@/lib/validations/forms";

import { FormFeedback } from "./form-feedback";

export function QuoteRequestForm() {
  const { t, locale } = useLocale();
  const isAr = locale === "ar";
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<QuoteRequestInput>({
    resolver: zodResolver(quoteRequestSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      city: "",
      location: "",
      measurements: "",
      notes: "",
      projectType: "residential",
      serviceType: "aluminum",
      preferredContactMethod: "phone",
    },
  });

  const submit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setStatus("idle");

    try {
      const data = new FormData();
      Object.entries(values).forEach(([key, value]) => data.append(key, String(value ?? "")));

      const attachmentsInput = document.getElementById("quote-attachments") as HTMLInputElement | null;
      const files = attachmentsInput?.files;
      if (files) {
        Array.from(files).forEach((file) => data.append("attachments", file));
      }

      const response = await fetch("/api/leads/quote", {
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
          <Label htmlFor="city">{t("forms.city")}</Label>
          <Input id="city" {...form.register("city")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="projectType">{t("forms.projectType")}</Label>
          <Select id="projectType" {...form.register("projectType")}>
            <option value="residential">{isAr ? "سكني" : "Residential"}</option>
            <option value="commercial">{isAr ? "تجاري" : "Commercial"}</option>
            <option value="industrial">{isAr ? "صناعي" : "Industrial"}</option>
            <option value="hospitality">{isAr ? "ضيافة" : "Hospitality"}</option>
            <option value="other">{isAr ? "أخرى" : "Other"}</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="serviceType">{t("forms.serviceType")}</Label>
          <Select id="serviceType" {...form.register("serviceType")}>
            <option value="aluminum">{isAr ? "ألمنيوم" : "Aluminum"}</option>
            <option value="steel">{isAr ? "حديد" : "Steel"}</option>
            <option value="glass">{isAr ? "زجاج" : "Glass"}</option>
            <option value="mixed">{isAr ? "مختلط" : "Mixed"}</option>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="location">{isAr ? "عنوان الموقع" : "Site Address"}</Label>
        <Input id="location" {...form.register("location")} />
      </div>

      <div>
        <Label htmlFor="measurements">{isAr ? "تفاصيل القياسات" : "Measurement Details"}</Label>
        <Textarea id="measurements" {...form.register("measurements")} />
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
        <Label htmlFor="quote-attachments">{t("forms.attachments")}</Label>
        <Input id="quote-attachments" type="file" multiple />
      </div>

      <div>
        <Label htmlFor="notes">{t("forms.notes")}</Label>
        <Textarea id="notes" {...form.register("notes")} />
      </div>

      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? t("common.loading") : t("common.submit")}
      </Button>

      <FormFeedback state={status} successMessage={t("forms.success")} errorMessage={t("forms.error")} />
    </form>
  );
}
