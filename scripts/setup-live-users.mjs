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

async function findUserByEmail(adminClient, email) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`listUsers failed: ${error.message}`);
    }

    const users = data?.users ?? [];
    const found = users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) {
      return found;
    }

    if (users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function ensureAuthUser(adminClient, account) {
  const existing = await findUserByEmail(adminClient, account.email);

  if (existing) {
    const { data, error } = await adminClient.auth.admin.updateUserById(existing.id, {
      password: account.password,
      user_metadata: {
        full_name: account.fullName,
        preferred_language: account.preferredLanguage,
      },
      email_confirm: true,
    });

    if (error || !data.user) {
      throw new Error(`Failed to update user ${account.email}: ${error?.message ?? "Unknown error"}`);
    }

    return data.user;
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: {
      full_name: account.fullName,
      preferred_language: account.preferredLanguage,
    },
  });

  if (error || !data.user) {
    throw new Error(`Failed to create user ${account.email}: ${error?.message ?? "Unknown error"}`);
  }

  return data.user;
}

async function ensureProfile(adminClient, user, account) {
  const { data: existingProfile, error: existingProfileError } = await adminClient
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (existingProfileError) {
    throw new Error(`Failed to fetch profile for ${account.email}: ${existingProfileError.message}`);
  }

  if (!existingProfile) {
    const { data: insertedProfile, error: insertError } = await adminClient
      .from("profiles")
      .insert({
        auth_user_id: user.id,
        full_name: account.fullName,
        email: account.email,
        role: account.role,
        preferred_language: account.preferredLanguage,
      })
      .select("*")
      .single();

    if (insertError || !insertedProfile) {
      throw new Error(`Failed to insert profile for ${account.email}: ${insertError?.message ?? "Unknown error"}`);
    }

    return insertedProfile;
  }

  const { data: updatedProfile, error: updateError } = await adminClient
    .from("profiles")
    .update({
      full_name: account.fullName,
      email: account.email,
      role: account.role,
      preferred_language: account.preferredLanguage,
    })
    .eq("id", existingProfile.id)
    .select("*")
    .single();

  if (updateError || !updatedProfile) {
    throw new Error(`Failed to update profile for ${account.email}: ${updateError?.message ?? "Unknown error"}`);
  }

  return updatedProfile;
}

async function ensureClientRecord(adminClient, profileId) {
  const { data: existingClient, error: existingClientError } = await adminClient
    .from("clients")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (existingClientError) {
    throw new Error(`Failed to fetch client record: ${existingClientError.message}`);
  }

  if (existingClient) {
    return existingClient.id;
  }

  const { data: insertedClient, error: insertClientError } = await adminClient
    .from("clients")
    .insert({
      profile_id: profileId,
      company_name: "Ultra Frame Demo Client",
      billing_notes: "Auto-created by setup script",
    })
    .select("id")
    .single();

  if (insertClientError || !insertedClient) {
    throw new Error(`Failed to create client record: ${insertClientError?.message ?? "Unknown error"}`);
  }

  return insertedClient.id;
}

async function verifyLogin(url, anonKey, email, password) {
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    throw new Error(`Login verification failed for ${email}: ${error?.message ?? "No session returned"}`);
  }

  await client.auth.signOut();
}

async function main() {
  const env = resolveEnv();
  assertEnv(env);

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  const adminClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const accounts = [
    {
      key: "admin",
      email: "admin@ultraframe.sa",
      password: "UltraFrame@2026Admin!",
      fullName: "Ultra Frame Admin",
      preferredLanguage: "ar",
      role: "admin",
    },
    {
      key: "client",
      email: "client@ultraframe.sa",
      password: "UltraFrame@2026Client!",
      fullName: "Ultra Frame Client",
      preferredLanguage: "ar",
      role: "client",
    },
  ];

  const results = [];

  for (const account of accounts) {
    const user = await ensureAuthUser(adminClient, account);
    const profile = await ensureProfile(adminClient, user, account);

    let clientId = null;
    if (account.role === "client") {
      clientId = await ensureClientRecord(adminClient, profile.id);
    }

    await verifyLogin(url, anonKey, account.email, account.password);

    results.push({
      key: account.key,
      email: account.email,
      password: account.password,
      role: profile.role,
      authUserId: user.id,
      profileId: profile.id,
      clientId,
    });
  }

  console.log("Live users setup completed successfully.");
  for (const result of results) {
    console.log(
      JSON.stringify(
        {
          account: result.key,
          email: result.email,
          password: result.password,
          role: result.role,
          authUserId: result.authUserId,
          profileId: result.profileId,
          clientId: result.clientId,
        },
        null,
        2,
      ),
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
