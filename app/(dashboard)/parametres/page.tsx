import { createServerClient } from "@/lib/supabase/server";
import { ParametresForm } from "@/components/rh/ParametresForm";
import { BrandingForm } from "@/components/rh/BrandingForm";

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
        .select("name, convention_collective, raison_sociale, adresse, cnps_matricule, nccm, ncc, taux_at_mp, adresse_paie, contact_paie, code_naf, logo_url, couleur_primaire, couleur_secondaire")
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
          <p className="text-sm text-slate-600">Profil utilisateur et configuration entreprise</p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="max-w-2xl grid gap-6">
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
            taux_at_mp: company?.taux_at_mp ?? null,
            adresse_paie: company?.adresse_paie ?? null,
            contact_paie: company?.contact_paie ?? null,
            code_naf: company?.code_naf ?? null,
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

        {/* Section Identité visuelle */}
        <BrandingForm
          logoUrl={company?.logo_url ?? null}
          couleurPrimaire={company?.couleur_primaire ?? "#6366f1"}
          couleurSecondaire={company?.couleur_secondaire ?? "#8b5cf6"}
        />

        {/* Section Audit */}
        {profile?.role === "admin" || profile?.role === "responsable_rh" ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Sécurité & Audit</h2>
                <p className="text-xs text-slate-500">Consulter l'historique des actions et gérer la conformité</p>
              </div>
            </div>
            
            <div className="pt-2">
              <a 
                href="/parametres/audit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Accéder au journal d'audit
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
