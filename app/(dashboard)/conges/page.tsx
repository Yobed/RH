export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { CongesDialog } from "@/components/rh/CongesDialog";
import { CongesApprovalButton } from "@/components/rh/CongesApprovalButton";
import { ArretMaladieDialog } from "@/components/rh/ArretMaladieDialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageShell, PageHeader } from "@/components/ui/page-shell";
import { CalendarDays } from "lucide-react";

export const metadata = { title: "Conges — RH Manager CI" };

import { CongesTable, CongeRow } from "@/components/rh/CongesTable";
import { calculerJoursAcquis } from "@/lib/conges-ci";

export default async function CongesPage() {
  const supabase = createServerClient();
  const currentYear = new Date().getFullYear();

  const [{ data: conges }, { data: employees }, { data: leaveBalances }] = await Promise.all([
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
      .select("id, full_name, matricule, date_embauche, salaire_brut, sursalaire")
      .neq("statut", "inactif") // On permet actif et suspendu
      .order("full_name")
      .limit(1000),
    supabase
      .from("leave_balances")
      .select("employee_id, jours_acquis, jours_pris, solde")
      .eq("annee", currentYear),
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
    date_embauche: e.date_embauche,
    salaire_brut: e.salaire_brut,
    sursalaire: e.sursalaire,
  }));

  // Soldes équipe
  const soldesEquipe = (employees ?? []).map((emp) => {
    const balance = (leaveBalances ?? []).find((b) => b.employee_id === emp.id);
    let jours_acquis: number;
    let jours_pris: number;
    let solde: number;

    if (balance) {
      jours_acquis = balance.jours_acquis;
      jours_pris = balance.jours_pris;
      solde = balance.solde;
    } else {
      const anneeEmbauche = emp.date_embauche
        ? parseInt(emp.date_embauche.split("-")[0], 10)
        : currentYear;
      const ancienneteAns = Math.max(0, currentYear - anneeEmbauche);
      jours_acquis = calculerJoursAcquis(emp.date_embauche, currentYear, ancienneteAns);
      jours_pris = (conges ?? [])
        .filter(
          (c) =>
            c.type === "annuel" &&
            c.statut === "approuve" &&
            c.date_debut?.startsWith(String(currentYear)) &&
            (c.employees as unknown as { full_name: string } | null)?.full_name === emp.full_name
        )
        .reduce((s, c) => s + Number(c.nb_jours), 0);
      solde = jours_acquis - jours_pris;
    }

    return { ...emp, jours_acquis, jours_pris, solde };
  }).sort((a, b) => a.solde - b.solde);

  const soldeMoyenEquipe =
    soldesEquipe.length > 0
      ? soldesEquipe.reduce((s, e) => s + e.solde, 0) / soldesEquipe.length
      : 0;

  // KPI
  const currentMonth = new Date().toISOString().slice(0, 7);
  const approuvesCeMois = conges?.filter(
    (c) => c.statut === "approuve" && c.created_at?.startsWith(currentMonth)
  ) ?? [];
  const joursTotal = approuvesCeMois.reduce((s, c) => s + Number(c.nb_jours), 0);

  return (
    <PageShell>
      <PageHeader
        title="Gestion des Congés"
        description="Droit : 2,2 jours/mois (Légal)"
        help="Demandes, validations et soldes de congés. Le salarié acquiert des jours chaque mois travaillé (~2,2 jours ouvrables/mois, soit environ 26 jours/an — Code du Travail ivoirien)."
        actions={
          <>
            <ArretMaladieDialog employees={employeesForArret} />
            <CongesDialog employees={employees ?? []} />
          </>
        }
      />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-4">
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
        <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Solde moyen équipe</p>
          <p className="mt-3 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {soldeMoyenEquipe.toFixed(1)} j
          </p>
          <p className="mt-1 text-xs text-slate-600">congés restants / collaborateur</p>
        </div>
      </div>

      {/* Rappel légal */}
      <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 text-sm text-teal-800">
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

      {/* Prochains congés planifiés */}
      {(() => {
        const today = new Date().toISOString().split("T")[0];
        const prochains = (conges ?? [])
          .filter((c) => c.statut === "approuve" && c.date_debut >= today)
          .sort((a, b) => a.date_debut.localeCompare(b.date_debut))
          .slice(0, 10);
        if (prochains.length === 0) return null;
        const typeLabels: Record<string, string> = {
          annuel: "Annuel", maladie: "Maladie", maternite: "Maternité",
          paternite: "Paternité", sans_solde: "Sans solde",
          exceptionnel: "Exceptionnel", arret_maladie: "Arrêt maladie",
        };
        const typeImpact: Record<string, { badge: string; label: string }> = {
          annuel:       { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Maintenu 100 %" },
          maladie:      { badge: "bg-amber-50 text-amber-700 border-amber-200",       label: "Selon justif." },
          maternite:    { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Maintenu 100 %" },
          paternite:    { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Maintenu 100 %" },
          sans_solde:   { badge: "bg-red-50 text-red-700 border-red-200",             label: "Aucune rém." },
          exceptionnel: { badge: "bg-sky-50 text-sky-700 border-sky-200",             label: "Maintenu" },
          arret_maladie:{ badge: "bg-amber-50 text-amber-700 border-amber-200",       label: "Selon justif." },
        };
        return (
          <div>
            <h2 className="text-base font-semibold text-slate-700 mb-3">Prochains départs en congé</h2>
            <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                    <th className="px-5 py-2.5 text-left font-medium">Collaborateur</th>
                    <th className="px-5 py-2.5 text-left font-medium">Type</th>
                    <th className="px-5 py-2.5 text-left font-medium">Départ</th>
                    <th className="px-5 py-2.5 text-left font-medium">Retour</th>
                    <th className="px-5 py-2.5 text-right font-medium">Jours</th>
                    <th className="px-5 py-2.5 text-left font-medium">Impact salaire</th>
                  </tr>
                </thead>
                <tbody>
                  {prochains.map((c) => {
                    const imp = typeImpact[c.type] ?? { badge: "bg-slate-50 text-slate-500 border-slate-200", label: "—" };
                    const emp = (c.employees as unknown as { full_name: string; matricule?: string | null } | null);
                    return (
                      <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <td className="px-5 py-3 font-medium text-slate-800">
                          {emp?.full_name ?? "—"}
                          {emp?.matricule && <span className="ml-1.5 text-xs text-slate-400">{emp.matricule}</span>}
                        </td>
                        <td className="px-5 py-3 text-slate-600">{typeLabels[c.type] ?? c.type}</td>
                        <td className="px-5 py-3 text-slate-700 font-semibold">
                          {new Date(c.date_debut).toLocaleDateString("fr-CI")}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {new Date(c.date_fin).toLocaleDateString("fr-CI")}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-slate-700 font-semibold">{c.nb_jours} j</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${imp.badge}`}>
                            {imp.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Soldes des congés — Vue équipe */}
      {soldesEquipe.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-slate-700 mb-3">Soldes des congés — Vue équipe</h2>
          <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Collaborateur</th>
                  <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-600">Acquis</th>
                  <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-600">Pris</th>
                  <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-600">Solde</th>
                  <th className="px-5 py-2.5 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-600">Alerte</th>
                </tr>
              </thead>
              <tbody>
                {soldesEquipe.map((emp) => {
                  const soldeDisplay = emp.solde;
                  const soldeClass =
                    soldeDisplay >= 5
                      ? "text-emerald-700"
                      : soldeDisplay >= 1
                      ? "text-amber-600"
                      : "text-red-600";
                  const alerteBadge =
                    soldeDisplay < 0
                      ? { cls: "bg-red-50 text-red-700 border-red-200", label: "Dépassé" }
                      : soldeDisplay < 3
                      ? { cls: "bg-amber-50 text-amber-700 border-amber-200", label: "Faible (< 3j)" }
                      : { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "OK" };
                  return (
                    <tr key={emp.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {emp.full_name}
                        {emp.matricule && (
                          <span className="ml-1.5 text-xs text-slate-400">{emp.matricule}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums font-mono text-slate-600">
                        {emp.jours_acquis.toFixed(1)} j
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums font-mono text-slate-600">
                        {emp.jours_pris.toFixed(1)} j
                      </td>
                      <td className={`px-5 py-3 text-right tabular-nums font-mono font-bold ${soldeClass}`}>
                        {soldeDisplay.toFixed(1)} j
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${alerteBadge.cls}`}
                        >
                          {alerteBadge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
    </PageShell>
  );
}
