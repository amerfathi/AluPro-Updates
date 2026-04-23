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

async function main() {
  const env = resolveEnv();

  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  const missing = required.filter((key) => !env[key]);
  if (missing.length > 0) {
    console.error("Missing required environment variables:");
    for (const key of missing) {
      console.error(`- ${key}`);
    }
    process.exit(1);
  }

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const tableChecks = [
    "profiles",
    "leads",
    "projects",
    "portfolio_projects",
    "technical_library_entries",
  ];

  for (const table of tableChecks) {
    const { error } = await supabase.from(table).select("*", { head: true, count: "exact" });
    if (error) {
      console.error(`Table check failed: ${table}`);
      console.error(error.message);
      process.exit(1);
    }
    console.log(`Table ok: ${table}`);
  }

  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.error("Storage check failed:");
    console.error(bucketError.message);
    process.exit(1);
  }

  const bucketNames = new Set((buckets ?? []).map((bucket) => bucket.name));
  const expectedBuckets = [
    env.SUPABASE_BUCKET_LEADS || "lead-attachments",
    env.SUPABASE_BUCKET_FIELD_VISITS || "field-visit-attachments",
    env.SUPABASE_BUCKET_PROJECT_DOCS || "project-documents",
    env.SUPABASE_BUCKET_MAINTENANCE || "maintenance-uploads",
    env.SUPABASE_BUCKET_PORTFOLIO || "portfolio-images",
    env.SUPABASE_BUCKET_TECHNICAL || "technical-library-files",
    env.SUPABASE_BUCKET_PROPOSALS || "proposal-pdfs",
  ];

  const missingBuckets = expectedBuckets.filter((name) => !bucketNames.has(name));
  if (missingBuckets.length > 0) {
    console.error("Missing expected buckets:");
    for (const bucket of missingBuckets) {
      console.error(`- ${bucket}`);
    }
    process.exit(1);
  }

  console.log("Storage buckets ok.");
  console.log("Supabase connection is ready.");
}

main().catch((error) => {
  console.error("Unexpected verification error:");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
