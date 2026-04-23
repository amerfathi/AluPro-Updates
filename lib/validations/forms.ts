import { z } from "zod";

export const serviceTypeValues = ["aluminum", "steel", "glass", "mixed"] as const;
export const projectTypeValues = ["residential", "commercial", "industrial", "hospitality", "other"] as const;

export const quoteRequestSchema = z.object({
  fullName: z.string().min(3),
  phone: z.string().min(7),
  email: z.string().email(),
  projectType: z.enum(projectTypeValues),
  serviceType: z.enum(serviceTypeValues),
  city: z.string().min(2),
  location: z.string().min(2),
  measurements: z.string().min(2),
  notes: z.string().optional(),
  preferredContactMethod: z.enum(["phone", "whatsapp", "email"]),
});

export const fieldVisitSchema = z.object({
  fullName: z.string().min(3),
  phone: z.string().min(7),
  email: z.string().email(),
  serviceType: z.enum(serviceTypeValues),
  city: z.string().min(2),
  location: z.string().min(2),
  preferredDateRange: z.string().min(3),
  notes: z.string().optional(),
});

export const contactSchema = z.object({
  fullName: z.string().min(3),
  phone: z.string().min(7),
  email: z.string().email(),
  subject: z.string().min(3),
  message: z.string().min(5),
});

export const maintenanceSchema = z.object({
  fullName: z.string().min(3),
  phone: z.string().min(7),
  email: z.string().email(),
  projectReference: z.string().optional(),
  issueType: z.string().min(2),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  description: z.string().min(5),
  preferredContactMethod: z.enum(["phone", "whatsapp", "email"]),
});

export const estimatorSchema = z.object({
  projectName: z.string().min(2),
  clientName: z.string().min(2),
  areaM2: z.coerce.number().positive(),
  systemType: z.enum(serviceTypeValues),
  materialCostPerM2: z.coerce.number().min(0),
  laborCostPerM2: z.coerce.number().min(0),
  accessoriesCost: z.coerce.number().min(0),
  overheadCost: z.coerce.number().min(0),
  marginPercent: z.coerce.number().min(0).max(100),
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
export type FieldVisitInput = z.infer<typeof fieldVisitSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type MaintenanceInput = z.infer<typeof maintenanceSchema>;
export type EstimatorInput = z.infer<typeof estimatorSchema>;


