export type ServiceType = "aluminum" | "steel" | "glass" | "mixed";
export type ProjectCategory = "Residential" | "Commercial" | "Industrial";

export type PortfolioProject = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  category: ProjectCategory;
  summaryAr: string;
  summaryEn: string;
  location: string;
  completionYear: number;
  featured: boolean;
  images: {
    url: string;
    altAr: string;
    altEn: string;
    isBefore?: boolean;
    isAfter?: boolean;
  }[];
};

export type TechnicalLibraryEntry = {
  id: string;
  entryType: "profiles" | "glass" | "finishes";
  slug: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  specs: Record<string, string>;
};

export type PipelineStage = {
  key: string;
  titleAr: string;
  titleEn: string;
  status: "pending" | "in_progress" | "completed";
  progressPercent: number;
  notes: string;
  updatedAt: string;
};

export type PortalProject = {
  id: string;
  name: string;
  clientName: string;
  city: string;
  progress: number;
  status: string;
  expectedCompletion: string;
  stages: PipelineStage[];
};

export type QuoteLine = {
  itemName: string;
  itemDescription: string;
  quantity: number;
  unit: string;
  unitPrice: number;
};

