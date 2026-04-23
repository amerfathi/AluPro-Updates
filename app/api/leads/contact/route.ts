import { NextResponse } from "next/server";

import { createContactLead } from "@/lib/services/leads";
import { contactSchema } from "@/lib/validations/forms";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, string>;

  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const lead = await createContactLead(parsed.data);

    return NextResponse.json({ ok: true, id: lead.id });
  } catch (error) {
    return NextResponse.json({ ok: false, message: (error as Error).message }, { status: 500 });
  }
}


