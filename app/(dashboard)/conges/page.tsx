export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { CongesDialog } from "@/components/rh/CongesDialog";
import { CongesApprovalButton } from "@/components/rh/CongesApprovalButton";
import { ArretMaladieDialog } from "@/components/rh/ArretMaladieDialog";

export const metadata = { title: "Conges — RH Manager CI" };

const TYPE_LABELS: Record<string, string> = {
  annuel: "Congé annuel",
  maladie: "Maladie",
  arret_maladie: "Arrêt maladie",
  maternite: "Maternité",
  paternite: "Paternité",
  sans_solde: "Sans solde",
  exceptionnel: "Exceptionnel",
};

const STATUT_LABEL: Record<string, string> = {
  en_attente: "En attente",
  valide_manager: "Validé manager",
  approuve: "Approuvé",
  refuse: "Refusé",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-CI", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const StatutBadge = ({ statut }: { statut: string }) => {
  if (statut === "approuve") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {STATUT_LABEL[statut] ?? statut}
      </span>
    );
  }
  if (statut === "en_attente" || statut === "valide_manager") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        {STATUT_LABEL[statut] ?? statut}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      {STATUT_LABEL[statut] ?? statut}
    </span>
  );
};

const ArretBadge = ({ estAt, estJustifie }: { estAt?: boolean; estJustifie?: boolean }) => {
  if (estAt) {
    return (
      <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-700">AT</span>
    );
  }
  if (estJustifie) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Justifié</span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">Non justifié</span>
  );
};

type CongeRow = {
  id: string;
  type: string;
  date_debut: string;
  date_fin: string;
  nb_jours: number;
  statut: string | null;
  commentaire: string | null;
  refus_motif: string | null;
  created_at: string;
  est_justifie: boolean | null;
  est_at: boolean | null;
  justificatif_url: string | null;
  employees: { full_name: string; matricule: string } | { full_name: string; matricule: string }[] | null;
};

function CongesTable({ conges, showActions, canManagerApprove, canRhApprove }: {
  conges: CongeRow[];
  showActions: boolean;
  canManagerApprove: boolean;
  canRhApprove: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/60 border-b border-slate-100">
          <tr>
            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Employé</th>
            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Type</th>
            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 hidden md:table-cell">Période</th>
            <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-600">Jours</th>
            {showActions ? (
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Actions</th>
            ) : (
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Statut</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {conges.map((c) => {
            const emp = Array.isArray(c.employees) ? c.employees[0] : c.employees;
            return (
              <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 text-sm">
                  <p className="font-semibold text-slate-800">{emp?.full_name ?? "—"}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{emp?.matricule}</p>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-700">{TYPE_LABELS[c.type] ?? c.type}</span>
                    {c.type === "arret_maladie" && (
                      <ArretBadge
                        estAt={(c as { est_at?: boolean }).est_at ?? false}
                        estJustifie={(c as { est_justifie?: boolean }).est_justifie ?? false}
                      />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell text-xs">
                  {formatDate(c.date_debut)} → {formatDate(c.date_fin)}
                </td>
                <td className="px-4 py-3 text-sm text-center font-bold text-slate-800 font-mono tabular-nums">
                  {c.nb_jours}j
                </td>
                {showActions ? (
                  <td className="px-4 py-3 text-sm">
                    <CongesApprovalButton
                      congeId={c.id}
                      statut={c.statut ?? "en_attente"}
                      canManagerApprove={canManagerApprove}
                      canRhApprove={canRhApprove}
                    />
                  </td>
                ) : (
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-col gap-1">
                      <StatutBadge statut={c.statut ?? "en_attente"} />
                      {c.statut === "refuse" && c.refus_motif && (
                        <p className="text-xs text-slate-600 italic">{c.refus_motif}</p>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}

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
      .order("created_at", { ascending: false }),
    supabase
      .from("employees")
      .select("id, prenom, nom, full_name, matricule")
      .eq("statut", "actif")
      .order("full_name"),
  ]);

  const canManagerApprove = true;
  const canRhApprove = true;

  const enAttenteManager = conges?.filter((c) => c.statut === "en_attente") ?? [];
  const enAttenteRh = conges?.filter((c) => c.statut === "valide_manager") ?? [];
  const historique = conges?.filter((c) => c.statut === "approuve" || c.statut === "refuse") ?? [];

  const employeesForArret = (employees ?? []).map((e) => ({
    id: e.id,
    prenom: (e as { prenom?: string }).prenom ?? e.full_name?.split(' ')[0] ?? '',
    nom: (e as { nom?: string }).nom ?? e.full_name?.split(' ').slice(1).join(' ') ?? '',
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
          <p className="text-sm text-slate-600 mt-0.5">Droit : 2,5 jours/mois (Art. 25 CT-CI)</p>
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
          <span>Annuel : <strong>30 jours/an max</strong> (2,5j × 12 mois)</span>
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
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-600">
            Aucune demande en attente de validation manager.
          </div>
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
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-600">
            Aucune demande en attente de validation RH.
          </div>
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
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-600">
            Aucun congé traité.
          </div>
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
