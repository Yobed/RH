"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Employee = { id: string; full_name: string; poste: string; matricule: string | null };

const DOC_TYPES = [
  { value: "convocation_entretien_prealable", label: "Convocation entretien préalable", group: "Disciplinaire" },
  { value: "lettre_licenciement_personnel", label: "Licenciement motif personnel", group: "Disciplinaire" },
  { value: "lettre_licenciement_economique", label: "Licenciement économique", group: "Disciplinaire" },
  { value: "mise_en_demeure_abandon_poste", label: "Mise en demeure abandon de poste", group: "Disciplinaire" },
  { value: "avertissement", label: "Avertissement", group: "Disciplinaire" },
  { value: "lettre_demission_acceptee", label: "Accusé de réception démission", group: "Contractuel" },
  { value: "lettre_fin_cdd", label: "Fin de CDD", group: "Contractuel" },
  { value: "lettre_renouvellement_essai", label: "Renouvellement période d'essai", group: "Contractuel" },
  { value: "attestation_travail", label: "Attestation de travail", group: "Attestations" },
  { value: "attestation_salaire", label: "Attestation de salaire", group: "Attestations" },
] as const;

type DocType = typeof DOC_TYPES[number]["value"];

export function DocumentDrafter() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [docType, setDocType] = useState<DocType | "">("");
  const [employeeId, setEmployeeId] = useState("");
  const [contexte, setContexte] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ document: string; label: string; employee: string } | null>(null);

  useEffect(() => {
    fetch("/api/employees?limit=200")
      .then((r) => r.json())
      .then((d: unknown) => {
        if (Array.isArray(d)) setEmployees(d as Employee[]);
      })
      .catch(() => {});
  }, []);

  async function generate() {
    if (!docType || !employeeId) {
      toast.error("Sélectionnez un type de document et un employé");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/rag/rediger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type_document: docType, employee_id: employeeId, contexte: contexte || undefined }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Erreur serveur");
      }
      const data = (await res.json()) as { document: string; label: string; employee: string };
      setResult(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    if (!result) return;
    navigator.clipboard.writeText(result.document);
    toast.success("Document copié");
  }

  function downloadTxt() {
    if (!result) return;
    const blob = new Blob([result.document], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.label.replace(/\s+/g, "_")}_${result.employee.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const groups = Array.from(new Set(DOC_TYPES.map((d) => d.group)));

  return (
    <div className="flex h-full flex-col md:flex-row gap-0">
      {/* Left panel — form */}
      <div className="w-full md:w-80 shrink-0 border-r bg-white p-5 space-y-5 overflow-y-auto">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Type de document</p>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType | "")}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[oklch(0.38_0.10_252/0.3)]"
          >
            <option value="">— Choisir —</option>
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {DOC_TYPES.filter((d) => d.group === g).map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Employé concerné</p>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[oklch(0.38_0.10_252/0.3)]"
          >
            <option value="">— Choisir —</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name} — {e.poste}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
            Contexte / motifs <span className="text-slate-300">(optionnel)</span>
          </p>
          <textarea
            value={contexte}
            onChange={(e) => setContexte(e.target.value)}
            placeholder="Ex : absences répétées non justifiées les 15 et 22 avril 2026, malgré un avertissement du 10 avril…"
            rows={4}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-[oklch(0.38_0.10_252/0.3)] placeholder:text-slate-300"
          />
        </div>

        <button
          onClick={generate}
          disabled={loading || !docType || !employeeId}
          className={cn(
            "w-full rounded-xl py-3 text-sm font-semibold transition-all",
            loading || !docType || !employeeId
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-[oklch(0.175_0.04_248)] text-[oklch(0.78_0.13_73)] hover:opacity-90 shadow-sm"
          )}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Génération…
            </span>
          ) : "Générer le document"}
        </button>

        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
          Document généré par IA · Conforme Code du Travail CI (Loi 2015-532) · Vérifiez toujours avec un juriste
        </p>
      </div>

      {/* Right panel — result */}
      <div className="flex-1 flex flex-col bg-slate-50/60 overflow-hidden">
        {!result && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 p-8">
            <div className="h-14 w-14 rounded-2xl bg-[oklch(0.175_0.04_248/0.08)] flex items-center justify-center">
              <svg className="h-7 w-7 text-[oklch(0.38_0.10_252)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600">Sélectionnez un type de document et un employé</p>
            <p className="text-xs text-slate-400 max-w-xs">Le document sera généré avec les données réelles de l&apos;employé et l&apos;en-tête de votre entreprise</p>
          </div>
        )}

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <span className="h-8 w-8 rounded-full border-2 border-[oklch(0.38_0.10_252)] border-t-transparent animate-spin" />
              <p className="text-sm text-slate-500">Rédaction en cours…</p>
            </div>
          </div>
        )}

        {result && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b bg-white">
              <div>
                <p className="text-xs font-semibold text-slate-700">{result.label}</p>
                <p className="text-[10px] text-slate-400">{result.employee}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Copier
                </button>
                <button
                  onClick={downloadTxt}
                  className="rounded-lg bg-[oklch(0.175_0.04_248)] px-3 py-1.5 text-xs font-semibold text-[oklch(0.78_0.13_73)] hover:opacity-90 transition-opacity"
                >
                  Télécharger .txt
                </button>
              </div>
            </div>
            {/* Document text */}
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed bg-white rounded-xl border border-slate-100 p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
                {result.document}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
