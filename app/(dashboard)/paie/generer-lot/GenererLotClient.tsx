"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface PreviewLine {
  employee_id: string;
  employee_name: string;
  matricule: string;
  salaire_brut: number;
  total_brut: number;
  net_to_pay: number;
  warnings: string[];
}

interface PreviewResponse {
  periode: string;
  total_brut: number;
  total_net: number;
  nb_eligible: number;
  nb_existing: number;
  lines: PreviewLine[];
}

const fcfa = (n: number): string =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n);

function defaultPeriode(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function GenererLotClient() {
  const router = useRouter();
  const [periode, setPeriode] = useState(defaultPeriode());
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handlePreview(): Promise<void> {
    setLoading(true);
    setPreview(null);
    try {
      const res = await fetch("/api/paie/generer-lot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periode, preview: true }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Erreur");
        return;
      }
      const data = (await res.json()) as PreviewResponse;
      setPreview(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(): Promise<void> {
    if (!preview) return;
    setConfirming(true);
    try {
      const res = await fetch("/api/paie/generer-lot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periode, preview: false }),
      });
      const data = (await res.json()) as { ok?: boolean; nb_created?: number; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Erreur");
        return;
      }
      toast.success(`${data.nb_created} bulletin(s) créé(s) pour ${periode}`);
      setPreview(null);
      router.push("/paie");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="pb-4 border-b border-slate-200">
        <Link href="/paie" className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5">
          <ArrowLeft className="h-3 w-3" /> Retour à la paie
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <Zap className="h-5 w-5 text-slate-700" />
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">
            Paie · Cycle mensuel
          </p>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">
          Génération en lot — bulletins du mois
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-3xl leading-snug">
          Crée un bulletin pour chaque salarié actif en agrégeant automatiquement le
          salaire de base, la prime d'ancienneté, la provision 13<sup>e</sup>,
          les heures supplémentaires de la période et les absences non payées.
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-[200px_auto_auto] gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-slate-700">Période</label>
            <input
              type="month"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
            />
          </div>
          <button
            onClick={handlePreview}
            disabled={loading}
            className="h-9 inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Eye className="h-3.5 w-3.5" />
            {loading ? "Calcul…" : "Prévisualiser le mois"}
          </button>
          <button
            onClick={() => preview && handleConfirm()}
            disabled={!preview || confirming}
            className="h-9 inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <Zap className="h-3.5 w-3.5" />
            {confirming ? "Création…" : preview ? `Créer ${preview.nb_eligible - preview.nb_existing} bulletin(s)` : "Créer les bulletins"}
          </button>
        </div>
      </section>

      {preview && (
        <>
          {/* KPI résumé */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            <SummaryCard label="Salariés éligibles" value={preview.nb_eligible.toString()} accent="neutral" />
            <SummaryCard label="Bulletins existants" value={preview.nb_existing.toString()} accent={preview.nb_existing > 0 ? "warn" : "neutral"} sub="Seront ignorés" />
            <SummaryCard label="Brut total" value={fcfa(preview.total_brut)} accent="neutral" />
            <SummaryCard label="Net total à payer" value={fcfa(preview.total_net)} accent="primary" />
          </section>

          {/* Tableau */}
          <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Aperçu par salarié</h2>
                <p className="text-xs text-slate-500 mt-0.5">{preview.lines.length} ligne(s)</p>
              </div>
              {preview.lines.some((l) => l.warnings.length > 0) && (
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {preview.lines.filter((l) => l.warnings.length > 0).length} alerte(s)
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                  <tr>
                    <th className="text-left px-5 py-3">Salarié</th>
                    <th className="text-right px-3 py-3">Salaire de base</th>
                    <th className="text-right px-3 py-3">Brut total</th>
                    <th className="text-right px-3 py-3">Net à payer</th>
                    <th className="text-left px-5 py-3">Alertes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.lines.map((l) => (
                    <tr key={l.employee_id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900 truncate">{l.employee_name}</p>
                        <p className="text-xs text-slate-400 tabular-nums">{l.matricule}</p>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">{fcfa(l.salaire_brut)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">{fcfa(l.total_brut)}</td>
                      <td className="px-3 py-3 text-right tabular-nums font-semibold text-slate-900">{fcfa(l.net_to_pay)}</td>
                      <td className="px-5 py-3">
                        {l.warnings.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" /> OK
                          </span>
                        ) : (
                          <ul className="space-y-0.5">
                            {l.warnings.map((w, i) => (
                              <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                                <span>{w}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: "neutral" | "warn" | "primary" }) {
  const bar = { neutral: "bg-slate-200", warn: "bg-amber-500", primary: "bg-slate-900" }[accent];
  return (
    <div className="relative rounded-lg border border-slate-200 bg-white p-3.5 sm:p-5">
      <div className={`absolute left-0 top-3.5 bottom-3.5 sm:top-5 sm:bottom-5 w-0.5 rounded-r ${bar}`} />
      <p className="text-[11px] sm:text-xs text-slate-500 font-medium">{label}</p>
      <p className="mt-1 sm:mt-1.5 text-lg sm:text-2xl font-semibold text-slate-900 tabular-nums break-words">{value}</p>
      {sub && <p className="mt-1 text-[10px] sm:text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
