"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

interface Props {
  onSuccess?: () => void;
}

type ModalState = "idle" | "preview" | "importing" | "done";

const ALLOWED_TYPES = ["CDI", "CDD", "STAGE", "APPRENTISSAGE"] as const;

interface PreviewRow {
  index: number;
  matricule: string;
  full_name: string;
  poste: string;
  salaire_brut: number | null;
  type_contrat: string;
  statut: string;
  error: string | null;
}

function parseDate(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === "number") {
    const date = XLSX.SSF.parse_date_code(raw);
    if (!date) return null;
    return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
  }
  const str = String(raw).trim();
  const ddmm = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmm) return `${ddmm[3]}-${ddmm[2].padStart(2, "0")}-${ddmm[1].padStart(2, "0")}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  return null;
}

function parseSalary(val: unknown): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  let s = String(val).toUpperCase().replace(/[\s﻿\xA0FCFA]/g, "");
  s = s.replace(",", ".");
  const parts = s.split(".");
  if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
    s = parts.join("");
  }
  const parsed = parseFloat(s);
  return isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

function validateRow(row: Record<string, unknown>, index: number): PreviewRow {
  const full_name = String(row["full_name"] ?? "").trim();
  const date_embauche_raw = row["date_embauche"];
  const salaire_brut_raw = parseSalary(row["salaire_brut"]);
  const type_contrat = String(row["type_contrat"] ?? "CDI").trim().toUpperCase();
  const matricule = String(row["matricule"] ?? "").trim();
  const poste = String(row["poste"] ?? "").trim();
  const statut = String(row["statut"] ?? "actif").trim().toLowerCase() === "inactif" ? "inactif" : "actif";

  let error: string | null = null;

  if (!full_name) {
    error = "full_name manquant";
  } else if (!date_embauche_raw) {
    error = "date_embauche manquante";
  } else if (parseDate(date_embauche_raw) === null) {
    error = "date_embauche invalide";
  } else if (salaire_brut_raw <= 0) {
    error = "salaire_brut invalide";
  } else if (!(ALLOWED_TYPES as readonly string[]).includes(type_contrat)) {
    error = `type_contrat '${type_contrat}' invalide`;
  }

  return {
    index,
    matricule,
    full_name,
    poste,
    salaire_brut: salaire_brut_raw > 0 ? salaire_brut_raw : null,
    type_contrat,
    statut,
    error,
  };
}

function parseFileToPreview(file: File): Promise<PreviewRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buf = e.target?.result;
        if (!buf || typeof buf === "string") {
          reject(new Error("Lecture fichier échouée"));
          return;
        }
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
        resolve(rows.map((row, i) => validateRow(row, i)));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Erreur de lecture"));
    reader.readAsArrayBuffer(file);
  });
}

const salaryFormatter = new Intl.NumberFormat("fr-CI", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});

export function ImportExcelModal({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<ModalState>("idle");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors?: string[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
      toast.error("Format non supporté. Utilisez .xlsx, .xls ou .csv");
      return;
    }
    setFile(f);
    setParsing(true);
    try {
      const rows = await parseFileToPreview(f);
      if (rows.length === 0) {
        toast.error("Le fichier est vide");
        setParsing(false);
        return;
      }
      setPreview(rows);
      setState("preview");
    } catch {
      toast.error("Impossible de lire le fichier");
    } finally {
      setParsing(false);
    }
  }

  async function doImport() {
    if (!file) return;
    setState("importing");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/import/employees", { method: "POST", body: fd });
      const data = (await res.json()) as {
        imported?: number;
        skipped?: number;
        errors?: string[];
        error?: string;
        details?: string[];
      };
      if (!res.ok) {
        toast.error(data.error ?? "Erreur import");
        setResult({ imported: 0, skipped: 0, errors: data.details });
      } else {
        setResult({ imported: data.imported ?? 0, skipped: data.skipped ?? 0, errors: data.errors });
        toast.success(`${data.imported} employé(s) importé(s)`);
        onSuccess?.();
      }
      setState("done");
    } catch {
      toast.error("Erreur réseau");
      setState("preview");
    }
  }

  function reset() {
    setFile(null);
    setPreview([]);
    setResult(null);
    setState("idle");
  }

  function closeModal() {
    setOpen(false);
    reset();
  }

  const validRows = preview.filter((r) => r.error === null);
  const errorRows = preview.filter((r) => r.error !== null);

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

  const modalWidth = state === "preview" ? "max-w-4xl" : "max-w-lg";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
      <div className={cn("relative z-10 w-full rounded-2xl bg-white dark:bg-[oklch(0.18_0.03_248)] shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]", modalWidth)}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Import employés</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {state === "idle" && "Excel (.xlsx) ou CSV"}
              {state === "preview" && `${preview.length} ligne${preview.length > 1 ? "s" : ""} détectée${preview.length > 1 ? "s" : ""}`}
              {state === "importing" && "Import en cours…"}
              {state === "done" && "Import terminé"}
            </p>
          </div>
          <button onClick={closeModal} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {/* IDLE STATE */}
          {state === "idle" && (
            <div className="p-5 space-y-4">
              <a
                href="/api/import/employees/template"
                download
                className="flex items-center gap-3 rounded-xl border border-dashed border-[#FF8200]/30 bg-[#FF8200]/5 px-4 py-3 text-sm text-[#FF8200] hover:bg-[#FF8200]/10 transition-colors"
              >
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <div>
                  <p className="font-semibold">Télécharger le modèle Excel</p>
                  <p className="text-[11px] opacity-70">template_import_employes.xlsx — colonnes requises</p>
                </div>
              </a>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "cursor-pointer rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
                  dragging
                    ? "border-[#FF8200] bg-amber-50/40 dark:bg-amber-900/10"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                )}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                {parsing ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="h-6 w-6 rounded-full border-2 border-slate-400 border-t-[#FF8200] animate-spin" />
                    <p className="text-sm text-slate-500">Analyse du fichier…</p>
                  </div>
                ) : (
                  <div>
                    <svg className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Glissez votre fichier ici ou{" "}
                      <span className="text-[#FF8200] font-semibold">cliquez pour sélectionner</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">.xlsx, .xls, .csv</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}

          {/* PREVIEW STATE */}
          {state === "preview" && (
            <div className="p-5 space-y-4">
              {/* Counter */}
              <div className="flex items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-emerald-700 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {validRows.length} ligne{validRows.length > 1 ? "s" : ""} valide{validRows.length > 1 ? "s" : ""}
                </span>
                {errorRows.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-rose-700 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    {errorRows.length} ligne{errorRows.length > 1 ? "s" : ""} avec erreur
                  </span>
                )}
              </div>

              {/* Table */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-500 w-8">#</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Matricule</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Nom</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Poste</th>
                        <th className="text-right px-3 py-2.5 font-semibold text-slate-500">Salaire brut</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Contrat</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {preview.map((row) => (
                        <tr
                          key={row.index}
                          className={cn(
                            row.error
                              ? "bg-rose-50 dark:bg-rose-900/10"
                              : "bg-white dark:bg-transparent"
                          )}
                        >
                          <td className="px-3 py-2 text-slate-400 tabular-nums">{row.index + 2}</td>
                          <td className="px-3 py-2 text-slate-600 font-mono">{row.matricule || "—"}</td>
                          <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200 max-w-[160px] truncate">
                            {row.full_name || <span className="text-rose-400 italic">vide</span>}
                          </td>
                          <td className="px-3 py-2 text-slate-500 max-w-[120px] truncate">{row.poste || "—"}</td>
                          <td className="px-3 py-2 text-right text-slate-700 tabular-nums font-mono">
                            {row.salaire_brut !== null
                              ? salaryFormatter.format(row.salaire_brut)
                              : <span className="text-rose-400">—</span>}
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-block rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-slate-600 dark:text-slate-300 font-medium">
                              {row.type_contrat || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {row.error ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 px-2 py-0.5 text-rose-700 dark:text-rose-400 font-medium text-[11px] max-w-[160px]">
                                <svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                </svg>
                                <span className="truncate">{row.error}</span>
                              </span>
                            ) : (
                              <span className={cn(
                                "inline-block rounded-full px-2 py-0.5 font-medium text-[11px]",
                                row.statut === "actif"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              )}>
                                {row.statut}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={reset}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Modifier le fichier
                </button>
                <button
                  onClick={doImport}
                  disabled={validRows.length === 0}
                  className={cn(
                    "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all",
                    validRows.length === 0
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                      : "bg-[#FF8200] text-white hover:bg-[#E06D00] shadow-sm"
                  )}
                >
                  Confirmer l&apos;import ({validRows.length} ligne{validRows.length > 1 ? "s" : ""})
                </button>
              </div>
            </div>
          )}

          {/* IMPORTING STATE */}
          {state === "importing" && (
            <div className="p-12 flex flex-col items-center gap-4">
              <span className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-[#FF8200] animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Import en cours…</p>
            </div>
          )}

          {/* DONE STATE */}
          {state === "done" && result && (
            <div className="p-5 space-y-4">
              <div className={cn(
                "rounded-xl border px-4 py-4 text-sm",
                result.errors && result.errors.length > 0
                  ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
                  : "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  {result.errors && result.errors.length > 0 ? (
                    <svg className="h-5 w-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  )}
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {result.imported} employé{result.imported > 1 ? "s" : ""} importé{result.imported > 1 ? "s" : ""}
                    {result.skipped > 0 && ` · ${result.skipped} ligne${result.skipped > 1 ? "s" : ""} ignorée${result.skipped > 1 ? "s" : ""}`}
                  </p>
                </div>
                {result.errors && result.errors.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-xs text-amber-700 dark:text-amber-400">
                    {result.errors.slice(0, 10).map((e, i) => <li key={i}>• {e}</li>)}
                    {result.errors.length > 10 && <li>…et {result.errors.length - 10} autres erreurs</li>}
                  </ul>
                )}
              </div>

              <button
                onClick={closeModal}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
