"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useLocale } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contactSchema, type ContactInput } from "@/lib/validations/forms";

import { FormFeedback } from "./form-feedback";

export function ContactForm() {
  const { t, locale } = useLocale();
  const isAr = locale === "ar";
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const submit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setStatus("idle");

    try {
      const response = await fetch("/api/leads/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
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
        <div className="sm:col-span-2">
          <Label htmlFor="email">{t("forms.email")}</Label>
          <Input id="email" type="email" {...form.register("email")} />
        </div>
      </div>

      <div>
        <Label htmlFor="subject">{isAr ? "الموضوع" : "Subject"}</Label>
        <Input id="subject" {...form.register("subject")} />
      </div>

      <div>
        <Label htmlFor="message">{isAr ? "الرسالة" : "Message"}</Label>
        <Textarea id="message" {...form.register("message")} />
      </div>

      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? t("common.loading") : t("common.submit")}
      </Button>

      <FormFeedback state={status} successMessage={t("forms.success")} errorMessage={t("forms.error")} />
    </form>
  );
}
