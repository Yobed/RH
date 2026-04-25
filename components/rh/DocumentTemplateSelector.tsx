"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DOCUMENT_TEMPLATES } from "@/lib/templates";

type Employee = { id: string; full_name: string; poste: string; matricule: string | null };

const selectClass = "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[oklch(0.22_0.03_248)] px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[oklch(0.38_0.10_252/0.3)]";

const groups = Array.from(new Set(DOCUMENT_TEMPLATES.map((t) => t.group)));

export function DocumentTemplateSelector() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [customVars, setCustomVars] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ document: string; label: string; employee: string } | null>(null);
  const [showResult, setShowResult] = useState(false);

  const template = DOCUMENT_TEMPLATES.find((t) => t.id === templateId);

  useEffect(() => {
    fetch("/api/employees?limit=200")
      .then((r) => r.json())
      .then((d: unknown) => { if (Array.isArray(d)) setEmployees(d as Employee[]); })
      .catch(() => {});
  }, []);

  // Reset custom vars when template changes
  useEffect(() => {
    setCustomVars({});
  }, [templateId]);

  async function generate() {
    if (!templateId || !employeeId) {
      toast.error("Sélectionnez un modèle et un employé");
      return;
    }
    const requiredMissing = template?.variables_custom
      .filter((v) => v.required && !customVars[v.key]?.trim())
      .map((v) => v.label);
    if (requiredMissing && requiredMissing.length > 0) {
      toast.error(`Champs requis manquants : ${requiredMissing.join(", ")}`);
      return;
    }
    setLoading(true);
    setResult(null);
    setShowResult(false);
    try {
      const res = await fetch("/api/documents/generate-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: templateId, employee_id: employeeId, variables_custom: customVars }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Erreur serveur");
      }
      const data = (await res.json()) as { document: string; label: string; employee: string };
      setResult(data);
      setShowResult(true);
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

  return (
    <div className="flex h-full flex-col md:flex-row gap-0 overflow-hidden">
      {/* Formulaire */}
      <div className={cn(
        "shrink-0 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700 bg-white dark:bg-[oklch(0.18_0.03_248)] p-4 sm:p-5 space-y-4 overflow-y-auto",
        showResult ? "hidden md:block md:w-80" : "w-full md:w-80"
      )}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
            Modèle de document
          </p>
          <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={selectClass}>
            <option value="">— Choisir un modèle —</option>
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {DOCUMENT_TEMPLATES.filter((t) => t.group === g).map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
          {template && (
            <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500 italic">{template.description}</p>
          )}
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
            Employé concerné
          </p>
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={selectClass}>
            <option value="">— Choisir —</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.full_name} — {e.poste}</option>
            ))}
          </select>
        </div>

        {/* Variables personnalisées */}
        {template && template.variables_custom.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Informations complémentaires
            </p>
            {template.variables_custom.map((v) => (
              <div key={v.key}>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {v.label}{v.required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
                <input
                  type="text"
                  placeholder={v.placeholder}
                  value={customVars[v.key] ?? ""}
                  onChange={(e) => setCustomVars((prev) => ({ ...prev, [v.key]: e.target.value }))}
                  className={selectClass}
                />
              </div>
            ))}
          </div>
        )}

        <button
          onClick={generate}
          disabled={loading || !templateId || !employeeId}
          className={cn(
            "w-full rounded-xl py-3 text-sm font-semibold transition-all",
            loading || !templateId || !employeeId
              ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
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
          Conforme Code du Travail CI (Loi 2015-532) · Données réelles de l&apos;employé
        </p>
      </div>

      {/* Résultat */}
      <div className="flex flex-col bg-slate-50/60 dark:bg-[oklch(0.16_0.025_248)] flex-1 overflow-hidden">
        {!result && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 p-6 sm:p-8">
            <div className="h-14 w-14 rounded-2xl bg-[oklch(0.175_0.04_248/0.08)] flex items-center justify-center">
              <svg className="h-7 w-7 text-[oklch(0.38_0.10_252)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sélectionnez un modèle et un employé</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              {DOCUMENT_TEMPLATES.length} modèles disponibles — données réelles de l&apos;employé
            </p>
          </div>
        )}

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <span className="h-8 w-8 rounded-full border-2 border-[oklch(0.38_0.10_252)] border-t-transparent animate-spin" />
              <p className="text-sm text-slate-600 dark:text-slate-400">Génération du document…</p>
            </div>
          </div>
        )}

        {result && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-[oklch(0.18_0.03_248)] gap-2 flex-wrap">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{result.label}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{result.employee}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setShowResult(false)} className="md:hidden rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  ← Modifier
                </button>
                <button onClick={copyToClipboard} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Copier
                </button>
                <button onClick={downloadTxt} className="rounded-lg bg-[oklch(0.175_0.04_248)] px-3 py-1.5 text-xs font-semibold text-[oklch(0.78_0.13_73)] hover:opacity-90 transition-opacity">
                  .txt
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-white dark:bg-[oklch(0.18_0.03_248)] rounded-xl border border-slate-100 dark:border-slate-700 p-4 sm:p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
                {result.document}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
