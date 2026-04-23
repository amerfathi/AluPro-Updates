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
  const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  const missing = required.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

async function main() {
  const env = resolveEnv();
  assertEnv(env);

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: clientProfile, error: clientProfileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", "client@ultraframe.sa")
    .maybeSingle();

  if (clientProfileError || !clientProfile) {
    throw new Error(`Client profile not found: ${clientProfileError?.message ?? "profile missing"}`);
  }

  const { data: clientRow, error: clientRowError } = await supabase
    .from("clients")
    .select("id")
    .eq("profile_id", clientProfile.id)
    .maybeSingle();

  if (clientRowError || !clientRow) {
    throw new Error(`Client row not found: ${clientRowError?.message ?? "client missing"}`);
  }

  const slug = "live-client-demo-project";

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .upsert(
      {
        client_id: clientRow.id,
        project_name: "Ultra Frame Live Demo Project",
        slug,
        project_type: "residential",
        service_type: "mixed",
        location_city: "Riyadh",
        location_address: "Al Malqa District",
        status: "Production Running",
        overall_progress: 62,
        contract_value: 850000,
        start_date: "2026-04-01",
        expected_completion_date: "2026-07-20",
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();

  if (projectError || !project) {
    throw new Error(`Failed to upsert project: ${projectError?.message ?? "Unknown error"}`);
  }

  const stages = [
    {
      project_id: project.id,
      stage_key: "documentation",
      stage_label_ar: "التوثيق",
      stage_label_en: "Documentation",
      status: "completed",
      progress_percent: 100,
      notes: "العقد والمخططات المعتمدة مكتملة.",
    },
    {
      project_id: project.id,
      stage_key: "procurement",
      stage_label_ar: "التوريد",
      stage_label_en: "Procurement",
      status: "completed",
      progress_percent: 100,
      notes: "تم استلام المواد الأساسية.",
    },
    {
      project_id: project.id,
      stage_key: "production",
      stage_label_ar: "الإنتاج",
      stage_label_en: "Production",
      status: "in_progress",
      progress_percent: 62,
      notes: "أعمال التصنيع جارية.",
    },
    {
      project_id: project.id,
      stage_key: "logistics",
      stage_label_ar: "اللوجستيات",
      stage_label_en: "Logistics",
      status: "pending",
      progress_percent: 0,
      notes: "بانتظار إغلاق الإنتاج.",
    },
    {
      project_id: project.id,
      stage_key: "handover",
      stage_label_ar: "التسليم",
      stage_label_en: "Handover",
      status: "pending",
      progress_percent: 0,
      notes: "غير بدأ بعد.",
    },
  ];

  const { error: deleteStagesError } = await supabase.from("project_stages").delete().eq("project_id", project.id);
  if (deleteStagesError) {
    throw new Error(`Failed to reset stages: ${deleteStagesError.message}`);
  }

  const { error: stageInsertError } = await supabase.from("project_stages").insert(stages);
  if (stageInsertError) {
    throw new Error(`Failed to insert stages: ${stageInsertError.message}`);
  }

  console.log("Live demo project is ready.");
  console.log(`Project ID: ${project.id}`);
  console.log(`Client ID: ${clientRow.id}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
