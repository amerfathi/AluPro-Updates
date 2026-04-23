import { demoPortfolio, demoPortalProjects, demoTechnicalLibrary } from "@/lib/services/demo-data";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SiteContactSettings = {
  city: string;
  country: string;
  addressAr: string;
  addressEn: string;
  phone: string;
  whatsapp: string;
  email: string;
  workingHoursAr: string;
  workingHoursEn: string;
  mapLabelAr: string;
  mapLabelEn: string;
};

const fallbackContactSettings: SiteContactSettings = {
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
};

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

export async function getSiteContactSettings(): Promise<SiteContactSettings> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return fallbackContactSettings;
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("value_json")
    .eq("key", "contact")
    .maybeSingle();

  if (error || !data?.value_json || typeof data.value_json !== "object") {
    return fallbackContactSettings;
  }

  const json = data.value_json as Record<string, unknown>;

  return {
    city: asString(json.city, fallbackContactSettings.city),
    country: asString(json.country, fallbackContactSettings.country),
    addressAr: asString(json.addressAr, fallbackContactSettings.addressAr),
    addressEn: asString(json.addressEn, fallbackContactSettings.addressEn),
    phone: asString(json.phone, fallbackContactSettings.phone),
    whatsapp: asString(json.whatsapp, fallbackContactSettings.whatsapp),
    email: asString(json.email, fallbackContactSettings.email),
    workingHoursAr: asString(json.workingHoursAr, fallbackContactSettings.workingHoursAr),
    workingHoursEn: asString(json.workingHoursEn, fallbackContactSettings.workingHoursEn),
    mapLabelAr: asString(json.mapLabelAr, fallbackContactSettings.mapLabelAr),
    mapLabelEn: asString(json.mapLabelEn, fallbackContactSettings.mapLabelEn),
  };
}

export async function getPortfolioProjects() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return demoPortfolio;
  }

  const { data, error } = await supabase
    .from("portfolio_projects")
    .select("*, portfolio_images(*)")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return demoPortfolio;
  }

  return data.map((project) => ({
    id: project.id,
    slug: project.slug,
    titleAr: project.title_ar,
    titleEn: project.title_en,
    category: project.category,
    summaryAr: project.summary_ar,
    summaryEn: project.summary_en,
    location: project.location ?? "",
    completionYear: project.completion_year ?? 0,
    featured: project.featured,
    images: (project as { portfolio_images: Array<Record<string, unknown>> }).portfolio_images.map((image) => ({
      url: String(image.file_path),
      altAr: String(image.alt_ar ?? ""),
      altEn: String(image.alt_en ?? ""),
      isBefore: Boolean(image.is_before),
      isAfter: Boolean(image.is_after),
    })),
  }));
}

export async function getPortfolioProjectBySlug(slug: string) {
  const projects = await getPortfolioProjects();
  return projects.find((project) => project.slug === slug) ?? null;
}

export async function getTechnicalEntries(entryType?: "profiles" | "glass" | "finishes") {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return entryType ? demoTechnicalLibrary.filter((entry) => entry.entryType === entryType) : demoTechnicalLibrary;
  }

  let query = supabase
    .from("technical_library_entries")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (entryType) {
    query = query.eq("entry_type", entryType);
  }

  const { data, error } = await query;

  if (error || !data) {
    return entryType ? demoTechnicalLibrary.filter((entry) => entry.entryType === entryType) : demoTechnicalLibrary;
  }

  return data.map((entry) => ({
    id: entry.id,
    entryType: entry.entry_type,
    slug: entry.slug,
    titleAr: entry.title_ar,
    titleEn: entry.title_en,
    summaryAr: entry.summary_ar,
    summaryEn: entry.summary_en,
    specs: typeof entry.specs_json === "object" && entry.specs_json !== null ? (entry.specs_json as Record<string, string>) : {},
  }));
}

export async function getPortalProjectsForCurrentUser() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return demoPortalProjects;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: profile } = await supabase.from("profiles").select("id, role").eq("auth_user_id", user.id).maybeSingle();

  if (!profile) {
    return demoPortalProjects;
  }

  if (profile.role !== "client") {
    return demoPortalProjects;
  }

  const { data: client } = await supabase.from("clients").select("id").eq("profile_id", profile.id).maybeSingle();

  if (!client) {
    return [];
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, project_name, location_city, overall_progress, status, expected_completion_date")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  if (!projects || projects.length === 0) {
    return demoPortalProjects;
  }

  return projects.map((project) => ({
    id: project.id,
    name: project.project_name,
    clientName: "Client",
    city: project.location_city ?? "",
    progress: project.overall_progress,
    status: project.status,
    expectedCompletion: project.expected_completion_date ?? "",
    stages: [],
  }));
}

export async function getPortalProjectById(projectId: string) {
  const projects = await getPortalProjectsForCurrentUser();
  return projects.find((project) => project.id === projectId) ?? null;
}


