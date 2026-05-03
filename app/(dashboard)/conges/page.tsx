export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { CongesDialog } from "@/components/rh/CongesDialog";
import { CongesApprovalButton } from "@/components/rh/CongesApprovalButton";
import { ArretMaladieDialog } from "@/components/rh/ArretMaladieDialog";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarDays } from "lucide-react";

export const metadata = { title: "Conges — RH Manager CI" };

import { CongesTable, CongeRow } from "@/components/rh/CongesTable";

export default async function CongesPage() {
  const supabase = createServerClient();

  const [{ data: conges }, { data: employees }] = await Promise.all([
    supabase
      .from("conges")
      .select(
        `id, type, date_debut, date_fin, nb_jours, statut, commentaire, refus_motif, created_at,
         est_justifie, est_at, justificatif_url,
         employees(full_name, matricule)`
      )
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("employees")
      .select("id, full_name, matricule")
      .neq("statut", "inactif") // On permet actif et suspendu
      .order("full_name")
      .limit(1000),
  ]);

  // Role-based approval permissions
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const userRole = profile?.role ?? "salarie";
  const canManagerApprove = ["admin", "manager", "responsable_rh"].includes(userRole);
  const canRhApprove = ["admin", "responsable_rh"].includes(userRole);

  const enAttenteManager = conges?.filter((c) => c.statut === "en_attente") ?? [];
  const enAttenteRh = conges?.filter((c) => c.statut === "valide_manager") ?? [];
  const historique = conges?.filter((c) => c.statut === "approuve" || c.statut === "refuse") ?? [];

  const employeesForArret = (employees ?? []).map((e) => ({
    id: e.id,
    full_name: e.full_name,
  }));

  // KPI
  const currentMonth = new Date().toISOString().slice(0, 7);
  const approuvesCeMois = conges?.filter(
    (c) => c.statut === "approuve" && c.created_at?.startsWith(currentMonth)
  ) ?? [];
  const joursTotal = approuvesCeMois.reduce((s, c) => s + Number(c.nb_jours), 0);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestion des Congés</h1>
          <p className="text-sm text-slate-600 mt-0.5">Droit : 2,2 jours/mois (Légal)</p>
        </div>
        <div className="flex gap-2">
          <ArretMaladieDialog employees={employeesForArret} />
          <CongesDialog employees={employees ?? []} />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">En attente</p>
          <p className="mt-3 text-2xl font-bold text-slate-900 font-mono tabular-nums">{enAttenteManager.length + enAttenteRh.length}</p>
          <p className="mt-1 text-xs text-slate-600">demande(s) à traiter</p>
        </div>
        <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Approuvés ce mois</p>
          <p className="mt-3 text-2xl font-bold text-slate-900 font-mono tabular-nums">{approuvesCeMois.length}</p>
          <p className="mt-1 text-xs text-slate-600">congé(s) validé(s)</p>
        </div>
        <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Jours pris ce mois</p>
          <p className="mt-3 text-2xl font-bold text-slate-900 font-mono tabular-nums">{joursTotal}</p>
          <p className="mt-1 text-xs text-slate-600">jours ouvrés cumulés</p>
        </div>
      </div>

      {/* Rappel légal */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">Droits légaux — Code du Travail ivoirien</p>
        <div className="flex flex-wrap gap-4 text-xs">
          <span>Annuel : <strong>26,4 jours/an base</strong> (2,2j × 12 mois)</span>
          <span>Maternité : <strong>14 semaines</strong></span>
          <span>Paternité : <strong>10 jours</strong></span>
        </div>
      </div>

      {/* Note arrêts maladie */}
      <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">Arrêts maladie — impact bulletin de paie</p>
        <p className="text-xs">
          Les arrêts maladie avec justificatif validé (<strong>Justifié</strong>) ne génèrent <strong>pas de retenue salariale</strong>.
          Pour les absences non justifiées, saisir manuellement les jours dans le bulletin de paie.
        </p>
      </div>

      {/* Section 1 : En attente manager */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-base font-semibold text-slate-700">En attente de validation manager</h2>
          {enAttenteManager.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
              {enAttenteManager.length}
            </span>
          )}
        </div>
        {enAttenteManager.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-12 w-12 text-slate-300" />}
            title="Aucune demande en attente"
            description="Toutes les demandes manager ont été traitées."
          />
        ) : (
          <CongesTable
            conges={enAttenteManager as CongeRow[]}
            showActions
            canManagerApprove={canManagerApprove}
            canRhApprove={canRhApprove}
          />
        )}
      </div>

      {/* Section 2 : En attente RH */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-base font-semibold text-slate-700">En attente de validation RH</h2>
          {enAttenteRh.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
              {enAttenteRh.length}
            </span>
          )}
        </div>
        {enAttenteRh.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-12 w-12 text-slate-300" />}
            title="Aucune demande en attente"
            description="Toutes les demandes RH ont été traitées."
          />
        ) : (
          <CongesTable
            conges={enAttenteRh as CongeRow[]}
            showActions
            canManagerApprove={canManagerApprove}
            canRhApprove={canRhApprove}
          />
        )}
      </div>

      {/* Historique */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-3">Historique</h2>
        {historique.length === 0 ? (
          <EmptyState
            title="Aucun congé traité"
            description="L'historique des congés approuvés et refusés apparaîtra ici."
          />
        ) : (
          <CongesTable
            conges={historique as CongeRow[]}
            showActions={false}
            canManagerApprove={canManagerApprove}
            canRhApprove={canRhApprove}
          />
        )}
      </div>
    </div>
  );
}
