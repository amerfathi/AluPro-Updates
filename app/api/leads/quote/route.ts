import { NextResponse } from "next/server";

import { createQuoteLead } from "@/lib/services/leads";
import { quoteRequestSchema } from "@/lib/validations/forms";

export async function POST(request: Request) {
  const formData = await request.formData();

  const payload = {
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    projectType: String(formData.get("projectType") ?? ""),
    serviceType: String(formData.get("serviceType") ?? ""),
    city: String(formData.get("city") ?? ""),
    location: String(formData.get("location") ?? ""),
    measurements: String(formData.get("measurements") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    preferredContactMethod: String(formData.get("preferredContactMethod") ?? ""),
  };

  const parsed = quoteRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const files = formData.getAll("attachments").filter((file) => file instanceof File) as File[];
    const lead = await createQuoteLead(parsed.data, files);

    return NextResponse.json({ ok: true, id: lead.id });
  } catch (error) {
    return NextResponse.json({ ok: false, message: (error as Error).message }, { status: 500 });
  }
}


