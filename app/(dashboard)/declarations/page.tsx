import { createServerClient } from "@/lib/supabase/server";
import { DeclarationsManager } from "@/components/rh/DeclarationsManager";
import { redirect } from "next/navigation";

export const metadata = { title: "Déclarations & Conformité — RH Manager CI" };
export const dynamic = "force-dynamic";

export default async function DeclarationsPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: socialDecls }, { data: taxDecls }, { data: bulletinPeriods }] = await Promise.all([
    supabase
      .from("social_declarations")
      .select("id, kind, periode, statut, deadline, date_soumission, numero_recepisse, total_brut, total_cotisations, nb_salaries, penalite_calculee")
      .order("deadline", { ascending: false })
      .limit(50),
    supabase
      .from("tax_declarations")
      .select("id, kind, periode, statut, deadline, date_soumission, numero_recepisse, total_assiette, total_retenu, nb_salaries, penalite_calculee")
      .order("deadline", { ascending: false })
      .limit(50),
    supabase
      .from("bulletins_paie")
      .select("periode")
      .order("periode", { ascending: false }),
  ]);

  const periods = Array.from(new Set((bulletinPeriods ?? []).map((b) => b.periode))).sort().reverse();

  return (
    <div className="p-3 sm:p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      <DeclarationsManager
        socialDeclarations={socialDecls ?? []}
        taxDeclarations={taxDecls ?? []}
        availablePeriods={periods}
      />
    </div>
  );
}
