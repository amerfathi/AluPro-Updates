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

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    file: path.join(process.cwd(), "data", "company-content.json"),
  };

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--file" && args[i + 1]) {
      out.file = path.resolve(process.cwd(), args[i + 1]);
      i += 1;
    }
  }

  return out;
}

function readContent(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Company content file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Company content JSON is invalid.");
  }

  return parsed;
}

async function upsertSiteSettings(supabase, siteSettings) {
  const rows = [];

  if (siteSettings?.general && typeof siteSettings.general === "object") {
    rows.push({ key: "general", value_json: siteSettings.general });
  }

  if (siteSettings?.contact && typeof siteSettings.contact === "object") {
    rows.push({ key: "contact", value_json: siteSettings.contact });
  }

  if (rows.length === 0) {
    return 0;
  }

  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
  if (error) {
    throw new Error(`Failed to upsert site settings: ${error.message}`);
  }

  return rows.length;
}

async function upsertPortfolio(supabase, portfolioProjects) {
  if (!Array.isArray(portfolioProjects) || portfolioProjects.length === 0) {
    return { projects: 0, images: 0 };
  }

  let totalImages = 0;

  for (const project of portfolioProjects) {
    const row = {
      slug: project.slug,
      title_ar: project.titleAr,
      title_en: project.titleEn,
      category: project.category,
      summary_ar: project.summaryAr,
      summary_en: project.summaryEn,
      location: project.location ?? null,
      completion_year: Number.isFinite(project.completionYear) ? project.completionYear : null,
      featured: Boolean(project.featured),
      published: project.published !== false,
    };

    const { error: upsertError } = await supabase.from("portfolio_projects").upsert(row, { onConflict: "slug" });
    if (upsertError) {
      throw new Error(`Failed to upsert portfolio project (${project.slug}): ${upsertError.message}`);
    }

    const { data: projectRow, error: projectError } = await supabase
      .from("portfolio_projects")
      .select("id")
      .eq("slug", project.slug)
      .single();

    if (projectError || !projectRow) {
      throw new Error(`Failed to load portfolio project id (${project.slug}).`);
    }

    const { error: clearImagesError } = await supabase
      .from("portfolio_images")
      .delete()
      .eq("portfolio_project_id", projectRow.id);

    if (clearImagesError) {
      throw new Error(`Failed to clear old images for (${project.slug}): ${clearImagesError.message}`);
    }

    if (Array.isArray(project.images) && project.images.length > 0) {
      const imageRows = project.images.map((image, index) => ({
        portfolio_project_id: projectRow.id,
        file_path: image.url,
        alt_ar: image.altAr ?? null,
        alt_en: image.altEn ?? null,
        sort_order: Number.isFinite(image.sortOrder) ? image.sortOrder : index + 1,
        is_before: Boolean(image.isBefore),
        is_after: Boolean(image.isAfter),
      }));

      const { error: insertImagesError } = await supabase.from("portfolio_images").insert(imageRows);
      if (insertImagesError) {
        throw new Error(`Failed to insert images for (${project.slug}): ${insertImagesError.message}`);
      }

      totalImages += imageRows.length;
    }
  }

  return { projects: portfolioProjects.length, images: totalImages };
}

async function upsertTechnicalLibrary(supabase, entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return 0;
  }

  const rows = entries.map((entry) => ({
    entry_type: entry.entryType,
    slug: entry.slug,
    title_ar: entry.titleAr,
    title_en: entry.titleEn,
    summary_ar: entry.summaryAr,
    summary_en: entry.summaryEn,
    specs_json: entry.specs ?? {},
    download_file_path: entry.downloadFilePath ?? null,
    published: entry.published !== false,
  }));

  const { error } = await supabase.from("technical_library_entries").upsert(rows, { onConflict: "slug" });
  if (error) {
    throw new Error(`Failed to upsert technical library entries: ${error.message}`);
  }

  return rows.length;
}

async function main() {
  const args = parseArgs();
  const env = resolveEnv();
  assertRequiredEnv(env);

  const content = readContent(args.file);
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const settingsCount = await upsertSiteSettings(supabase, content.siteSettings);
  const portfolioResult = await upsertPortfolio(supabase, content.portfolioProjects);
  const technicalCount = await upsertTechnicalLibrary(supabase, content.technicalLibraryEntries);

  console.log("Company content import completed successfully.");
  console.log(JSON.stringify({
    file: args.file,
    siteSettings: settingsCount,
    portfolioProjects: portfolioResult.projects,
    portfolioImages: portfolioResult.images,
    technicalLibraryEntries: technicalCount,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
