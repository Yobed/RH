"use client";

/**
 * components/rh/OvertimeImportDialog.tsx
 * ─────────────────────────────────────────────────────────────
 * Dialog drag-and-drop pour l'import Excel des heures supplémentaires.
 * Appelle GET /api/heures-sup/template (téléchargement)
 * et POST /api/heures-sup/import (envoi fichier).
 */

import React, { useCallback, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Upload, Download, FileSpreadsheet, CheckCircle2,
  AlertTriangle, X, Info, Loader2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ImportSuccess {
  success: true;
  import_batch_id: string;
  nb_employes: number;
  nb_lignes_paie: number;
  avertissements: string[];
  periode: string | null;
}

interface ImportError {
  error: string;
  details?: string[];
  avertissements?: string[];
}

type ImportResult = ImportSuccess | ImportError;

interface Props {
  onImported?: (batchId: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function isSuccess(r: ImportResult): r is ImportSuccess {
  return "success" in r && r.success === true;
}

// ── Composant principal ───────────────────────────────────────────────────────

export function OvertimeImportDialog({ onImported }: Props) {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Reset ──────────────────────────────────────────────────────────────────
  function reset() {
    setFile(null);
    setResult(null);
    setDragging(false);
  }

  function handleClose(v: boolean) {
    setOpen(v);
    if (!v) reset();
  }

  // ── Sélection fichier ──────────────────────────────────────────────────────
  function acceptFile(f: File) {
    if (!f.name.endsWith(".xlsx")) {
      toast.error("Seuls les fichiers .xlsx sont acceptés.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 5 Mo).");
      return;
    }
    setFile(f);
    setResult(null);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) acceptFile(f);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
    e.target.value = "";
  };

  // ── Téléchargement template ────────────────────────────────────────────────
  async function downloadTemplate() {
    setDownloading(true);
    try {
      const res = await fetch("/api/heures-sup/template");
      if (!res.ok) throw new Error("Erreur serveur");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("content-disposition") ?? "";
      const match = cd.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? "template_heures_sup.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Template téléchargé !");
    } catch {
      toast.error("Impossible de télécharger le template.");
    } finally {
      setDownloading(false);
    }
  }

  // ── Envoi fichier ──────────────────────────────────────────────────────────
  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/heures-sup/import", {
        method: "POST",
        body: fd,
      });

      const json: ImportResult = await res.json();
      setResult(json);

      if (isSuccess(json)) {
        toast.success(
          `Import réussi — ${json.nb_employes} employé${json.nb_employes > 1 ? "s" : ""}, `
          + `${json.nb_lignes_paie} ligne${json.nb_lignes_paie > 1 ? "s" : ""} créée${json.nb_lignes_paie > 1 ? "s" : ""}.`,
        );
        onImported?.(json.import_batch_id);
      }
    } catch {
      setResult({ error: "Erreur réseau — vérifiez votre connexion et réessayez." });
    } finally {
      setLoading(false);
    }
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────
  const successResult = result && isSuccess(result) ? result : null;
  const errorResult   = result && !isSuccess(result) ? result as ImportError : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <button
          id="btn-import-heures-sup"
          className="h-9 inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Upload className="h-4 w-4" />
          Importer Excel
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl p-0 bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden max-h-[92vh] overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-base font-semibold text-slate-900 flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white">
              <FileSpreadsheet className="h-4 w-4" />
            </span>
            Import Excel — Heures supplémentaires
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-1.5 leading-snug">
            Importez un fichier Excel pour mettre à jour les heures supplémentaires en masse.
            En cas d&apos;erreur sur une ligne, <strong>aucune donnée ne sera insérée</strong>.
          </p>
        </DialogHeader>

        <div className="p-6 space-y-5">

          {/* Étape 1 — Template */}
          <div className="rounded-lg border border-slate-200 p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Étape 1 — Télécharger le template
            </p>
            <p className="text-xs text-slate-500 leading-snug">
              Remplissez le fichier Excel avec les matricules, la période (YYYY-MM) et les heures
              par palier (+15%, +50%, +75%, +100%). Respectez le format des colonnes.
            </p>
            <button
              onClick={downloadTemplate}
              disabled={downloading}
              id="btn-download-template-hs"
              className="mt-1 h-9 inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              {downloading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Download className="h-4 w-4" />}
              {downloading ? "Téléchargement…" : "Télécharger le template (.xlsx)"}
            </button>
          </div>

          {/* Étape 2 — Zone dépôt */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Étape 2 — Déposer le fichier rempli
            </p>

            {!file ? (
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => inputRef.current?.click()}
                className={[
                  "relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center cursor-pointer transition-all select-none",
                  dragging
                    ? "border-[#f6c68a] bg-[#ee7f03]/10"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50",
                ].join(" ")}
              >
                <Upload className={`h-8 w-8 transition-colors ${dragging ? "text-[#ee7f03]" : "text-slate-300"}`} />
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {dragging ? "Relâchez pour importer" : "Glissez votre fichier ici"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    ou <span className="text-[#ee7f03] underline underline-offset-2">parcourir</span>
                    {" · "}Format <strong>.xlsx</strong> uniquement · Max 5 Mo
                  </p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={onInputChange}
                  className="sr-only"
                  id="input-file-import-hs"
                />
              </div>
            ) : (
              /* Aperçu fichier sélectionné */
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <FileSpreadsheet className="h-8 w-8 text-emerald-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{fmtSize(file.size)}</p>
                </div>
                <button
                  onClick={reset}
                  disabled={loading}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                  title="Retirer le fichier"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Résultat succès */}
          {successResult && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p className="text-sm font-semibold">Import réussi</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="rounded-md bg-white border border-emerald-100 px-3 py-2 text-center">
                  <p className="text-lg font-bold text-emerald-700 tabular-nums">{successResult.nb_employes}</p>
                  <p className="text-[11px] text-slate-500">Employé{successResult.nb_employes > 1 ? "s" : ""}</p>
                </div>
                <div className="rounded-md bg-white border border-emerald-100 px-3 py-2 text-center">
                  <p className="text-lg font-bold text-emerald-700 tabular-nums">{successResult.nb_lignes_paie}</p>
                  <p className="text-[11px] text-slate-500">Ligne{successResult.nb_lignes_paie > 1 ? "s" : ""} paie créée{successResult.nb_lignes_paie > 1 ? "s" : ""}</p>
                </div>
              </div>
              {successResult.periode && (
                <p className="text-xs text-slate-500">Période : <strong>{successResult.periode}</strong></p>
              )}
              {successResult.avertissements.length > 0 && (
                <AlertBanner
                  title={`${successResult.avertissements.length} avertissement${successResult.avertissements.length > 1 ? "s" : ""} (non bloquant${successResult.avertissements.length > 1 ? "s" : ""})`}
                  items={successResult.avertissements}
                  tone="warn"
                />
              )}
            </div>
          )}

          {/* Résultat erreur */}
          {errorResult && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 space-y-2">
              <div className="flex items-start gap-2 text-rose-700">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">{errorResult.error}</p>
                  {errorResult.details && errorResult.details.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {errorResult.details.map((d, i) => (
                        <li key={i} className="text-xs text-rose-700 leading-snug">· {d}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notice légale */}
          {!result && (
            <div className="flex items-start gap-2 rounded-md bg-[#ee7f03]/10 border border-[#ee7f03]/20 p-3">
              <Info className="h-4 w-4 text-[#ee7f03] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#ee7f03] leading-snug">
                Les heures seront imputées selon le barème légal ivoirien
                (Décret n°96-203) — paliers +15%, +50%, +75%, +100%.
                Le calcul est effectué côté serveur en utilisant le salaire brut
                de chaque employé.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={() => handleClose(false)}
            disabled={loading}
            className="flex-none h-9 px-4 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {successResult ? "Fermer" : "Annuler"}
          </button>

          {!successResult && (
            <button
              onClick={handleImport}
              disabled={!file || loading}
              id="btn-confirmer-import-hs"
              className="flex-1 h-9 px-4 rounded-md bg-slate-900 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Import en cours…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Importer les heures
                </>
              )}
            </button>
          )}

          {successResult && (
            <button
              onClick={reset}
              className="flex-1 h-9 px-4 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Nouvel import
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── AlertBanner ───────────────────────────────────────────────────────────────

function AlertBanner({
  title, items, tone,
}: {
  title: string;
  items: string[];
  tone: "warn" | "error";
}) {
  const colors = tone === "warn"
    ? "border-amber-200 bg-amber-50 text-amber-700"
    : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <div className={`rounded-md border p-3 ${colors}`}>
      <p className="text-xs font-semibold mb-1">{title}</p>
      <ul className="space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs leading-snug">· {item}</li>
        ))}
      </ul>
    </div>
  );
}
