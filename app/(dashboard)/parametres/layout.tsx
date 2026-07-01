import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

// Restriction de la zone Administration (Paramètres) aux rôles admin /
// responsable RH — reprise de la règle auparavant portée par le middleware
// (désormais Edge-safe et sans requête de rôle).
export default async function ParametresLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!["admin", "responsable_rh"].includes(profile?.role ?? "")) {
    redirect("/rh");
  }

  return <>{children}</>;
}
