import { getSupabaseServiceClient } from "@/lib/supabase/admin";
import { sendNotification } from "@/lib/services/notifications";
import { uploadFileToBucket } from "@/lib/services/storage";
import type { ContactInput, FieldVisitInput, MaintenanceInput, QuoteRequestInput } from "@/lib/validations/forms";

function getBucket(name: string, fallback: string) {
  return process.env[name] ?? fallback;
}

export async function createQuoteLead(input: QuoteRequestInput, files: File[]) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    await sendNotification({
      channel: "whatsapp",
      to: input.phone,
      message: `Quote request received for ${input.fullName}`,
    });

    return { id: `lead-mock-${Date.now()}` };
  }

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      full_name: input.fullName,
      phone: input.phone,
      email: input.email,
      lead_type: "quote",
      project_type: input.projectType,
      service_type: input.serviceType,
      city: input.city,
      address: input.location,
      notes: `${input.measurements}\n\n${input.notes ?? ""}`,
      preferred_contact_method: input.preferredContactMethod,
      status: "new",
    })
    .select("id")
    .single();

  if (error || !lead) {
    throw error ?? new Error("Failed to create lead");
  }

  const bucket = getBucket("SUPABASE_BUCKET_LEADS", "lead-attachments");

  for (const file of files) {
    const uploaded = await uploadFileToBucket(file, bucket, `quote/${lead.id}`);
    await supabase.from("lead_attachments").insert({
      lead_id: lead.id,
      file_path: uploaded.filePath,
      file_name: file.name,
      file_type: file.type,
    });
  }

  await sendNotification({
    channel: "whatsapp",
    to: input.phone,
    message: `Your quote request ${lead.id} has been received by Ultra Frame.`,
  });

  return lead;
}

export async function createFieldVisitLead(input: FieldVisitInput, files: File[]) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return { id: `visit-mock-${Date.now()}` };
  }

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      full_name: input.fullName,
      phone: input.phone,
      email: input.email,
      lead_type: "field_visit",
      service_type: input.serviceType,
      city: input.city,
      address: input.location,
      notes: `${input.preferredDateRange}\n\n${input.notes ?? ""}`,
      preferred_contact_method: "phone",
      status: "new",
    })
    .select("id")
    .single();

  if (error || !lead) {
    throw error ?? new Error("Failed to create lead");
  }

  const bucket = getBucket("SUPABASE_BUCKET_FIELD_VISITS", "field-visit-attachments");

  for (const file of files) {
    const uploaded = await uploadFileToBucket(file, bucket, `visit/${lead.id}`);
    await supabase.from("lead_attachments").insert({
      lead_id: lead.id,
      file_path: uploaded.filePath,
      file_name: file.name,
      file_type: file.type,
    });
  }

  return lead;
}

export async function createContactLead(input: ContactInput) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return { id: `contact-mock-${Date.now()}` };
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      full_name: input.fullName,
      phone: input.phone,
      email: input.email,
      lead_type: "contact",
      notes: `${input.subject}\n\n${input.message}`,
      status: "new",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create contact");
  }

  return data;
}

export async function createMaintenanceTicket(input: MaintenanceInput, files: File[]) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return { id: `ticket-mock-${Date.now()}` };
  }

  const { data: ticket, error } = await supabase
    .from("maintenance_tickets")
    .insert({
      subject: `Maintenance - ${input.fullName}`,
      issue_type: input.issueType,
      priority: input.urgency,
      description: `${input.projectReference ?? ""}\n\n${input.description}`,
      preferred_contact_method: input.preferredContactMethod,
      status: "open",
    })
    .select("id")
    .single();

  if (error || !ticket) {
    throw error ?? new Error("Failed to create ticket");
  }

  const bucket = getBucket("SUPABASE_BUCKET_MAINTENANCE", "maintenance-uploads");

  for (const file of files) {
    const uploaded = await uploadFileToBucket(file, bucket, `ticket/${ticket.id}`);

    await supabase.from("maintenance_attachments").insert({
      ticket_id: ticket.id,
      file_path: uploaded.filePath,
      file_name: file.name,
    });
  }

  await sendNotification({
    channel: "sms",
    to: input.phone,
    message: `Maintenance ticket ${ticket.id} created and under review.`,
  });

  return ticket;
}


