import { createServerClient } from "@/lib/supabase/server";
import { ParametresForm } from "@/components/rh/ParametresForm";

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
    <div className="p-6 md:p-8 space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[oklch(0.175_0.04_248)] shadow-sm">
          <svg className="h-5 w-5 text-[oklch(0.78_0.13_73)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Paramètres</h1>
          <p className="text-sm text-slate-400">Profil utilisateur et configuration entreprise</p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="max-w-2xl">
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
    </div>
  );
}
