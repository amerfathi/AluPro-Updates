import { randomUUID } from "crypto";

import { getSupabaseServiceClient } from "@/lib/supabase/admin";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const allowedTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/dwg",
]);

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-");
}

export function validateUploadFile(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File exceeds 10MB limit.");
  }

  if (!allowedTypes.has(file.type)) {
    throw new Error("Unsupported file type.");
  }
}

export async function uploadFileToBucket(file: File, bucketName: string, folder: string) {
  validateUploadFile(file);

  const supabase = getSupabaseServiceClient();
  const fileName = `${Date.now()}-${randomUUID()}-${sanitizeFileName(file.name)}`;
  const filePath = `${folder}/${fileName}`;

  if (!supabase) {
    return {
      filePath: `mock/${bucketName}/${filePath}`,
      publicUrl: null,
    };
  }

  const bytes = await file.arrayBuffer();
  const { error } = await supabase.storage.from(bucketName).upload(filePath, bytes, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

  return {
    filePath,
    publicUrl: data.publicUrl,
  };
}


