"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Plus, Calendar, Clock, Users, X, Award, Banknote } from "lucide-react";
import { toast } from "sonner";

export interface TrainingAction {
  id: string;
  intitule: string;
  organisme: string | null;
  modality: "interne" | "externe" | "e_learning" | "tutorat";
  domaine: string | null;
  date_debut: string;
  date_fin: string | null;
  duree_heures: number;
  cout_total: number;
  statut: "planifie" | "en_cours" | "termine" | "annule";
  fdfp_eligible: boolean;
  fdfp_remboursement: number;
  nb_participants: number;
}

interface Employee {
  id: string;
  full_name: string;
  matricule: string;
}

interface Kpi {
  masseSalariale: number;
  creditFdfp: number;
  creditApprentissage: number;
  creditTotal: number;
  totalCout: number;
  totalRembourse: number;
  totalHeures: number;
  tauxEffort: number;
  year: number;
}

interface Props {
  actions: TrainingAction[];
  employees: Employee[];
  kpi: Kpi;
}

const MODALITY_LABELS: Record<TrainingAction["modality"], string> = {
  interne: "Interne",
  externe: "Externe",
  e_learning: "E-learning",
  tutorat: "Tutorat",
};

const STATUT_STYLES: Record<TrainingAction["statut"], { label: string; tone: string }> = {
  planifie: { label: "Planifiée", tone: "bg-sky-50 text-sky-700 border-sky-200" },
  en_cours: { label: "En cours", tone: "bg-amber-50 text-amber-700 border-amber-200" },
  termine: { label: "Terminée", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  annule: { label: "Annulée", tone: "bg-slate-100 text-slate-600 border-slate-200" },
};

const fcfa = (n: number): string =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n ?? 0);

export function FormationClient({ actions, employees, kpi }: Props) {
  const [creating, setCreating] = useState(false);
  const utilisationPct = kpi.creditTotal > 0
    ? Math.round((kpi.totalCout / kpi.creditTotal) * 100)
    : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <header className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-slate-700" />
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">
              Formation continue · FDFP
            </p>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">
            Plan de formation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-3xl leading-snug">
            Suivi des actions de formation et récupération des crédits FDFP
            (1,2 % cotisation + 0,4 % apprentissage de la masse salariale).
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="h-9 inline-flex items-center justify-center gap-2 rounded-md bg-[#ee7f03] px-4 text-sm font-medium text-white hover:bg-[#d67002] self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          Nouvelle action
        </button>
      </header>

      {/* KPI */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <KpiCard
          label={`Crédit FDFP ${kpi.year}`}
          value={fcfa(kpi.creditTotal)}
          sub={`Cotisé sur ${fcfa(kpi.masseSalariale)} de masse`}
          accent="primary"
        />
        <KpiCard
          label="Coût engagé"
          value={fcfa(kpi.totalCout)}
          sub={`${utilisationPct}% du crédit utilisé`}
          accent={utilisationPct > 100 ? "warn" : "neutral"}
        />
        <KpiCard
          label="Remboursé FDFP"
          value={fcfa(kpi.totalRembourse)}
          sub={
            kpi.totalCout > 0
              ? `${Math.round((kpi.totalRembourse / kpi.totalCout) * 100)}% du coût`
              : "—"
          }
          accent="positive"
        />
        <KpiCard
          label="Effort formation"
          value={`${kpi.tauxEffort} %`}
          sub={`${kpi.totalHeures} h cumulées`}
          accent={kpi.tauxEffort >= 1 ? "positive" : "warn"}
        />
      </section>

      {/* Barre crédit / utilisation */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-900">Utilisation du crédit FDFP {kpi.year}</p>
          <span className="text-xs text-slate-500 tabular-nums">
            {fcfa(kpi.totalCout)} / {fcfa(kpi.creditTotal)}
          </span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              utilisationPct > 100 ? "bg-rose-500" : utilisationPct > 80 ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(utilisationPct, 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-500 mt-2 leading-snug">
          Le crédit non utilisé est perdu en fin d'exercice. L'effort formation
          doit idéalement atteindre 1 % minimum de la masse salariale.
        </p>
      </section>

      {/* Liste des actions */}
      <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">
            Actions de formation ({actions.length})
          </h2>
        </div>
        {actions.length === 0 ? (
          <div className="p-12 text-center">
            <GraduationCap className="h-7 w-7 text-slate-300 mx-auto mb-2.5" />
            <p className="text-sm font-medium text-slate-700">Aucune action de formation</p>
            <p className="text-xs text-slate-500 mt-1">
              Planifiez votre première formation pour commencer à utiliser votre
              crédit FDFP.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                <tr>
                  <th className="text-left px-5 py-3">Action</th>
                  <th className="text-left px-3 py-3">Modalité</th>
                  <th className="text-left px-3 py-3">Période</th>
                  <th className="text-right px-3 py-3">Heures</th>
                  <th className="text-right px-3 py-3">Participants</th>
                  <th className="text-right px-3 py-3">Coût</th>
                  <th className="text-right px-3 py-3">Remboursé</th>
                  <th className="text-left px-5 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {actions.map((a) => (
                  <tr key={a.id} className="hover:bg-[#ee7f03]/[0.04]">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{a.intitule}</p>
                      <p className="text-xs text-slate-500">
                        {a.organisme ?? "—"}
                        {a.domaine ? ` · ${a.domaine}` : ""}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{MODALITY_LABELS[a.modality]}</td>
                    <td className="px-3 py-3 text-xs text-slate-600 tabular-nums">
                      <p>{new Date(a.date_debut).toLocaleDateString("fr-CI")}</p>
                      {a.date_fin && (
                        <p className="text-slate-400">→ {new Date(a.date_fin).toLocaleDateString("fr-CI")}</p>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                      {a.duree_heures} h
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                      {a.nb_participants}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-900 font-medium">
                      {fcfa(a.cout_total)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {a.fdfp_remboursement > 0 ? (
                        <span className="text-emerald-700 font-medium">
                          {fcfa(a.fdfp_remboursement)}
                        </span>
                      ) : a.fdfp_eligible ? (
                        <span className="text-slate-400">à demander</span>
                      ) : (
                        <span className="text-slate-300">non éligible</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${STATUT_STYLES[a.statut].tone}`}>
                        {STATUT_STYLES[a.statut].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {creating && (
        <CreateDialog
          employees={employees}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}

function KpiCard({
  label, value, sub, accent,
}: {
  label: string; value: string; sub: string;
  accent: "neutral" | "primary" | "positive" | "warn";
}) {
  const bar = {
    neutral: "bg-slate-200",
    primary: "bg-[#ee7f03]",
    positive: "bg-emerald-500",
    warn: "bg-amber-500",
  }[accent];
  return (
    <div className="relative rounded-lg border border-slate-200 bg-white p-3.5 sm:p-5">
      <div className={`absolute left-0 top-3.5 bottom-3.5 sm:top-5 sm:bottom-5 w-0.5 rounded-r ${bar}`} />
      <p className="text-[11px] sm:text-xs text-slate-500 font-medium">{label}</p>
      <p className="mt-1 sm:mt-1.5 text-base sm:text-2xl font-semibold text-slate-900 tabular-nums break-words">
        {value}
      </p>
      <p className="mt-1 text-[10px] sm:text-xs text-slate-500 leading-snug">{sub}</p>
    </div>
  );
}

function CreateDialog({
  employees, onClose,
}: { employees: Employee[]; onClose: () => void }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [intitule, setIntitule] = useState("");
  const [organisme, setOrganisme] = useState("");
  const [domaine, setDomaine] = useState("");
  const [modality, setModality] = useState<TrainingAction["modality"]>("externe");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [dureeHeures, setDureeHeures] = useState("0");
  const [coutTotal, setCoutTotal] = useState("0");
  const [fdfpEligible, setFdfpEligible] = useState(true);
  const [participants, setParticipants] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const filtered = useMemo<Employee[]>(() => {
    const q = search.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter(
      (e) => e.full_name.toLowerCase().includes(q) || e.matricule.toLowerCase().includes(q)
    );
  }, [employees, search]);

  function toggleParticipant(id: string): void {
    setParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleSubmit(): Promise<void> {
    if (!intitule || !dateDebut) {
      toast.error("Intitulé et date de début obligatoires.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/formation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intitule,
          organisme: organisme || null,
          domaine: domaine || null,
          modality,
          date_debut: dateDebut,
          date_fin: dateFin || null,
          duree_heures: Number(dureeHeures) || 0,
          cout_total: Number(coutTotal) || 0,
          fdfp_eligible: fdfpEligible,
          participants,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Erreur");
        return;
      }
      toast.success("Action de formation créée");
      router.refresh();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-200">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">
              Nouvelle action
            </p>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 mt-0.5">
              Plan de formation
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 -m-1">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <Field label="Intitulé *">
            <input
              type="text"
              value={intitule}
              onChange={(e) => setIntitule(e.target.value)}
              placeholder="Ex : Sécurité incendie niveau 2"
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Organisme">
              <input
                type="text"
                value={organisme}
                onChange={(e) => setOrganisme(e.target.value)}
                placeholder="Ex : INHB, ENS-CI"
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
              />
            </Field>
            <Field label="Domaine">
              <input
                type="text"
                value={domaine}
                onChange={(e) => setDomaine(e.target.value)}
                placeholder="Sécurité, technique, langues…"
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
              />
            </Field>
          </div>
          <Field label="Modalité">
            <div className="inline-flex w-full rounded-md border border-slate-200 bg-white p-0.5">
              {(["externe", "interne", "e_learning", "tutorat"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModality(m)}
                  className={[
                    "flex-1 h-7 rounded text-xs font-medium",
                    modality === m ? "bg-[#ee7f03] text-white" : "text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {MODALITY_LABELS[m]}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date début *">
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
              />
            </Field>
            <Field label="Date fin">
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Durée (heures)">
              <input
                type="number"
                min="0"
                step="0.5"
                value={dureeHeures}
                onChange={(e) => setDureeHeures(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm tabular-nums focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
              />
            </Field>
            <Field label="Coût total (FCFA)">
              <input
                type="number"
                min="0"
                step="1000"
                value={coutTotal}
                onChange={(e) => setCoutTotal(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm tabular-nums focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={fdfpEligible}
              onChange={(e) => setFdfpEligible(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <span className="text-xs text-slate-700">
              Éligible au remboursement FDFP (1,2 % de la cotisation)
            </span>
          </label>
          <Field label={`Participants (${participants.length} sélectionnés)`}>
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            />
            <ul className="max-h-40 overflow-y-auto rounded-md border border-slate-200 divide-y divide-slate-100">
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-xs text-slate-400">Aucun salarié</li>
              )}
              {filtered.map((e) => (
                <li key={e.id}>
                  <label className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={participants.includes(e.id)}
                      onChange={() => toggleParticipant(e.id)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-900 truncate">{e.full_name}</p>
                      <p className="text-[10px] text-slate-500 tabular-nums">{e.matricule}</p>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          </Field>
        </div>
        <div className="flex gap-2 px-5 sm:px-6 py-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none h-9 px-4 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 h-9 px-4 rounded-md bg-[#ee7f03] text-sm font-medium text-white hover:bg-[#d67002] disabled:opacity-50"
          >
            {submitting ? "Création…" : "Créer l'action"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-700 block mb-1">{label}</label>
      {children}
    </div>
  );
}
