"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { CheckCircle, ArrowLineDown } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ImportError {
  row: number;
  message: string;
}

interface ImportResult {
  imported: number;
}

export function SageImportDropzone() {
  const [file, setFile] = useState<File | null>(null);
  const [periode, setPeriode] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    setErrors([]);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    setErrors([]);
  }

  function handleRemoveFile() {
    setFile(null);
    setResult(null);
    setErrors([]);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }

  function handleDownloadTemplate() {
    window.location.href = "/api/paie/import-sage/template";
  }

  async function handleImport() {
    if (!file) {
      toast.error("Sélectionnez un fichier .xlsx");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("periode", periode);

      const res = await fetch("/api/paie/import-sage", {
        method: "POST",
        body: fd,
      });

      const json = (await res.json()) as {
        success: boolean;
        imported?: number;
        errors?: ImportError[];
      };

      if (json.success) {
        setResult({ imported: json.imported ?? 0 });
        setErrors([]);
        toast.success(`${json.imported ?? 0} ligne(s) importée(s) avec succès`);
      } else {
        setErrors(json.errors ?? []);
        setResult(null);
        toast.error("Des erreurs ont été détectées dans le fichier");
      }
    } catch {
      toast.error("Une erreur inattendue est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Bouton téléchargement template */}
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="outline" onClick={handleDownloadTemplate}>
          <ArrowLineDown className="mr-2 h-4 w-4" />
          Télécharger le template Excel
        </Button>
        <p className="text-sm text-muted-foreground">
          Remplissez le template avec vos données Sage, puis importez le fichier ci-dessous.
        </p>
      </div>

      {/* Sélecteur de période */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="periode-input"
          className="text-sm font-medium text-slate-700"
        >
          Période d&apos;import (YYYY-MM)
        </label>
        <input
          id="periode-input"
          type="month"
          value={periode}
          onChange={(e) => setPeriode(e.target.value)}
          className="w-48 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
      </div>

      {/* Zone drag-and-drop */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => {
          if (!file) fileRef.current?.click();
        }}
        className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-8 text-center transition-colors hover:border-slate-300 hover:bg-slate-50"
      >
        {file ? (
          <div
            className="flex items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
              <Upload className="h-4 w-4 text-slate-400" />
              <span className="max-w-[280px] truncate text-sm font-medium text-slate-700">
                {file.name}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-400 shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors"
              aria-label="Supprimer le fichier"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Upload className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                Glissez votre fichier .xlsx ici ou cliquez pour sélectionner
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Format accepté : Excel (.xlsx) uniquement
              </p>
            </div>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Bouton importer */}
      <Button
        disabled={!file || loading}
        onClick={handleImport}
        className="min-w-[140px]"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Traitement en cours...
          </>
        ) : (
          "Importer"
        )}
      </Button>

      {/* Résultat succès */}
      {result && (
        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardContent className="flex items-center gap-3 pt-6">
            <CheckCircle
              weight="duotone"
              className="h-6 w-6 shrink-0 text-emerald-600"
            />
            <p className="text-sm font-medium text-emerald-800">
              {result.imported} ligne(s) importée(s) avec succès
            </p>
          </CardContent>
        </Card>
      )}

      {/* Liste d'erreurs */}
      {errors.length > 0 && (
        <Card className="border-red-200 bg-red-50/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-red-800">
              Erreurs détectées ({errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="space-y-1">
              {errors.map((e, idx) => (
                <li key={idx} className="text-sm text-red-700">
                  <span className="font-medium">Ligne {e.row} :</span> {e.message}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-red-600">
              Corrigez ces erreurs dans votre fichier et réimportez.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
