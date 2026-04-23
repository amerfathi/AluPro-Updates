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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withSchemaCacheRetry(operation, label) {
  const maxAttempts = 6;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await operation();
      if (result && typeof result === "object" && "error" in result && result.error) {
        throw new Error(result.error.message);
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isSchemaCacheIssue = message.toLowerCase().includes("schema cache");

      if (!isSchemaCacheIssue || attempt === maxAttempts) {
        throw error;
      }

      const waitMs = 800 * attempt;
      console.warn(`${label}: schema cache not ready, retrying in ${waitMs}ms (attempt ${attempt}/${maxAttempts})`);
      await sleep(waitMs);
    }
  }

  throw new Error(`${label}: exhausted retries.`);
}

async function assertTableExists(supabase, tableName) {
  const { error } = await withSchemaCacheRetry(
    () => supabase.from(tableName).select("*", { head: true, count: "exact" }),
    `Table check ${tableName}`,
  );
  if (error) {
    throw new Error(`Table check failed for "${tableName}": ${error.message}`);
  }
  console.log(`Table ok: ${tableName}`);
}

async function ensureBuckets(supabase, env) {
  const wanted = [
    { name: env.SUPABASE_BUCKET_LEADS || "lead-attachments", isPublic: false },
    { name: env.SUPABASE_BUCKET_FIELD_VISITS || "field-visit-attachments", isPublic: false },
    { name: env.SUPABASE_BUCKET_PROJECT_DOCS || "project-documents", isPublic: false },
    { name: env.SUPABASE_BUCKET_MAINTENANCE || "maintenance-uploads", isPublic: false },
    { name: env.SUPABASE_BUCKET_PORTFOLIO || "portfolio-images", isPublic: true },
    { name: env.SUPABASE_BUCKET_TECHNICAL || "technical-library-files", isPublic: true },
    { name: env.SUPABASE_BUCKET_PROPOSALS || "proposal-pdfs", isPublic: false },
  ];

  const { data: buckets, error: listError } = await withSchemaCacheRetry(
    () => supabase.storage.listBuckets(),
    "listBuckets",
  );
  if (listError) {
    throw new Error(`Storage listBuckets failed: ${listError.message}`);
  }

  const existing = new Set((buckets ?? []).map((bucket) => bucket.name));
  for (const bucket of wanted) {
    if (existing.has(bucket.name)) {
      console.log(`Bucket ok: ${bucket.name}`);
      continue;
    }

    const { error: createError } = await withSchemaCacheRetry(
      () =>
        supabase.storage.createBucket(bucket.name, {
          public: bucket.isPublic,
        }),
      `createBucket ${bucket.name}`,
    );

    if (createError) {
      throw new Error(`Failed to create bucket "${bucket.name}": ${createError.message}`);
    }

    console.log(`Bucket created: ${bucket.name}`);
  }
}

async function validateSeedData(supabase) {
  const { count: portfolioCount, error: portfolioError } = await withSchemaCacheRetry(
    () => supabase.from("portfolio_projects").select("*", { head: true, count: "exact" }),
    "Seed check portfolio_projects",
  );

  if (portfolioError) {
    throw new Error(`Portfolio seed validation failed: ${portfolioError.message}`);
  }

  const { count: technicalCount, error: technicalError } = await withSchemaCacheRetry(
    () => supabase.from("technical_library_entries").select("*", { head: true, count: "exact" }),
    "Seed check technical_library_entries",
  );

  if (technicalError) {
    throw new Error(`Technical library seed validation failed: ${technicalError.message}`);
  }

  const { count: settingsCount, error: settingsCountError } = await withSchemaCacheRetry(
    () => supabase.from("site_settings").select("*", { head: true, count: "exact" }),
    "Seed check site_settings",
  );

  if (settingsCountError) {
    throw new Error(`Site settings seed validation failed: ${settingsCountError.message}`);
  }

  console.log(`Seed check: portfolio_projects=${portfolioCount ?? 0}`);
  console.log(`Seed check: technical_library_entries=${technicalCount ?? 0}`);
  console.log(`Seed check: site_settings rows=${settingsCount ?? 0}`);
}

async function verifyAutoProfileCreation(supabase) {
  const stamp = Date.now();
  const email = `codex.profile.test.${stamp}@example.com`;
  const password = `UF_Test_${stamp}!`;
  let createdUserId = null;

  try {
    const { data: created, error: createError } = await withSchemaCacheRetry(
      () =>
        supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: "Codex Trigger Test",
            preferred_language: "ar",
          },
        }),
      "Auth createUser",
    );

    if (createError || !created?.user?.id) {
      throw new Error(`Auth signup test failed: ${createError?.message ?? "No user id returned"}`);
    }

    createdUserId = created.user.id;
    console.log(`Auth user created: ${createdUserId}`);

    const { data: profile, error: profileError } = await withSchemaCacheRetry(
      () =>
        supabase
          .from("profiles")
          .select("id, auth_user_id, email, full_name, role, preferred_language")
          .eq("auth_user_id", createdUserId)
          .maybeSingle(),
      "Profile lookup after signup",
    );

    if (profileError) {
      throw new Error(`Profile lookup failed: ${profileError.message}`);
    }

    if (!profile) {
      throw new Error("Profile trigger test failed: no profile row was created automatically.");
    }

    console.log("Auto profile trigger: OK");
    console.log(
      `Created profile role=${profile.role}, preferred_language=${profile.preferred_language}, email=${profile.email}`,
    );
  } finally {
    if (createdUserId) {
      const { error: profileDeleteError } = await withSchemaCacheRetry(
        () => supabase.from("profiles").delete().eq("auth_user_id", createdUserId),
        "Test profile cleanup",
      );
      if (profileDeleteError) {
        console.warn(`Warning: failed to delete test profile: ${profileDeleteError.message}`);
      }

      const { error: userDeleteError } = await withSchemaCacheRetry(
        () => supabase.auth.admin.deleteUser(createdUserId),
        "Test auth user cleanup",
      );
      if (userDeleteError) {
        console.warn(`Warning: failed to delete test auth user: ${userDeleteError.message}`);
      } else {
        console.log("Test auth user cleaned up.");
      }
    }
  }
}

async function main() {
  const env = resolveEnv();
  assertRequiredEnv(env);

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 1) Validate core schema (migration presence proxy)
  await assertTableExists(supabase, "profiles");
  await assertTableExists(supabase, "leads");
  await assertTableExists(supabase, "projects");
  await assertTableExists(supabase, "project_stages");
  await assertTableExists(supabase, "portfolio_projects");
  await assertTableExists(supabase, "technical_library_entries");
  await assertTableExists(supabase, "site_settings");

  // 2) Ensure buckets exist
  await ensureBuckets(supabase, env);

  // 3) Validate seeded entities
  await validateSeedData(supabase);

  // 4) Verify automatic profile creation trigger
  await verifyAutoProfileCreation(supabase);

  console.log("Live Supabase integration check completed successfully.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
