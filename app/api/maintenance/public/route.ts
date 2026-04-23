import { NextResponse } from "next/server";

import { createMaintenanceTicket } from "@/lib/services/leads";
import { maintenanceSchema } from "@/lib/validations/forms";

export async function POST(request: Request) {
  const formData = await request.formData();

  const payload = {
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    projectReference: String(formData.get("projectReference") ?? ""),
    issueType: String(formData.get("issueType") ?? ""),
    urgency: String(formData.get("urgency") ?? ""),
    description: String(formData.get("description") ?? ""),
    preferredContactMethod: String(formData.get("preferredContactMethod") ?? ""),
  };

  const parsed = maintenanceSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const files = formData.getAll("attachments").filter((file) => file instanceof File) as File[];
    const ticket = await createMaintenanceTicket(parsed.data, files);

    return NextResponse.json({ ok: true, id: ticket.id });
  } catch (error) {
    return NextResponse.json({ ok: false, message: (error as Error).message }, { status: 500 });
  }
}

