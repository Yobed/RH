"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Plus, X, Trash2, Edit3 } from "lucide-react";
import { toast } from "sonner";
import {
  DUERP_CATEGORIES,
  GRAVITE_LABELS,
  PROBABILITE_LABELS,
  SEVERITY_STYLES,
  STATUS_LABELS,
  severityFromCriticity,
  type DuerpSeverity,
} from "@/lib/duerp";

interface DuerpRisk {
  id: string;
  unite_travail: string;
  category: string;
  description: string;
  exposure: string | null;
  gravite: number;
  probabilite: number;
  criticite: number;
  severity: DuerpSeverity;
  prevention_existante: string | null;
  prevention_a_venir: string | null;
  responsable: string | null;
  echeance: string | null;
  status: keyof typeof STATUS_LABELS;
  derniere_revision: string | null;
}

interface Props {
  initial: DuerpRisk[];
}

export function DuerpClient({ initial }: Props) {
  const router = useRouter();
  const [risks, setRisks] = useState<DuerpRisk[]>(initial);
  const [editing, setEditing] = useState<DuerpRisk | null>(null);
  const [creating, setCreating] = useState(false);

  const counts = useMemo(() => {
    return {
      total: risks.length,
      critique: risks.filter((r) => r.severity === "critique").length,
      elevee: risks.filter((r) => r.severity === "elevee").length,
      maitrise: risks.filter((r) => r.status === "maitrise").length,
    };
  }, [risks]);

  const grouped = useMemo(() => {
    const map = new Map<string, DuerpRisk[]>();
    for (const r of risks) {
      const arr = map.get(r.unite_travail) ?? [];
      arr.push(r);
      map.set(r.unite_travail, arr);
    }
    return Array.from(map.entries()).map(([unite, items]) => ({ unite, items }));
  }, [risks]);

  async function handleDelete(id: string): Promise<void> {
    if (!window.confirm("Supprimer ce risque définitivement ?")) return;
    const res = await fetch(`/api/duerp/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Erreur de suppression");
      return;
    }
    setRisks((prev) => prev.filter((r) => r.id !== id));
    toast.success("Risque supprimé");
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-slate-700" />
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">
              QHSE · Évaluation des risques
            </p>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">
            DUERP — Document Unique
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-3xl leading-snug">
            Inventaire et évaluation des risques professionnels par unité de travail.
            Mise à jour annuelle obligatoire et après tout changement des conditions
            de travail. Criticité = gravité × probabilité.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="h-9 inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 self-start"
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter un risque
        </button>
      </header>

      {/* KPI */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <Kpi label="Total des risques" value={counts.total.toString()} accent="neutral" />
        <Kpi label="Critiques (≥12)" value={counts.critique.toString()} accent={counts.critique > 0 ? "danger" : "ok"} />
        <Kpi label="Élevés (8-11)" value={counts.elevee.toString()} accent={counts.elevee > 0 ? "warn" : "ok"} />
        <Kpi label="Maîtrisés" value={counts.maitrise.toString()} accent="positive" />
      </section>

      {/* Liste par unité de travail */}
      {risks.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <ShieldAlert className="h-7 w-7 text-slate-300 mx-auto mb-2.5" />
          <p className="text-sm font-medium text-slate-700">DUERP vide</p>
          <p className="text-xs text-slate-500 mt-1">Commencez par identifier les risques par unité de travail.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ unite, items }) => (
            <section key={unite} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <header className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/40">
                <h2 className="text-sm font-semibold text-slate-900">{unite}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{items.length} risque(s) recensé(s)</p>
              </header>
              <ul className="divide-y divide-slate-100">
                {items.map((r) => {
                  const sev = SEVERITY_STYLES[r.severity];
                  const cat = DUERP_CATEGORIES.find((c) => c.value === r.category);
                  return (
                    <li key={r.id} className="px-4 sm:px-5 py-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${sev.tone}`}>
                              {sev.label} · {r.criticite}
                            </span>
                            <span className="text-[11px] text-slate-500">{cat?.label ?? r.category}</span>
                            <span className="text-[11px] text-slate-400">·</span>
                            <span className="text-[11px] text-slate-500">{STATUS_LABELS[r.status]}</span>
                          </div>
                          <p className="text-sm text-slate-900 mt-1.5 leading-relaxed">{r.description}</p>
                          {r.exposure && (
                            <p className="text-xs text-slate-500 mt-1">
                              <span className="font-medium">Exposition :</span> {r.exposure}
                            </p>
                          )}
                          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
                            {r.prevention_existante && (
                              <p className="text-slate-600">
                                <span className="font-medium text-slate-700">Mesures actuelles :</span> {r.prevention_existante}
                              </p>
                            )}
                            {r.prevention_a_venir && (
                              <p className="text-slate-600">
                                <span className="font-medium text-slate-700">Plan d'action :</span> {r.prevention_a_venir}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                            {r.responsable && <span>👤 {r.responsable}</span>}
                            {r.echeance && <span className="tabular-nums">📅 {new Date(r.echeance).toLocaleDateString("fr-CI")}</span>}
                            <span>G{r.gravite} × P{r.probabilite} = {r.criticite}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => setEditing(r)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
                            title="Modifier"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* Légende criticité */}
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 leading-relaxed">
        <p className="font-semibold text-slate-900 mb-2">Grille de criticité (gravité × probabilité)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(["faible", "moyenne", "elevee", "critique"] as const).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${SEVERITY_STYLES[s].bgBar}`} />
              <span className="font-medium">{SEVERITY_STYLES[s].label}</span>
              <span className="text-slate-400">
                {s === "faible" ? "1-3" : s === "moyenne" ? "4-7" : s === "elevee" ? "8-11" : "≥ 12"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {(creating || editing) && (
        <RiskDialog
          existing={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={(saved, isNew) => {
            if (isNew) setRisks((prev) => [saved, ...prev]);
            else setRisks((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
            setCreating(false);
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent: "neutral" | "ok" | "warn" | "danger" | "positive" }) {
  const bar = {
    neutral: "bg-slate-200",
    ok: "bg-emerald-500",
    warn: "bg-amber-500",
    danger: "bg-rose-500",
    positive: "bg-emerald-500",
  }[accent];
  return (
    <div className="relative rounded-lg border border-slate-200 bg-white p-3.5 sm:p-5">
      <div className={`absolute left-0 top-3.5 bottom-3.5 sm:top-5 sm:bottom-5 w-0.5 rounded-r ${bar}`} />
      <p className="text-[11px] sm:text-xs text-slate-500 font-medium">{label}</p>
      <p className="mt-1 sm:mt-1.5 text-lg sm:text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
    </div>
  );
}

function RiskDialog({
  existing, onClose, onSaved,
}: {
  existing: DuerpRisk | null;
  onClose: () => void;
  onSaved: (r: DuerpRisk, isNew: boolean) => void;
}) {
  const [unite, setUnite] = useState(existing?.unite_travail ?? "");
  const [category, setCategory] = useState(existing?.category ?? "physique");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [exposure, setExposure] = useState(existing?.exposure ?? "");
  const [gravite, setGravite] = useState(existing?.gravite ?? 2);
  const [probabilite, setProbabilite] = useState(existing?.probabilite ?? 2);
  const [preventionExistante, setPreventionExistante] = useState(existing?.prevention_existante ?? "");
  const [preventionAVenir, setPreventionAVenir] = useState(existing?.prevention_a_venir ?? "");
  const [responsable, setResponsable] = useState(existing?.responsable ?? "");
  const [echeance, setEcheance] = useState(existing?.echeance ?? "");
  const [status, setStatus] = useState(existing?.status ?? "identifie");
  const [submitting, setSubmitting] = useState(false);

  const criticite = gravite * probabilite;
  const sev = severityFromCriticity(criticite);

  async function handleSubmit(): Promise<void> {
    if (!unite.trim() || !description.trim() || description.length < 3) {
      toast.error("Unité de travail et description (min 3 caractères) requis.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        unite_travail: unite.trim(),
        category,
        description: description.trim(),
        exposure: exposure || null,
        gravite,
        probabilite,
        prevention_existante: preventionExistante || null,
        prevention_a_venir: preventionAVenir || null,
        responsable: responsable || null,
        echeance: echeance || null,
        status,
      };
      const res = existing
        ? await fetch(`/api/duerp/${existing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/duerp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Erreur");
        return;
      }
      const saved = (await res.json()) as DuerpRisk;
      toast.success(existing ? "Risque mis à jour" : "Risque ajouté");
      onSaved(saved, !existing);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-200">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">DUERP</p>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 mt-0.5">
              {existing ? "Modifier un risque" : "Ajouter un risque"}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 -m-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unité de travail *">
              <input
                type="text"
                value={unite}
                onChange={(e) => setUnite(e.target.value)}
                placeholder="Atelier B, Bureau Cocody, Site Bouaké…"
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
              />
            </Field>
            <Field label="Catégorie de risque *">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              >
                {DUERP_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Description du risque *">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Ex : exposition au bruit > 85 dB pendant les opérations de découpe."
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            />
          </Field>

          <Field label="Personnes exposées et fréquence">
            <input
              type="text"
              value={exposure}
              onChange={(e) => setExposure(e.target.value)}
              placeholder="3 opérateurs, 4 h/jour"
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Gravité *">
              <select
                value={gravite}
                onChange={(e) => setGravite(Number(e.target.value))}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n} — {GRAVITE_LABELS[n].label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Probabilité *">
              <select
                value={probabilite}
                onChange={(e) => setProbabilite(Number(e.target.value))}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n} — {PROBABILITE_LABELS[n].label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className={`rounded-md border p-3 ${SEVERITY_STYLES[sev].tone} flex items-center justify-between`}>
            <div>
              <p className="text-xs font-semibold">{SEVERITY_STYLES[sev].label}</p>
              <p className="text-[11px] mt-0.5 opacity-80">
                {GRAVITE_LABELS[gravite].description} · {PROBABILITE_LABELS[probabilite].description}
              </p>
            </div>
            <span className="text-2xl font-semibold tabular-nums">{criticite}</span>
          </div>

          <Field label="Mesures de prévention existantes">
            <textarea
              value={preventionExistante}
              onChange={(e) => setPreventionExistante(e.target.value)}
              rows={2}
              placeholder="EPI fournis, formations dispensées, consignes affichées…"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Plan d'action / mesures à venir">
            <textarea
              value={preventionAVenir}
              onChange={(e) => setPreventionAVenir(e.target.value)}
              rows={2}
              placeholder="Action, équipement, formation à mettre en œuvre"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Responsable du suivi">
              <input
                type="text"
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                placeholder="Nom du référent"
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              />
            </Field>
            <Field label="Échéance">
              <input
                type="date"
                value={echeance}
                onChange={(e) => setEcheance(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              />
            </Field>
          </div>

          <Field label="Statut">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as keyof typeof STATUS_LABELS)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
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
            className="flex-1 h-9 px-4 rounded-md bg-slate-900 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Enregistrement…" : existing ? "Mettre à jour" : "Ajouter"}
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
