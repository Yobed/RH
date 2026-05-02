"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Banknote, AlertTriangle, FileSpreadsheet, FileCode } from "lucide-react";
import { toast } from "sonner";

interface Bordereau {
  id: string;
  periode: string;
  format_export: string;
  total_montant: number | null;
  nb_virements: number | null;
  nb_rib_manquants: number | null;
  date_generation: string | null;
  date_envoi: string | null;
  banque_destinatrice: string | null;
}

interface Props {
  periods: string[];
  bordereaux: Bordereau[];
}

const fcfa = (n: number | null | undefined): string =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n ?? 0);

export function BordereauClient({ periods, bordereaux }: Props) {
  const router = useRouter();
  const [periode, setPeriode] = useState(periods[0] ?? "");
  const [format, setFormat] = useState<"CSV" | "XML_SCT">("CSV");
  const [banque, setBanque] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGenerate(): Promise<void> {
    if (!periode) {
      toast.error("Sélectionnez une période.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/paie/bordereau-virement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periode, format_export: format, banque_destinatrice: banque || undefined }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Erreur");
        return;
      }
      const ribMissing = res.headers.get("X-RIB-Missing");
      const total = res.headers.get("X-Total");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ext = format === "XML_SCT" ? "xml" : "csv";
      a.href = url;
      a.download = `bordereau_${periode}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const warn = ribMissing && Number(ribMissing) > 0
        ? ` ⚠ ${ribMissing} RIB manquants — à compléter avant envoi à la banque.`
        : "";
      toast.success(`Bordereau ${periode} généré (${fcfa(Number(total ?? 0))}).${warn}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="pb-4 border-b border-slate-200">
        <Link href="/paie" className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5">
          <ArrowLeft className="h-3 w-3" /> Retour à la paie
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <Banknote className="h-5 w-5 text-slate-700" />
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">
            Paie · Mise en paiement
          </p>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">
          Bordereau de virement
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-3xl leading-snug">
          Génération du fichier à transmettre à la banque pour le paiement
          des salaires nets. Format CSV (toutes banques CI) ou XML SCT (norme ISO 20022).
        </p>
      </header>

      {/* Génération */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Générer un bordereau</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Récupère automatiquement les nets à payer du mois sélectionné.
          </p>
        </div>
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-[160px_1fr_1fr_auto] gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-slate-700">Période</label>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            >
              {periods.length === 0 && <option value="">— Aucun bulletin —</option>}
              {periods.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">Format d'export</label>
            <div className="mt-1 inline-flex w-full rounded-md border border-slate-200 bg-white p-0.5">
              {([
                { v: "CSV" as const, label: "CSV", icon: FileSpreadsheet },
                { v: "XML_SCT" as const, label: "XML SCT", icon: FileCode },
              ]).map(({ v, label, icon: Icon }) => (
                <button
                  key={v}
                  onClick={() => setFormat(v)}
                  className={[
                    "flex-1 inline-flex items-center justify-center gap-1.5 h-7 rounded text-xs font-medium",
                    format === v ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">Banque destinatrice</label>
            <input
              type="text"
              value={banque}
              onChange={(e) => setBanque(e.target.value)}
              placeholder="Ex : Société Générale CI"
              className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || !periode}
            className="h-9 inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {loading ? "Génération…" : "Générer & télécharger"}
          </button>
        </div>
        <div className="px-4 sm:px-5 pb-4 text-xs text-slate-500 leading-snug flex gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
          <span>
            Les salariés sans RIB ni mobile money sont automatiquement détectés.
            Le compteur s'affiche dans la notification après génération.
          </span>
        </div>
      </section>

      {/* Historique */}
      <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Historique</h2>
          <p className="text-xs text-slate-500 mt-0.5">{bordereaux.length} bordereau{bordereaux.length > 1 ? "x" : ""} archivé{bordereaux.length > 1 ? "s" : ""}</p>
        </div>
        {bordereaux.length === 0 ? (
          <div className="p-12 text-center">
            <Banknote className="h-7 w-7 text-slate-300 mx-auto mb-2.5" />
            <p className="text-sm font-medium text-slate-700">Aucun bordereau généré</p>
            <p className="text-xs text-slate-500 mt-1">Utilisez le bloc ci-dessus pour générer votre premier fichier de virement.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                <tr>
                  <th className="text-left px-5 py-3">Période</th>
                  <th className="text-left px-3 py-3">Format</th>
                  <th className="text-left px-3 py-3">Banque</th>
                  <th className="text-right px-3 py-3">Nb virements</th>
                  <th className="text-right px-3 py-3">Total</th>
                  <th className="text-right px-3 py-3">RIB manquants</th>
                  <th className="text-left px-5 py-3">Généré le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bordereaux.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-medium text-slate-900 tabular-nums">{b.periode}</td>
                    <td className="px-3 py-3 text-slate-600">{b.format_export}</td>
                    <td className="px-3 py-3 text-slate-600">{b.banque_destinatrice ?? "—"}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">{b.nb_virements ?? 0}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-medium text-slate-900">{fcfa(b.total_montant)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {(b.nb_rib_manquants ?? 0) > 0
                        ? <span className="text-rose-700 font-medium">{b.nb_rib_manquants}</span>
                        : <span className="text-emerald-600">0</span>}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 tabular-nums">
                      {b.date_generation ? new Date(b.date_generation).toLocaleString("fr-CI") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
