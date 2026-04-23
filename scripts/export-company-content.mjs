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

function assertRequiredEnv(env) {
  const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  const missing = required.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

async function main() {
  const env = resolveEnv();
  assertRequiredEnv(env);

  const outputPath = path.join(process.cwd(), "data", "company-content.json");
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const [{ data: settingsRows, error: settingsError }, { data: portfolioRows, error: portfolioError }, { data: techRows, error: techError }] =
    await Promise.all([
      supabase.from("site_settings").select("key, value_json").in("key", ["general", "contact"]),
      supabase
        .from("portfolio_projects")
        .select("slug, title_ar, title_en, category, summary_ar, summary_en, location, completion_year, featured, published, portfolio_images(file_path, alt_ar, alt_en, sort_order, is_before, is_after)")
        .order("created_at", { ascending: false }),
      supabase
        .from("technical_library_entries")
        .select("entry_type, slug, title_ar, title_en, summary_ar, summary_en, specs_json, download_file_path, published")
        .order("created_at", { ascending: false }),
    ]);

  if (settingsError) {
    throw new Error(`Failed to load site_settings: ${settingsError.message}`);
  }
  if (portfolioError) {
    throw new Error(`Failed to load portfolio projects: ${portfolioError.message}`);
  }
  if (techError) {
    throw new Error(`Failed to load technical library entries: ${techError.message}`);
  }

  const settingsMap = Object.fromEntries((settingsRows ?? []).map((item) => [item.key, item.value_json]));

  const payload = {
    siteSettings: {
      general: settingsMap.general ?? {},
      contact: settingsMap.contact ?? {},
    },
    portfolioProjects: (portfolioRows ?? []).map((item) => ({
      slug: item.slug,
      titleAr: item.title_ar,
      titleEn: item.title_en,
      category: item.category,
      summaryAr: item.summary_ar,
      summaryEn: item.summary_en,
      location: item.location,
      completionYear: item.completion_year,
      featured: item.featured,
      published: item.published,
      images: (item.portfolio_images ?? [])
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((image) => ({
          url: image.file_path,
          altAr: image.alt_ar,
          altEn: image.alt_en,
          sortOrder: image.sort_order,
          isBefore: image.is_before,
          isAfter: image.is_after,
        })),
    })),
    technicalLibraryEntries: (techRows ?? []).map((item) => ({
      entryType: item.entry_type,
      slug: item.slug,
      titleAr: item.title_ar,
      titleEn: item.title_en,
      summaryAr: item.summary_ar,
      summaryEn: item.summary_en,
      specs: item.specs_json ?? {},
      downloadFilePath: item.download_file_path,
      published: item.published,
    })),
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log("Company content exported successfully.");
  console.log(outputPath);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
