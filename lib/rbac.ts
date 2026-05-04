import { createServerClient } from "@/lib/supabase/server";

export type Module =
  | "employes" | "paie" | "conges" | "evaluations"
  | "contentieux" | "declarations" | "ged" | "analytique"
  | "recrutement" | "formation" | "qhse" | "duerp";

export type Permission = "read" | "write" | "delete" | "export";

const ADMIN_ROLES = ["admin", "responsable_rh"];

export async function checkPermission(module: Module, permission: Permission): Promise<boolean> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  if (!profile) return false;
  if (ADMIN_ROLES.includes(profile.role ?? "")) return true;

  const { data: perm } = await supabase
    .from("role_permissions")
    .select(`can_read, can_write, can_delete, can_export`)
    .eq("company_id", profile.company_id)
    .eq("role", profile.role ?? "")
    .eq("module", module)
    .single();

  if (!perm) return false;
  const key = `can_${permission}` as keyof typeof perm;
  return perm[key] === true;
}
