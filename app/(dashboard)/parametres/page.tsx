import { createServerClient } from "@/lib/supabase/server";
import { ParametresForm } from "@/components/rh/ParametresForm";
import { Settings } from "lucide-react";

export const metadata = { title: "Paramètres — RH Manager CI" };

export default async function ParametresPage() {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: companyId }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, role")
      .eq("id", user!.id)
      .single(),
    supabase.rpc("get_user_company_id"),
  ]);

  const { data: company } = companyId
    ? await supabase
        .from("companies")
        .select("name, convention_collective, raison_sociale, adresse, cnps_matricule, nccm, ncc")
        .eq("id", companyId as string)
        .single()
    : { data: null };

  const { data: fiscalParams } = companyId
    ? await supabase
        .from("fiscal_params")
        .select("convention, valeur_point")
        .eq("company_id", companyId as string)
        .maybeSingle()
    : { data: null };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold">Paramètres</h1>
          <p className="text-sm text-muted-foreground">
            Profil utilisateur et configuration entreprise
          </p>
        </div>
      </div>

      <ParametresForm
        profile={{
          full_name: profile?.full_name ?? "",
          email: profile?.email ?? user!.email ?? "",
          role: profile?.role ?? "",
        }}
        company={{
          name: company?.name ?? "",
          convention_collective: company?.convention_collective ?? "",
          raison_sociale: company?.raison_sociale ?? null,
          adresse: company?.adresse ?? null,
          cnps_matricule: company?.cnps_matricule ?? null,
          nccm: company?.nccm ?? null,
          ncc: company?.ncc ?? null,
        }}
        fiscalParams={{
          convention: (fiscalParams?.convention ?? "CCI") as
            | "CCI"
            | "Commerce"
            | "BTP"
            | "Banque & Assurance"
            | "Transport"
            | "Industrie"
            | "Agriculture",
          valeur_point: fiscalParams?.valeur_point ?? 0,
        }}
      />
    </div>
  );
}
