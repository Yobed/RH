"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  onSuccess?: () => void;
}

export function ImportExcelModal({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors?: string[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
      toast.error("Format non supporté. Utilisez .xlsx, .xls ou .csv");
      return;
    }
    setFile(f);
    setResult(null);
  }

  async function doImport() {
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/import/employees", { method: "POST", body: fd });
      const data = (await res.json()) as { imported?: number; skipped?: number; errors?: string[]; error?: string; details?: string[] };
      if (!res.ok) {
        toast.error(data.error ?? "Erreur import");
        if (data.details) setResult({ imported: 0, skipped: 0, errors: data.details });
      } else {
        setResult({ imported: data.imported ?? 0, skipped: data.skipped ?? 0, errors: data.errors });
        toast.success(`${data.imported} employé(s) importé(s)`);
        onSuccess?.();
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[oklch(0.22_0.03_248)] px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[oklch(0.25_0.03_248)] transition-colors shadow-sm"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
        Importer Excel / CSV
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setOpen(false); reset(); }} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-[oklch(0.18_0.03_248)] shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Import employés</h2>
            <p className="text-xs text-slate-500 dark:text-slate-600 mt-0.5">Excel (.xlsx) ou CSV</p>
          </div>
          <button onClick={() => { setOpen(false); reset(); }} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Template download */}
          <a
            href="/api/import/employees/template"
            download
            className="flex items-center gap-3 rounded-xl border border-dashed border-[oklch(0.38_0.10_252/0.3)] bg-[oklch(0.38_0.10_252/0.04)] px-4 py-3 text-sm text-[oklch(0.38_0.10_252)] hover:bg-[oklch(0.38_0.10_252/0.08)] transition-colors"
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <div>
              <p className="font-semibold">Télécharger le modèle Excel</p>
              <p className="text-[11px] opacity-70">template_import_employes.xlsx — colonnes requises</p>
            </div>
          </a>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "cursor-pointer rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
              dragging
                ? "border-[oklch(0.78_0.13_73)] bg-amber-50/40 dark:bg-amber-900/10"
                : file
                ? "border-emerald-300 bg-emerald-50/40 dark:border-emerald-700 dark:bg-emerald-900/10"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            )}
          >
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {file ? (
              <div>
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">{file.name}</p>
                <p className="text-xs text-slate-600 mt-1">{(file.size / 1024).toFixed(1)} Ko</p>
                <button onClick={(e) => { e.stopPropagation(); reset(); }} className="mt-2 text-xs text-slate-600 hover:text-red-500 transition-colors">
                  Changer de fichier
                </button>
              </div>
            ) : (
              <div>
                <svg className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <p className="text-sm text-slate-500 dark:text-slate-600">Glissez votre fichier ici ou <span className="text-[oklch(0.38_0.10_252)] font-medium">cliquez pour sélectionner</span></p>
                <p className="text-xs text-slate-600 mt-1">.xlsx, .xls, .csv</p>
              </div>
            )}
          </div>

          {/* Résultat */}
          {result && (
            <div className={cn(
              "rounded-xl border px-4 py-3 text-sm",
              result.errors && result.errors.length > 0
                ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
                : "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
            )}>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {result.imported} employé(s) importé(s) · {result.skipped} ligne(s) ignorée(s)
              </p>
              {result.errors && result.errors.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-amber-700 dark:text-amber-400">
                  {result.errors.slice(0, 10).map((e, i) => <li key={i}>• {e}</li>)}
                  {result.errors.length > 10 && <li>…et {result.errors.length - 10} autres erreurs</li>}
                </ul>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => { setOpen(false); reset(); }}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={doImport}
              disabled={!file || loading}
              className={cn(
                "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all",
                !file || loading
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-[oklch(0.175_0.04_248)] text-[oklch(0.78_0.13_73)] hover:opacity-90"
              )}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Import en cours…
                </span>
              ) : "Importer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
