"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type MoisData = {
  periode: string;
  masse_brute: number;
  masse_nette: number;
  cnps_total: number;
  its_total: number;
  nb_bulletins: number;
};

type KpiRh = {
  effectif_actif: number;
  effectif_essai: number;
  turn_over_annee: number;
  conges_en_attente: number;
  score_eval_moyen: number | null;
  accidents_annee: number;
};

function formatFcfa(n: number) {
  return new Intl.NumberFormat("fr-CI", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " FCFA";
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
      <motion.div
        className={cn("h-full rounded-full", color)}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      />
    </div>
  );
}

function KpiBlock({ label, value, sub, index = 0 }: { label: string; value: string; sub?: string; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: index * 0.06 }}
      className="rounded-2xl border border-slate-100/80 bg-white p-5 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)]"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-3">{label}</p>
      <p className="text-3xl font-bold font-mono tabular-nums text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </motion.div>
  );
}

export function ReportingClient({
  masseSalariale,
  kpis,
}: {
  masseSalariale: MoisData[];
  kpis: KpiRh;
}) {
  const [exporting, setExporting] = useState(false);

  const maxBrute = Math.max(...masseSalariale.map((m) => m.masse_brute), 1);
  const totalAnnee = masseSalariale.reduce((s, m) => s + m.masse_brute, 0);
  const moyenneMensuelle = masseSalariale.length > 0 ? totalAnnee / masseSalariale.length : 0;

  async function exportCsv() {
    setExporting(true);
    try {
      const res = await fetch("/api/reporting/export");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporting-rh-${new Date().getFullYear()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export téléchargé");
    } catch {
      toast.error("Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiBlock label="Effectif actif" value={String(kpis.effectif_actif)} index={0} />
        <KpiBlock label="En période d'essai" value={String(kpis.effectif_essai)} index={1} />
        <KpiBlock
          label="Turn-over annuel"
          value={`${kpis.turn_over_annee}%`}
          sub={`Départs ${new Date().getFullYear()}`}
          index={2}
        />
        <KpiBlock label="Congés en attente" value={String(kpis.conges_en_attente)} sub="À valider" index={3} />
        <KpiBlock
          label="Score évaluations"
          value={kpis.score_eval_moyen !== null ? `${kpis.score_eval_moyen}/20` : "—"}
          sub="Moyenne annuelle"
          index={4}
        />
        <KpiBlock label="Accidents AT" value={String(kpis.accidents_annee)} sub={`Année ${new Date().getFullYear()}`} index={5} />
      </div>

      {/* Header + export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Masse salariale — 12 derniers mois</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Total : {formatFcfa(totalAnnee)} · Moyenne mensuelle : {formatFcfa(Math.round(moyenneMensuelle))}
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={exporting}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-60"
        >
          {exporting ? "Export…" : "Exporter CSV"}
        </button>
      </div>

      {/* Monthly bar chart (CSS-based) */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
        {masseSalariale.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Aucun bulletin de paie enregistré</p>
        ) : (
          <div className="space-y-3">
            {masseSalariale.map((m, i) => (
              <motion.div
                key={m.periode}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04, ease: [0.23, 1, 0.32, 1] }}
                className="grid grid-cols-[60px_1fr_100px] sm:grid-cols-[80px_1fr_140px] items-center gap-2 sm:gap-4"
              >
                <span className="font-mono text-[11px] text-slate-500 tabular-nums">{m.periode}</span>
                <MiniBar value={m.masse_brute} max={maxBrute} color="bg-[oklch(0.38_0.10_252)]" />
                <span className="font-mono text-[11px] tabular-nums text-slate-700 text-right">
                  {formatFcfa(m.masse_brute)}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail table */}
      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {["Période", "Bulletins", "Masse brute", "Masse nette", "CNPS salarié", "ITS", "Coût employeur"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {masseSalariale.map((m) => (
              <tr key={m.periode} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-600 tabular-nums">{m.periode}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500 text-center tabular-nums">{m.nb_bulletins}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-800 tabular-nums">{formatFcfa(m.masse_brute)}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600 tabular-nums">{formatFcfa(m.masse_nette)}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500 tabular-nums">{formatFcfa(m.cnps_total)}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500 tabular-nums">{formatFcfa(m.its_total)}</td>
                <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700 tabular-nums">
                  {formatFcfa(Math.round(m.masse_brute * 1.185))}
                </td>
              </tr>
            ))}
          </tbody>
          {masseSalariale.length > 0 && (
            <tfoot className="border-t-2 border-slate-200 bg-slate-50">
              <tr>
                <td className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Total</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500 tabular-nums text-center">
                  {masseSalariale.reduce((s, m) => s + m.nb_bulletins, 0)}
                </td>
                <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800 tabular-nums">{formatFcfa(totalAnnee)}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600 tabular-nums">{formatFcfa(masseSalariale.reduce((s, m) => s + m.masse_nette, 0))}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500 tabular-nums">{formatFcfa(masseSalariale.reduce((s, m) => s + m.cnps_total, 0))}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500 tabular-nums">{formatFcfa(masseSalariale.reduce((s, m) => s + m.its_total, 0))}</td>
                <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700 tabular-nums">{formatFcfa(Math.round(totalAnnee * 1.185))}</td>
              </tr>
            </tfoot>
          )}
        </table>
        </div>
      </div>
    </div>
  );
}
