import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { OnboardingClient } from "./OnboardingClient";
import { buildDefaultChecklist, type OnboardingItem } from "@/lib/onboarding-template";

export const dynamic = "force-dynamic";
export const metadata = { title: "Onboarding — RH Manager CI" };

export default async function OnboardingPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) redirect("/onboarding");

  const [{ data: employee }, { data: existing }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name, matricule, poste, date_embauche, type_contrat, statut, consent_donnees_personnelles_at")
      .eq("id", params.id)
      .single(),
    supabase
      .from("onboarding_checklists")
      .select("items, completed_at, created_at")
      .eq("employee_id", params.id)
      .maybeSingle(),
  ]);

  if (!employee) return notFound();

  const items: OnboardingItem[] = existing?.items
    ? (existing.items as OnboardingItem[])
    : buildDefaultChecklist();

  // Auto-coche le consentement RGPD si déjà recueilli
  const enrichedItems = items.map((it) => {
    if (it.id === "consentement-rgpd" && employee.consent_donnees_personnelles_at && !it.done) {
      return {
        ...it,
        done: true,
        done_at: employee.consent_donnees_personnelles_at,
      };
    }
    return it;
  });

  return (
    <div className="p-3 sm:p-6 md:p-8 space-y-6 max-w-[1100px] mx-auto">
      <OnboardingClient
        employee={{
          id: employee.id,
          full_name: employee.full_name,
          matricule: employee.matricule,
          poste: employee.poste,
          date_embauche: employee.date_embauche,
          type_contrat: employee.type_contrat,
          statut: employee.statut,
        }}
        initialItems={enrichedItems}
        completedAt={existing?.completed_at ?? null}
      />
    </div>
  );
}
