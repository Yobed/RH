"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Download, FileText, ShieldCheck, AlertTriangle, CheckCircle2,
  Calendar as CalendarIcon, Building2, Eye, X, FileSpreadsheet,
} from "lucide-react";

interface PreviewData {
  kind: string;
  periode: string;
  deadline: string;
  isSocial: boolean;
  company: { raison_sociale: string; cnps_matricule: string | null; ncc: string | null };
  totals: {
    nb_salaries: number;
    total_brut: number;
    total_cotisations: number;
    total_assiette: number;
    total_retenu: number;
    penalite: number;
    total_du: number;
  };
  columns: string[];
  rows: Array<Record<string, string | number>>;
}

type Statut = "brouillon" | "genere" | "soumis" | "rejete" | "rectifie";

interface SocialDeclaration {
  id: string;
  kind: "DIPE" | "DISA" | "DASC";
  periode: string;
  statut: Statut;
  deadline: string;
  date_soumission: string | null;
  numero_recepisse: string | null;
  total_brut: number | null;
  total_cotisations: number | null;
  nb_salaries: number | null;
  penalite_calculee: number | null;
}

interface TaxDeclaration {
  id: string;
  kind: "ITS_MENSUEL" | "ITS_ANNUEL" | "IGR_MENSUEL" | "CN_MENSUEL";
  periode: string;
  statut: Statut;
  deadline: string;
  date_soumission: string | null;
  numero_recepisse: string | null;
  total_assiette: number | null;
  total_retenu: number | null;
  nb_salaries: number | null;
  penalite_calculee: number | null;
}

interface Props {
  socialDeclarations: SocialDeclaration[];
  taxDeclarations: TaxDeclaration[];
  availablePeriods: string[];
}

type TabKey = "social" | "tax" | "calendar";

const fcfa = (n: number | null | undefined): string =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n ?? 0);

const STATUT_LABELS: Record<Statut, { label: string; tone: string }> = {
  brouillon: { label: "Brouillon", tone: "bg-slate-100 text-slate-700 border-slate-200" },
  genere: { label: "Généré", tone: "bg-sky-50 text-sky-700 border-sky-200" },
  soumis: { label: "Soumis", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejete: { label: "Rejeté", tone: "bg-rose-50 text-rose-700 border-rose-200" },
  rectifie: { label: "Rectifié", tone: "bg-amber-50 text-amber-700 border-amber-200" },
};

const SOCIAL_KINDS = [
  { value: "DIPE", label: "DIPE — mensuel" },
  { value: "DISA", label: "DISA — annuel" },
  { value: "DASC", label: "DASC — annuel" },
] as const;

const TAX_KINDS = [
  { value: "ITS_MENSUEL", label: "ITS — mensuel" },
  { value: "ITS_ANNUEL", label: "ITS — annuel" },
] as const;

function deadlineState(deadline: string, statut: Statut): { label: string; tone: string } | null {
  if (statut === "soumis") return null;
  const dl = new Date(deadline);
  const now = new Date();
  const ms = dl.getTime() - now.getTime();
  const days = Math.ceil(ms / 86_400_000);
  if (days < 0) {
    return {
      label: `En retard de ${Math.abs(days)} jour(s)`,
      tone: "bg-rose-100 text-rose-700",
    };
  }
  if (days <= 7) {
    return {
      label: `${days} jour(s) restants`,
      tone: "bg-amber-100 text-amber-700",
    };
  }
  return null;
}

export function DeclarationsManager({ socialDeclarations, taxDeclarations, availablePeriods }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("social");
  const [generating, setGenerating] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);

  // ── KPI globaux ──
  const allDecls = useMemo(() => {
    return [
      ...socialDeclarations.map((d) => ({ ...d, kind_class: "social" as const, total: d.total_cotisations ?? 0 })),
      ...taxDeclarations.map((d) => ({ ...d, kind_class: "tax" as const, total: d.total_retenu ?? 0 })),
    ];
  }, [socialDeclarations, taxDeclarations]);

  const kpi = useMemo(() => {
    const today = new Date();
    const enRetard = allDecls.filter(
      (d) => d.statut !== "soumis" && new Date(d.deadline) < today
    );
    const aVenir = allDecls.filter((d) => {
      if (d.statut === "soumis") return false;
      const dl = new Date(d.deadline);
      const days = Math.ceil((dl.getTime() - today.getTime()) / 86_400_000);
      return days >= 0 && days <= 7;
    });
    const totalDuMois = socialDeclarations
      .filter((d) => d.statut !== "soumis" && d.kind === "DIPE")
      .reduce((s, d) => s + (d.total_cotisations ?? 0), 0);
    const penalitesCumulees = allDecls.reduce((s, d) => s + (d.penalite_calculee ?? 0), 0);
    return { enRetard: enRetard.length, aVenir: aVenir.length, totalDuMois, penalitesCumulees };
  }, [allDecls, socialDeclarations]);

  // ── Génération ──
  const [genKind, setGenKind] = useState<string>("DIPE");
  const [genPeriode, setGenPeriode] = useState<string>(availablePeriods[0] ?? "");
  const [genYear, setGenYear] = useState<string>(String(new Date().getFullYear() - 1));

  const isMonthlyKind = genKind === "DIPE" || genKind === "ITS_MENSUEL" || genKind === "IGR_MENSUEL";

  async function handlePreview(): Promise<void> {
    const periode = isMonthlyKind ? genPeriode : genYear;
    if (!periode) {
      toast.error("Sélectionnez une période.");
      return;
    }
    setPreviewing(true);
    try {
      const res = await fetch("/api/declarations/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: genKind, periode }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Aucune donnée à prévisualiser");
        return;
      }
      const data = (await res.json()) as PreviewData;
      setPreview(data);
    } catch {
      toast.error("Erreur lors de la prévisualisation.");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleGenerate(skipConfirm = false): Promise<void> {
    const periode = preview ? preview.periode : isMonthlyKind ? genPeriode : genYear;
    const kind = preview ? preview.kind : genKind;
    if (!periode) {
      toast.error("Sélectionnez une période.");
      return;
    }
    if (!skipConfirm && !preview) {
      // Pas de preview chargé : on charge d'abord
      await handlePreview();
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/declarations/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, periode }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Erreur de génération");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kind}_${periode}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Fichier ${kind} ${periode} archivé et téléchargé.`);
      setPreview(null);
      router.refresh();
    } catch {
      toast.error("Erreur lors de la génération.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleExportExcel(): Promise<void> {
    const isMonthlyKind = genKind === "DIPE" || genKind === "ITS_MENSUEL";
    const periode = preview ? preview.periode : isMonthlyKind ? genPeriode : genYear;
    const kind = preview ? preview.kind : genKind;
    if (!periode) {
      toast.error("Sélectionnez une période.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/declarations/exporter-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, periode }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Erreur d'export Excel");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kind}_${periode}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Fichier Excel ${kind} ${periode} téléchargé.`);
    } catch {
      toast.error("Erreur lors de l'export Excel.");
    } finally {
      setGenerating(false);
    }
  }

  async function markSubmitted(id: string, kindClass: "social" | "tax"): Promise<void> {
    const numero = window.prompt("Numéro de récépissé / accusé de soumission :");
    if (!numero || numero.trim().length < 1) return;
    setSubmittingId(id);
    try {
      const res = await fetch(`/api/declarations/${id}/soumettre`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind_class: kindClass, numero_recepisse: numero.trim() }),
      });
      if (!res.ok) {
        toast.error("Erreur lors de l'enregistrement.");
        return;
      }
      toast.success("Soumission enregistrée.");
      router.refresh();
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="h-5 w-5 text-slate-700" />
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">
            E-CNPS · DGI · Réforme 2026
          </p>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Déclarations & Conformité</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-3xl leading-snug">
          Génération automatique des fichiers DIPE, DISA, DASC et ITS au format E-CNPS / DGI.
          Suivi des soumissions et calcul automatique des pénalités de retard
          (5 % + 1 %/mois — Art. 47 Code de Prévoyance Sociale).
        </p>
      </header>

      {/* ── KPI ─────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <Kpi
          label="En retard"
          value={kpi.enRetard.toString()}
          sub="Déclarations dépassant l'échéance"
          accent={kpi.enRetard > 0 ? "danger" : "ok"}
        />
        <Kpi
          label="À soumettre &lt; 7j"
          value={kpi.aVenir.toString()}
          sub="Échéances imminentes"
          accent={kpi.aVenir > 0 ? "warn" : "neutral"}
        />
        <Kpi
          label="DIPE en cours"
          value={fcfa(kpi.totalDuMois)}
          sub="Cotisations CNPS dues non soumises"
          accent="neutral"
        />
        <Kpi
          label="Pénalités cumulées"
          value={fcfa(kpi.penalitesCumulees)}
          sub="Majorations de retard estimées"
          accent={kpi.penalitesCumulees > 0 ? "danger" : "ok"}
        />
      </section>

      {/* ── Action : générer ──────────────────────────────────────── */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Générer une déclaration</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Le fichier CSV est téléchargé immédiatement et la déclaration archivée pour traçabilité.
          </p>
        </div>
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-slate-700">Type de déclaration</label>
            <select
              value={genKind}
              onChange={(e) => setGenKind(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:border-[#ee7f03] focus:ring-1 focus:ring-[#ee7f03]/20 transition-all"
            >
              <optgroup label="Sociales (CNPS)">
                {SOCIAL_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>{k.label}</option>
                ))}
              </optgroup>
              <optgroup label="Fiscales (DGI)">
                {TAX_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>{k.label}</option>
                ))}
              </optgroup>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">
              {isMonthlyKind ? "Mois de paie" : "Année"}
            </label>
            {isMonthlyKind ? (
              <select
                value={genPeriode}
                onChange={(e) => setGenPeriode(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:border-[#ee7f03] focus:ring-1 focus:ring-[#ee7f03]/20 transition-all"
              >
                {availablePeriods.length === 0 && <option value="">— Aucun bulletin —</option>}
                {availablePeriods.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                min="2020"
                max="2099"
                value={genYear}
                onChange={(e) => setGenYear(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 tabular-nums focus:outline-none focus:border-[#ee7f03] focus:ring-1 focus:ring-[#ee7f03]/20 transition-all"
              />
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handlePreview}
              disabled={previewing || generating}
              className="h-9 inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Eye className="h-3.5 w-3.5" />
              {previewing ? "Calcul…" : "Prévisualiser"}
            </button>
            <button
              onClick={handleExportExcel}
              disabled={generating || previewing}
              className="h-9 inline-flex items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
              title="Télécharge l'état au format Excel (sans archivage)"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel
            </button>
            <button
              onClick={() => handleGenerate(true)}
              disabled={generating || previewing}
              className="h-9 inline-flex items-center justify-center gap-2 rounded-md bg-[#ee7f03] hover:bg-[#d67002] border-0 px-4 text-sm font-medium text-white disabled:opacity-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              {generating ? "Génération…" : "Générer CSV & archiver"}
            </button>
          </div>
        </div>
      </section>

      {preview && (
        <PreviewDialog
          data={preview}
          onClose={() => setPreview(null)}
          onConfirm={() => handleGenerate(true)}
          generating={generating}
        />
      )}

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <nav className="border-b border-slate-200">
        <div className="flex gap-1 -mb-px overflow-x-auto no-scrollbar">
          {([
            { id: "social", label: "Sociales (CNPS)" },
            { id: "tax", label: "Fiscales (DGI)" },
            { id: "calendar", label: "Calendrier 2026" },
          ] as const).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={[
                  "px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors",
                  active
                    ? "border-[#ee7f03] text-[#ee7f03] font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300",
                ].join(" ")}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      {tab === "social" && (
        <DeclarationTable
          rows={socialDeclarations.map((d) => ({
            id: d.id,
            kind: d.kind,
            periode: d.periode,
            statut: d.statut,
            deadline: d.deadline,
            date_soumission: d.date_soumission,
            numero_recepisse: d.numero_recepisse,
            total: d.total_cotisations ?? 0,
            nb_salaries: d.nb_salaries,
            penalite: d.penalite_calculee ?? 0,
          }))}
          kindClass="social"
          totalLabel="Cotisations dues"
          submittingId={submittingId}
          onMarkSubmitted={markSubmitted}
        />
      )}

      {tab === "tax" && (
        <DeclarationTable
          rows={taxDeclarations.map((d) => ({
            id: d.id,
            kind: d.kind,
            periode: d.periode,
            statut: d.statut,
            deadline: d.deadline,
            date_soumission: d.date_soumission,
            numero_recepisse: d.numero_recepisse,
            total: d.total_retenu ?? 0,
            nb_salaries: d.nb_salaries,
            penalite: d.penalite_calculee ?? 0,
          }))}
          kindClass="tax"
          totalLabel="Retenue à verser"
          submittingId={submittingId}
          onMarkSubmitted={markSubmitted}
        />
      )}

      {tab === "calendar" && <CalendarReference />}
    </div>
  );
}

// ── Sous-composants ────────────────────────────────────────────────────────

function Kpi({
  label, value, sub, accent,
}: {
  label: string; value: string; sub: string;
  accent: "ok" | "warn" | "danger" | "neutral";
}) {
  const bar = {
    ok: "bg-emerald-500",
    warn: "bg-amber-500",
    danger: "bg-rose-500",
    neutral: "bg-slate-200",
  }[accent];
  return (
    <div className="relative rounded-lg border border-slate-200 bg-white p-3.5 sm:p-5">
      <div className={`absolute left-0 top-3.5 bottom-3.5 sm:top-5 sm:bottom-5 w-0.5 rounded-r ${bar}`} />
      <p className="text-[11px] sm:text-xs text-slate-500 font-medium" dangerouslySetInnerHTML={{ __html: label }} />
      <p className="mt-1 sm:mt-1.5 text-lg sm:text-2xl font-semibold text-slate-900 tabular-nums break-words">
        {value}
      </p>
      <p className="mt-1 text-[10px] sm:text-xs text-slate-500 leading-snug">{sub}</p>
    </div>
  );
}

interface RowGeneric {
  id: string;
  kind: string;
  periode: string;
  statut: Statut;
  deadline: string;
  date_soumission: string | null;
  numero_recepisse: string | null;
  total: number;
  nb_salaries: number | null;
  penalite: number;
}

function DeclarationTable({
  rows, kindClass, totalLabel, submittingId, onMarkSubmitted,
}: {
  rows: RowGeneric[];
  kindClass: "social" | "tax";
  totalLabel: string;
  submittingId: string | null;
  onMarkSubmitted: (id: string, kindClass: "social" | "tax") => Promise<void>;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
        <FileText className="h-7 w-7 text-slate-300 mx-auto mb-2.5" />
        <p className="text-sm font-medium text-slate-700">Aucune déclaration enregistrée</p>
        <p className="text-xs text-slate-500 mt-1">
          Utilisez le bloc « Générer une déclaration » ci-dessus.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/50 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            <tr>
              <th className="text-left px-5 py-3">Type</th>
              <th className="text-left px-3 py-3">Période</th>
              <th className="text-left px-3 py-3">Échéance</th>
              <th className="text-right px-3 py-3">Salariés</th>
              <th className="text-right px-3 py-3">{totalLabel}</th>
              <th className="text-right px-3 py-3">Pénalité</th>
              <th className="text-left px-3 py-3">Statut</th>
              <th className="text-right px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const ds = deadlineState(r.deadline, r.statut);
              return (
                <tr key={r.id} className="hover:bg-[#ee7f03]/[0.04] transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-900">{r.kind}</td>
                  <td className="px-3 py-3 tabular-nums text-slate-700">{r.periode}</td>
                  <td className="px-3 py-3 text-xs">
                    <span className="text-slate-600 tabular-nums">
                      {new Date(r.deadline).toLocaleDateString("fr-CI")}
                    </span>
                    {ds && (
                      <span className={`block mt-1 px-1.5 py-0.5 rounded text-[10px] ${ds.tone} inline-block`}>
                        {ds.label}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-700">{r.nb_salaries ?? 0}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-medium text-slate-900">{fcfa(r.total)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {r.penalite > 0 ? <span className="text-rose-700">{fcfa(r.penalite)}</span> : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${STATUT_LABELS[r.statut].tone}`}>
                      {STATUT_LABELS[r.statut].label}
                    </span>
                    {r.numero_recepisse && (
                      <p className="text-[10px] text-slate-500 mt-0.5">N° {r.numero_recepisse}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {r.statut !== "soumis" && (
                      <button
                        onClick={() => onMarkSubmitted(r.id, kindClass)}
                        disabled={submittingId === r.id}
                        className="text-xs px-3 h-8 rounded-md border border-slate-200 bg-white hover:bg-slate-50 font-medium text-slate-700 disabled:opacity-50"
                      >
                        {submittingId === r.id ? "…" : "Marquer soumis"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <ul className="md:hidden divide-y divide-slate-100">
        {rows.map((r) => {
          const ds = deadlineState(r.deadline, r.statut);
          return (
            <li key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{r.kind}</p>
                  <p className="text-xs text-slate-500 tabular-nums">{r.periode}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${STATUT_LABELS[r.statut].tone}`}>
                  {STATUT_LABELS[r.statut].label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-500">Échéance</p>
                  <p className="text-slate-900 tabular-nums">{new Date(r.deadline).toLocaleDateString("fr-CI")}</p>
                  {ds && <span className={`mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] ${ds.tone}`}>{ds.label}</span>}
                </div>
                <div className="text-right">
                  <p className="text-slate-500">{totalLabel}</p>
                  <p className="text-slate-900 font-semibold tabular-nums">{fcfa(r.total)}</p>
                  {r.penalite > 0 && <p className="text-[10px] text-rose-700 tabular-nums">+ {fcfa(r.penalite)} pénalité</p>}
                </div>
              </div>
              {r.statut !== "soumis" && (
                <button
                  onClick={() => onMarkSubmitted(r.id, kindClass)}
                  disabled={submittingId === r.id}
                  className="mt-3 w-full text-xs px-3 h-8 rounded-md bg-[#ee7f03] hover:bg-[#d67002] border-0 text-white disabled:opacity-50 transition-colors"
                >
                  {submittingId === r.id ? "…" : "Marquer comme soumis"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PreviewDialog({
  data, onClose, onConfirm, generating,
}: {
  data: PreviewData;
  onClose: () => void;
  onConfirm: () => void;
  generating: boolean;
}) {
  const isCurrency = (col: string): boolean => {
    const lower = col.toLowerCase();
    return (
      lower.includes("salair") ||
      lower.includes("brut") ||
      lower.includes("base") ||
      lower.includes("cnps") ||
      lower.includes("retraite") ||
      lower.includes("famil") ||
      lower.includes("matern") ||
      lower.includes("at/mp") ||
      lower.includes("cmu") ||
      lower.includes("its") ||
      lower.includes("contribution") ||
      lower.includes("abattement") ||
      lower.includes("imposable")
    );
  };

  const formatCell = (val: string | number, col: string): string => {
    if (typeof val === "number") {
      return isCurrency(col)
        ? new Intl.NumberFormat("fr-CI", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val)
        : new Intl.NumberFormat("fr-CI").format(val);
    }
    return String(val ?? "");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-200">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">
              Prévisualisation — non encore archivée
            </p>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 mt-0.5">
              {data.kind} · {data.periode}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">
              {data.company.raison_sociale} · NCNPS {data.company.cnps_matricule || "—"} · NCC {data.company.ncc || "—"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 -m-1"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Bandeau totaux */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 sm:px-6 py-4 bg-slate-50/60 border-b border-slate-100">
          <SummaryCell label="Salariés" value={data.totals.nb_salaries.toString()} />
          {data.isSocial ? (
            <>
              <SummaryCell label="Brut total" value={fcfa(data.totals.total_brut)} />
              <SummaryCell label="Cotisations" value={fcfa(data.totals.total_cotisations)} accent="primary" />
            </>
          ) : (
            <>
              <SummaryCell label="Assiette" value={fcfa(data.totals.total_assiette)} />
              <SummaryCell label="Retenue" value={fcfa(data.totals.total_retenu)} accent="primary" />
            </>
          )}
          <SummaryCell
            label="Échéance"
            value={new Date(data.deadline).toLocaleDateString("fr-CI")}
            accent={new Date(data.deadline) < new Date() ? "danger" : "neutral"}
          />
        </div>

        {data.totals.penalite > 0 && (
          <div className="px-5 sm:px-6 py-2.5 bg-rose-50/60 border-b border-rose-200 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-900 leading-relaxed">
              <span className="font-semibold">Pénalité de retard estimée : {fcfa(data.totals.penalite)}.</span>{" "}
              Calcul Art. 47 CPS — 5 % du dû dès le 1er jour de retard, +1 %/mois supplémentaire.
            </p>
          </div>
        )}

        {/* Tableau */}
        <div className="flex-1 overflow-auto">
          {data.rows.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              Aucune ligne pour cette période.
            </div>
          ) : (
            <table className="min-w-full text-xs">
              <thead className="bg-slate-100/80 text-[11px] uppercase tracking-wider text-slate-600 font-medium sticky top-0">
                <tr>
                  <th className="px-3 py-2.5 text-left w-10 tabular-nums text-slate-400">#</th>
                  {data.columns.map((c) => (
                    <th
                      key={c}
                      className={[
                        "px-3 py-2.5 whitespace-nowrap",
                        isCurrency(c) ? "text-right" : "text-left",
                      ].join(" ")}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#ee7f03]/[0.04]">
                    <td className="px-3 py-2 text-slate-400 tabular-nums">{idx + 1}</td>
                    {data.columns.map((c) => {
                      const v = row[c];
                      const numeric = isCurrency(c);
                      return (
                        <td
                          key={c}
                          className={[
                            "px-3 py-2 whitespace-nowrap",
                            numeric
                              ? "text-right tabular-nums font-medium text-slate-900"
                              : "text-slate-700",
                          ].join(" ")}
                        >
                          {formatCell(v, c)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 sticky bottom-0">
                <tr>
                  <td className="px-3 py-2.5 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                    Total
                  </td>
                  {data.columns.map((c) => {
                    if (!isCurrency(c)) {
                      return <td key={c} />;
                    }
                    const sum = data.rows.reduce(
                      (s, r) => s + (typeof r[c] === "number" ? (r[c] as number) : 0),
                      0
                    );
                    return (
                      <td
                        key={c}
                        className="px-3 py-2.5 text-right tabular-nums font-semibold text-slate-900"
                      >
                        {formatCell(sum, c)}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-5 sm:px-6 py-4 border-t border-slate-200 bg-white">
          <p className="text-xs text-slate-500 sm:flex-1 leading-snug">
            Vérifiez les chiffres avant génération. La déclaration sera archivée
            (statut « Généré ») et le CSV téléchargé pour soumission E-CNPS / DGI.
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={generating}
              className="h-9 inline-flex items-center justify-center gap-2 rounded-md bg-[#ee7f03] hover:bg-[#d67002] border-0 px-4 text-sm font-medium text-white disabled:opacity-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              {generating ? "Archivage…" : "Confirmer & télécharger"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCell({
  label, value, accent,
}: {
  label: string; value: string; accent?: "primary" | "danger" | "neutral";
}) {
  const valueColor =
    accent === "primary" ? "text-[#ee7f03] font-semibold" :
    accent === "danger" ? "text-rose-700 font-semibold" :
    "text-slate-900";
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</p>
      <p className={`text-sm sm:text-base tabular-nums mt-0.5 ${valueColor}`}>{value}</p>
    </div>
  );
}

function CalendarReference() {
  const items = [
    {
      kind: "DIPE",
      desc: "Déclaration mensuelle des paies — fichier E-CNPS",
      cadence: "Le 15 du mois M+1",
      legal: "Code Prévoyance Sociale Loi 99-477",
      icon: Building2,
    },
    {
      kind: "ITS / IGR / CN",
      desc: "Bordereau de versement DGI — retenues à la source",
      cadence: "Le 15 du mois M+1",
      legal: "CGI CI Art. 116 (Réforme 2024)",
      icon: ShieldCheck,
    },
    {
      kind: "DISA",
      desc: "Déclaration Individuelle des Salaires Annuels",
      cadence: "Le 31 mars de l'année N+1",
      legal: "Code Prévoyance Sociale",
      icon: CalendarIcon,
    },
    {
      kind: "DASC",
      desc: "Déclaration Annuelle des Salaires et Cotisations",
      cadence: "Le 31 mars de l'année N+1",
      legal: "Code Prévoyance Sociale",
      icon: CalendarIcon,
    },
    {
      kind: "État ITS annuel",
      desc: "Récapitulatif annuel des retenues ITS",
      cadence: "Le 31 mars de l'année N+1",
      legal: "CGI CI",
      icon: CalendarIcon,
    },
  ];
  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 flex gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-semibold">Pénalités CNPS — Art. 47 CPS :</span> 5 % du dû dès le 1er jour
          de retard, plus 1 % supplémentaire par mois additionnel. RH Manager
          calcule automatiquement la pénalité estimée pour chaque déclaration en retard.
        </div>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {items.map(({ kind, desc, cadence, legal, icon: Icon }) => (
          <li key={kind} className="rounded-lg border border-slate-200 bg-white p-4 flex gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-700 shrink-0">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{kind}</p>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{desc}</p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                <CheckCircle2 className="h-3 w-3" />
                <span>{cadence}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">{legal}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
