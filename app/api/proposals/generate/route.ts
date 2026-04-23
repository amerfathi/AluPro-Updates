import { NextResponse } from "next/server";

import { generateProposalPdfBuffer } from "@/lib/pdf/generate-proposal";
import { calculateEstimate } from "@/lib/services/estimator";
import { estimatorSchema } from "@/lib/validations/forms";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ ok: false, message: "Invalid payload" }, { status: 400 });
  }

  const parsed = estimatorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  const estimate = calculateEstimate(parsed.data);

  const payload = {
    quoteNumber: `UF-${Date.now()}`,
    clientName: parsed.data.clientName,
    projectName: parsed.data.projectName,
    currency: "SAR",
    createdAt: new Date().toISOString().slice(0, 10),
    items: [
      {
        itemName: `System - ${parsed.data.systemType}`,
        itemDescription: `Area ${parsed.data.areaM2} m²`,
        quantity: parsed.data.areaM2,
        unit: "m²",
        unitPrice: parsed.data.materialCostPerM2 + parsed.data.laborCostPerM2,
        totalPrice: estimate.subtotal,
      },
    ],
    subtotal: estimate.subtotal,
    marginAmount: estimate.marginAmount,
    total: estimate.total,
    notes: "Prepared by Ultra Frame Estimator Workspace",
  };

  const pdfBuffer = await generateProposalPdfBuffer(payload);

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${payload.quoteNumber}.pdf"`,
    },
  });
}


