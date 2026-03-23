import { createClientSupabase } from "./client";

export async function uploadDocument(
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  const supabase = createClientSupabase();
  const { data, error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw new Error(`Upload échoué : ${error.message}`);
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}

export function buildStoragePath(
  companyId: string,
  employeeId: string,
  famille: string,
  filename: string
): string {
  return `documents/${companyId}/${employeeId}/${famille}/${Date.now()}_${filename}`;
}
