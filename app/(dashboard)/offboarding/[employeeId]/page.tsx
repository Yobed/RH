import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import type { OffboardingItem } from "@/lib/offboarding-template";
import { OffboardingChecklistClient } from "@/components/rh/OffboardingChecklistClient";
import { OffboardingCreateButton } from "@/components/rh/OffboardingCreateButton";

export const dynamic = "force-dynamic";

interface Props {
  params: { employeeId: string };
}

export default async function OffboardingDetailPage({ params }: Props) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: employee } = await supabase
    .from("employees")
    .select("id, full_name, matricule, poste, departement, statut, date_embauche")
    .eq("id", params.employeeId)
    .limit(1)
    .maybeSingle();

  if (!employee) notFound();

  const [{ data: checklist }, { data: rupture }] = await Promise.all([
    supabase
      .from("offboarding_checklists")
      .select("*")
      .eq("employee_id", params.employeeId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("ruptures")
      .select("id, type_rupture, date_notification, date_sortie_effective, statut")
      .eq("employee_id", params.employeeId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <Link
          href="/offboarding"
          className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" weight="bold" />
          Retour à la liste
        </Link>
      </div>

      <header className="pb-5 border-b border-slate-100">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Sortie collaborateur
        </p>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
          {employee.full_name}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5 font-mono">
          {employee.matricule} · {employee.poste}
          {employee.departement && ` · ${employee.departement}`}
        </p>
        {rupture && (
          <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50/40 px-3 py-2 inline-flex items-center gap-2 text-xs">
            <span className="rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 font-mono text-[10px] uppercase">
              {rupture.type_rupture.replace(/_/g, " ")}
            </span>
            <span className="text-slate-600">
              Statut rupture : <strong>{rupture.statut}</strong>
            </span>
            {rupture.date_sortie_effective && (
              <span className="text-slate-500">
                · Sortie le{" "}
                {new Date(rupture.date_sortie_effective).toLocaleDateString("fr-CI", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </span>
            )}
          </div>
        )}
      </header>

      {checklist ? (
        <OffboardingChecklistClient
          employeeId={employee.id}
          employeeName={employee.full_name}
          initialItems={(checklist.items ?? []) as OffboardingItem[]}
          dateSortiePrevue={checklist.date_sortie_prevue}
          completedAt={checklist.completed_at}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">
            Aucune checklist d'offboarding pour ce collaborateur.
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            La checklist couvre la restitution des biens (badge, ordi…), la révocation des accès,
            les formalités administratives (certificat de travail, attestation CNPS) et le STC.
          </p>
          <div className="mt-4">
            <OffboardingCreateButton
              employeeId={employee.id}
              defaultDateSortie={rupture?.date_sortie_effective ?? null}
              ruptureId={rupture?.id ?? null}
            />
          </div>
        </div>
      )}
    </div>
  );
}
