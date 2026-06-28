import { createServerClient } from "@/lib/supabase/server";
import { ParametresForm } from "@/components/rh/ParametresForm";
import { BrandingForm } from "@/components/rh/BrandingForm";
import { PageShell, PageHeader } from "@/components/ui/page-shell";

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
    <PageShell width="narrow">
      <PageHeader
        title="Paramètres"
        description="Profil utilisateur et configuration entreprise"
      />

      {/* Formulaire */}
      <div className="grid gap-6">
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
    </PageShell>
  );
}
