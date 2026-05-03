import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface PortailContext {
  userId: string;
  employeeId: string;
  companyId: string;
}

/**
 * Vérifie qu'un utilisateur authentifié a un rôle 'salarie' avec un
 * employee_id rattaché. À appeler en début de chaque route portail.
 */
export async function requirePortailContext(): Promise<PortailContext> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, employee_id, company_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "salarie" || !profile.employee_id) {
    // Si pas de rôle salarié ou pas de fiche liée, retour vers /login
    redirect("/login");
  }

  return {
    userId: user.id,
    employeeId: profile.employee_id,
    companyId: profile.company_id,
  };
}
