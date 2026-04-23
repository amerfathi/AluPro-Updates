import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const out = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const sep = line.indexOf("=");
    if (sep === -1) {
      continue;
    }

    const key = line.slice(0, sep).trim();
    const value = line.slice(sep + 1).trim();
    out[key] = value;
  }

  return out;
}

function resolveEnv() {
  const cwd = process.cwd();
  const envPath = path.join(cwd, ".env.local");
  const fileEnv = loadEnvFile(envPath);
  return { ...fileEnv, ...process.env };
}

function assertEnv(env) {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const missing = required.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

function assertOkResponse(response, bodyText) {
  if (!response.ok) {
    throw new Error(`Request failed ${response.status}: ${bodyText}`);
  }
}

async function postForm(baseUrl, endpoint, pairs) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(pairs)) {
    formData.set(key, value);
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    body: formData,
  });

  const bodyText = await response.text();
  assertOkResponse(response, bodyText);

  let body = {};
  try {
    body = JSON.parse(bodyText);
  } catch {
    throw new Error(`Invalid JSON response from ${endpoint}: ${bodyText}`);
  }

  if (!body.ok) {
    throw new Error(`API returned not ok for ${endpoint}: ${bodyText}`);
  }

  return body;
}

async function main() {
  const env = resolveEnv();
  assertEnv(env);

  const baseUrl = env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const now = Date.now();
  const marker = `WF-${now}`;
  const clientEmail = "client@ultraframe.sa";
  const clientPassword = "UltraFrame@2026Client!";

  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) Public lead submission
  const quoteLeadResponse = await postForm(baseUrl, "/api/leads/quote", {
    fullName: `Workflow Client ${marker}`,
    phone: "+966550111222",
    email: `workflow.${now}@example.com`,
    projectType: "residential",
    serviceType: "mixed",
    city: "Riyadh",
    location: "Al Malqa",
    measurements: "150 m2",
    notes: `Automated workflow lead ${marker}`,
    preferredContactMethod: "whatsapp",
  });

  const leadId = quoteLeadResponse.id;
  if (!leadId) {
    throw new Error("Lead API did not return lead id.");
  }

  const { data: leadRow, error: leadFetchError } = await admin
    .from("leads")
    .select("id, lead_type, status, full_name, city")
    .eq("id", leadId)
    .maybeSingle();

  if (leadFetchError || !leadRow) {
    throw new Error(`Lead verification failed: ${leadFetchError?.message ?? "lead not found"}`);
  }

  // 2) Admin actions: create quote + update lead status + create project + stages + update
  const quoteNumber = `UF-WF-${now}`;
  const { data: quoteRow, error: quoteError } = await admin
    .from("quotes")
    .insert({
      lead_id: leadId,
      quote_number: quoteNumber,
      status: "issued",
      currency: "SAR",
      subtotal: 120000,
      discount: 0,
      tax: 18000,
      total: 138000,
      notes: `Automated quote for ${marker}`,
    })
    .select("id, quote_number")
    .single();

  if (quoteError || !quoteRow) {
    throw new Error(`Quote creation failed: ${quoteError?.message ?? "Unknown error"}`);
  }

  const { error: leadStatusError } = await admin
    .from("leads")
    .update({ status: "converted_to_quote" })
    .eq("id", leadId);

  if (leadStatusError) {
    throw new Error(`Lead status update failed: ${leadStatusError.message}`);
  }

  const { data: clientProfile, error: clientProfileError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", clientEmail)
    .maybeSingle();

  if (clientProfileError || !clientProfile) {
    throw new Error(`Client profile lookup failed: ${clientProfileError?.message ?? "Missing profile"}`);
  }

  const { data: clientRow, error: clientRowError } = await admin
    .from("clients")
    .select("id")
    .eq("profile_id", clientProfile.id)
    .maybeSingle();

  if (clientRowError || !clientRow) {
    throw new Error(`Client row lookup failed: ${clientRowError?.message ?? "Missing client row"}`);
  }

  const projectSlug = `workflow-check-${now}`;
  const { data: projectRow, error: projectError } = await admin
    .from("projects")
    .insert({
      client_id: clientRow.id,
      project_name: `Workflow Project ${marker}`,
      slug: projectSlug,
      project_type: "residential",
      service_type: "mixed",
      location_city: "Riyadh",
      location_address: "Automated Test Address",
      status: "Production Running",
      overall_progress: 40,
      contract_value: 138000,
      start_date: "2026-04-23",
      expected_completion_date: "2026-07-30",
    })
    .select("id, project_name")
    .single();

  if (projectError || !projectRow) {
    throw new Error(`Project creation failed: ${projectError?.message ?? "Unknown error"}`);
  }

  const stageRows = [
    {
      project_id: projectRow.id,
      stage_key: "documentation",
      stage_label_ar: "التوثيق",
      stage_label_en: "Documentation",
      status: "completed",
      progress_percent: 100,
      notes: "Contract and quote approved",
    },
    {
      project_id: projectRow.id,
      stage_key: "procurement",
      stage_label_ar: "التوريد",
      stage_label_en: "Procurement",
      status: "in_progress",
      progress_percent: 40,
      notes: "Material orders in progress",
    },
  ];

  const { data: insertedStages, error: stageInsertError } = await admin
    .from("project_stages")
    .insert(stageRows)
    .select("id, stage_key");

  if (stageInsertError || !insertedStages || insertedStages.length === 0) {
    throw new Error(`Project stage creation failed: ${stageInsertError?.message ?? "Unknown error"}`);
  }

  const procurementStage = insertedStages.find((stage) => stage.stage_key === "procurement");
  if (!procurementStage) {
    throw new Error("Procurement stage not found after insert.");
  }

  const { error: updateInsertError } = await admin.from("project_updates").insert({
    project_id: projectRow.id,
    stage_id: procurementStage.id,
    title: `Procurement update ${marker}`,
    description: "Materials partially received and verified.",
    visible_to_client: true,
  });

  if (updateInsertError) {
    throw new Error(`Project update insertion failed: ${updateInsertError.message}`);
  }

  // 3) Client visibility verification (RLS) via anon login
  const clientApp = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: signInData, error: signInError } = await clientApp.auth.signInWithPassword({
    email: clientEmail,
    password: clientPassword,
  });

  if (signInError || !signInData.session) {
    throw new Error(`Client sign-in failed during portal check: ${signInError?.message ?? "No session"}`);
  }

  const { data: clientProjectVisible, error: clientProjectError } = await clientApp
    .from("projects")
    .select("id, project_name, overall_progress")
    .eq("id", projectRow.id)
    .maybeSingle();

  if (clientProjectError || !clientProjectVisible) {
    throw new Error(`Client cannot see own project (RLS failed): ${clientProjectError?.message ?? "Not visible"}`);
  }

  const { data: clientStagesVisible, error: clientStagesError } = await clientApp
    .from("project_stages")
    .select("id")
    .eq("project_id", projectRow.id);

  if (clientStagesError || !clientStagesVisible || clientStagesVisible.length === 0) {
    throw new Error(`Client cannot see project stages: ${clientStagesError?.message ?? "No stages visible"}`);
  }

  const { data: clientUpdatesVisible, error: clientUpdatesError } = await clientApp
    .from("project_updates")
    .select("id, title")
    .eq("project_id", projectRow.id);

  if (clientUpdatesError || !clientUpdatesVisible || clientUpdatesVisible.length === 0) {
    throw new Error(`Client cannot see project updates: ${clientUpdatesError?.message ?? "No updates visible"}`);
  }

  await clientApp.auth.signOut();

  // 4) Public maintenance request flow
  const maintenanceResponse = await postForm(baseUrl, "/api/maintenance/public", {
    fullName: `Workflow Maintenance ${marker}`,
    phone: "+966550333444",
    email: `maintenance.${now}@example.com`,
    projectReference: projectRow.id,
    issueType: "hardware",
    urgency: "high",
    description: `Automated maintenance request ${marker}`,
    preferredContactMethod: "phone",
  });

  const maintenanceId = maintenanceResponse.id;
  if (!maintenanceId) {
    throw new Error("Maintenance API did not return ticket id.");
  }

  const { data: ticketRow, error: ticketError } = await admin
    .from("maintenance_tickets")
    .select("id, issue_type, priority, status")
    .eq("id", maintenanceId)
    .maybeSingle();

  if (ticketError || !ticketRow) {
    throw new Error(`Maintenance ticket verification failed: ${ticketError?.message ?? "ticket not found"}`);
  }

  console.log("Workflow check completed successfully.");
  console.log(
    JSON.stringify(
      {
        leadId,
        quoteId: quoteRow.id,
        quoteNumber: quoteRow.quote_number,
        projectId: projectRow.id,
        maintenanceTicketId: maintenanceId,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
