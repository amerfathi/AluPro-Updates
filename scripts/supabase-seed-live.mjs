import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const LEGACY_PORTFOLIO_SLUGS = [
  "riyadh-villa-thermal-series",
  "industrial-plant-steel-gates",
  "commercial-tower-curtain-wall",
];

const LEGACY_TECHNICAL_SLUGS = ["uf-75-thermal", "double-glazed-low-e", "powder-coated-matte-black"];

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withSchemaCacheRetry(operation, label) {
  const maxAttempts = 8;

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

      const waitMs = 900 * attempt;
      console.warn(`${label}: schema cache not ready, retrying in ${waitMs}ms (attempt ${attempt}/${maxAttempts})`);
      await sleep(waitMs);
    }
  }

  throw new Error(`${label}: exhausted retries.`);
}

async function cleanupLegacyDemoContent(supabase) {
  const { data: legacyProjects, error: legacyProjectsError } = await withSchemaCacheRetry(
    () => supabase.from("portfolio_projects").select("id").in("slug", LEGACY_PORTFOLIO_SLUGS),
    "load legacy portfolio projects",
  );
  if (legacyProjectsError) {
    throw new Error(`Failed to load legacy portfolio projects: ${legacyProjectsError.message}`);
  }

  const legacyProjectIds = (legacyProjects ?? [])
    .map((project) => project?.id)
    .filter((value) => typeof value === "string");

  if (legacyProjectIds.length > 0) {
    const { error: deleteLegacyImagesError } = await withSchemaCacheRetry(
      () => supabase.from("portfolio_images").delete().in("portfolio_project_id", legacyProjectIds),
      "delete legacy portfolio images",
    );
    if (deleteLegacyImagesError) {
      throw new Error(`Failed to delete legacy portfolio images: ${deleteLegacyImagesError.message}`);
    }
  }

  const { error: deleteLegacyProjectsError } = await withSchemaCacheRetry(
    () => supabase.from("portfolio_projects").delete().in("slug", LEGACY_PORTFOLIO_SLUGS),
    "delete legacy portfolio projects",
  );
  if (deleteLegacyProjectsError) {
    throw new Error(`Failed to delete legacy portfolio projects: ${deleteLegacyProjectsError.message}`);
  }

  const { error: deleteLegacyTechnicalError } = await withSchemaCacheRetry(
    () => supabase.from("technical_library_entries").delete().in("slug", LEGACY_TECHNICAL_SLUGS),
    "delete legacy technical entries",
  );
  if (deleteLegacyTechnicalError) {
    throw new Error(`Failed to delete legacy technical entries: ${deleteLegacyTechnicalError.message}`);
  }

  console.log("Cleaned: legacy demo content");
}

async function upsertPortfolioProjects(supabase) {
  const rows = [
    {
      slug: "elite-business-park-facade-riyadh",
      title_ar: "واجهة مجمع النخبة للأعمال - الرياض",
      title_en: "Elite Business Park Facade - Riyadh",
      category: "Commercial",
      summary_ar: "تنفيذ واجهات ألمنيوم وزجاج عالية الأداء لمجمع أعمال متعدد المباني مع متطلبات عزل حراري وصوتي دقيقة.",
      summary_en: "Execution of high-performance aluminum and glass facades for a multi-building business park with strict thermal and acoustic targets.",
      location: "Riyadh",
      completion_year: 2025,
      featured: true,
      published: true,
    },
    {
      slug: "logistics-hub-steel-gates-dammam",
      title_ar: "بوابات المجمع اللوجستي - الدمام",
      title_en: "Logistics Hub Steel Gates - Dammam",
      category: "Industrial",
      summary_ar: "تصنيع وتركيب بوابات حديدية ثقيلة وأنظمة حماية محيطية لمجمع لوجستي يعمل بنظام تشغيل عالي الكثافة.",
      summary_en: "Fabrication and installation of heavy-duty steel gates and perimeter protection systems for a high-throughput logistics hub.",
      location: "Dammam",
      completion_year: 2024,
      featured: true,
      published: true,
    },
    {
      slug: "private-villa-thermal-systems-jeddah",
      title_ar: "فيلا خاصة بأنظمة حرارية - جدة",
      title_en: "Private Villa Thermal Systems - Jeddah",
      category: "Residential",
      summary_ar: "توريد وتركيب نوافذ وأبواب ألمنيوم حرارية بزجاج مزدوج مع تفاصيل تنفيذ تحافظ على الهوية المعمارية للمشروع.",
      summary_en: "Supply and installation of thermal aluminum windows and doors with double glazing while preserving the project’s architectural identity.",
      location: "Jeddah",
      completion_year: 2026,
      featured: true,
      published: true,
    },
  ];

  const { error } = await withSchemaCacheRetry(
    () => supabase.from("portfolio_projects").upsert(rows, { onConflict: "slug" }),
    "seed portfolio_projects",
  );
  if (error) {
    throw new Error(`Failed to seed portfolio_projects: ${error.message}`);
  }
  console.log("Seeded: portfolio_projects");
}

async function upsertTechnicalLibrary(supabase) {
  const rows = [
    {
      entry_type: "profiles",
      slug: "uf-90-thermal-hi",
      title_ar: "UF-90 نظام حراري عالي العزل",
      title_en: "UF-90 High Insulation Thermal System",
      summary_ar: "نظام واجهات ونوافذ للمشاريع التي تتطلب كفاءة طاقة أعلى ومقاومة مناخية قوية.",
      summary_en: "Facade and window system for projects requiring elevated energy efficiency and weather resistance.",
      specs_json: { Depth: "90 mm", Glazing: "28-52 mm", "Air Tightness": "Class 4", "Water Tightness": "E1200" },
      published: true,
    },
    {
      entry_type: "glass",
      slug: "triple-silver-low-e-laminated",
      title_ar: "زجاج Low-E ثلاثي الفضة مع طبقة أمان",
      title_en: "Triple Silver Low-E Laminated Glass",
      summary_ar: "خيار متقدم لتقليل الكسب الحراري الشمسي ورفع الأمان الصوتي والإنشائي.",
      summary_en: "Advanced option to reduce solar heat gain and improve acoustic and safety performance.",
      specs_json: { Thickness: "8+16+8 mm", "U-Value": "1.2 W/m²K", SHGC: "0.28", Acoustic: "40 dB" },
      published: true,
    },
    {
      entry_type: "finishes",
      slug: "marine-grade-powder-coat",
      title_ar: "دهان بودرة بدرجة حماية بحرية",
      title_en: "Marine Grade Powder Coating",
      summary_ar: "تشطيب معدني مخصص للبيئات الرطبة والساحلية مع مقاومة تآكل طويلة الأمد.",
      summary_en: "Metal finish engineered for humid and coastal environments with long-term corrosion resistance.",
      specs_json: { Coating: "80-100 µm", Standard: "Qualicoat Seaside", "Salt Spray": "1500h" },
      published: true,
    },
  ];

  const { error } = await withSchemaCacheRetry(
    () => supabase.from("technical_library_entries").upsert(rows, { onConflict: "slug" }),
    "seed technical_library_entries",
  );
  if (error) {
    throw new Error(`Failed to seed technical_library_entries: ${error.message}`);
  }
  console.log("Seeded: technical_library_entries");
}

async function upsertSiteSettings(supabase) {
  const rows = [
    {
      key: "general",
      value_json: {
        brand: "Ultra Frame",
        defaultLanguage: "ar",
        secondaryLanguage: "en",
        taglineAr: "حلول هندسية دقيقة في الألمنيوم والحديد والزجاج",
        taglineEn: "Precision engineering solutions in aluminum, steel, and glass",
      },
    },
    {
      key: "contact",
      value_json: {
        city: "Riyadh",
        country: "Saudi Arabia",
        addressAr: "الرياض، المملكة العربية السعودية",
        addressEn: "Riyadh, Saudi Arabia",
        phone: "+966 55 000 0000",
        whatsapp: "+966 55 000 0000",
        email: "hello@ultraframe.sa",
        workingHoursAr: "الأحد - الخميس، 8:00 ص - 6:00 م",
        workingHoursEn: "Sun - Thu, 8:00 AM - 6:00 PM",
        mapLabelAr: "موقع الشركة على الخريطة",
        mapLabelEn: "Company location on map",
      },
    },
  ];

  const { error } = await withSchemaCacheRetry(
    () => supabase.from("site_settings").upsert(rows, { onConflict: "key" }),
    "seed site_settings",
  );
  if (error) {
    throw new Error(`Failed to seed site_settings: ${error.message}`);
  }
  console.log("Seeded: site_settings");
}

async function main() {
  const env = resolveEnv();
  assertRequiredEnv(env);

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await cleanupLegacyDemoContent(supabase);
  await upsertPortfolioProjects(supabase);
  await upsertTechnicalLibrary(supabase);
  await upsertSiteSettings(supabase);

  console.log("Live seed completed successfully.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
