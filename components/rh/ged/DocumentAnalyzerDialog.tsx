"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Sparkles, Loader2, X, FileText, Image as ImageIcon, AlertTriangle,
  CheckCircle2, RefreshCw, Download, Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentLite {
  id: string;
  name: string;
  famille: string | null;
  file_url: string;
  file_type: string | null;
  created_at: string | null;
  ai_extracted_data?: ExtractedFields | null;
  ai_summary?: string | null;
  ai_analyzed_at?: string | null;
}

interface ExtractedFields {
  type_document?: string;
  resume?: string;
  champs?: Record<string, string | number | null>;
  alertes?: string[];
  pieces_complementaires_suggerees?: string[];
}

interface Props {
  doc: DocumentLite | null;
  onClose: () => void;
}

function isPdf(fileType: string | null, url: string): boolean {
  if (fileType?.includes("pdf")) return true;
  return /\.pdf(\?.*)?$/i.test(url);
}

function isImage(fileType: string | null, url: string): boolean {
  if (fileType?.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(url);
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\bfcfa\b/i, "FCFA")
    .replace(/\bcni\b/i, "CNI")
    .replace(/\bcdi\b/i, "CDI")
    .replace(/\bcdd\b/i, "CDD")
    .replace(/^./, (c) => c.toUpperCase());
}

function formatValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function DocumentAnalyzerDialog({ doc, onClose }: Props) {
  const [extracted, setExtracted] = useState<ExtractedFields | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);

  useEffect(() => {
    if (doc) {
      setExtracted(doc.ai_extracted_data ?? null);
      setAnalyzedAt(doc.ai_analyzed_at ?? null);
    }
  }, [doc]);

  if (!doc) return null;

  const pdf = isPdf(doc.file_type, doc.file_url);
  const image = isImage(doc.file_type, doc.file_url);

  async function runAnalysis() {
    if (!doc) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/documents/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: doc.id, persist: true }),
      });
      const json = (await res.json()) as { extracted?: ExtractedFields; error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Analyse échouée.");
        return;
      }
      setExtracted(json.extracted ?? null);
      setAnalyzedAt(new Date().toISOString());
      toast.success("Document analysé par l'IA.");
    } catch {
      toast.error("Erreur réseau pendant l'analyse.");
    } finally {
      setAnalyzing(false);
    }
  }

  const champs = extracted?.champs ?? {};
  const champEntries = Object.entries(champs);
  const hasExtracted = !!extracted && (champEntries.length > 0 || !!extracted.resume);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch bg-slate-900/40 backdrop-blur-sm">
      <div className="flex w-full h-full bg-white shadow-2xl flex-col">
        {/* Barre supérieure style Odoo */}
        <header className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-teal-600 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 leading-none">
                {doc.famille ?? "Document"}
              </p>
              <h2 className="text-sm font-bold text-slate-900 truncate leading-tight mt-0.5">
                {doc.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={runAnalysis}
              disabled={analyzing}
              size="sm"
              className="gap-1.5 bg-gradient-to-br from-slate-600 to-teal-600 hover:from-slate-700 hover:to-teal-700 text-white shadow-sm"
            >
              {analyzing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : extracted ? (
                <RefreshCw className="h-3.5 w-3.5" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {analyzing
                ? "Analyse en cours…"
                : extracted
                ? "Relancer l'analyse IA"
                : "Analyser avec l'IA"}
            </Button>
            <a
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Télécharger
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Corps : split panneaux */}
        <div className="flex-1 flex min-h-0">
          {/* Panneau gauche — données extraites */}
          <section className="w-full lg:w-[46%] overflow-y-auto border-r border-slate-200 bg-white">
            <div className="p-5 space-y-5">
              {/* Bandeau IA */}
              <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-teal-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-600 to-teal-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 leading-tight">
                      Assistant IA — Lecture du document
                    </p>
                    {analyzedAt ? (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Analysé le{" "}
                        {new Date(analyzedAt).toLocaleString("fr-CI", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Cliquez sur « Analyser avec l'IA » pour extraire automatiquement les champs et détecter les anomalies.
                      </p>
                    )}
                    {extracted?.resume && (
                      <p className="text-[13px] text-slate-700 mt-2 leading-relaxed italic">
                        « {extracted.resume} »
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Alertes */}
              {extracted?.alertes && extracted.alertes.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-bold text-amber-800">
                      {extracted.alertes.length} point{extracted.alertes.length > 1 ? "s" : ""} d'attention
                    </p>
                  </div>
                  <ul className="space-y-1">
                    {extracted.alertes.map((alerte, i) => (
                      <li key={i} className="text-[12px] text-amber-900 leading-snug flex gap-2">
                        <span className="text-amber-500 shrink-0">▸</span>
                        <span>{alerte}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Champs extraits */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
                    Champs détectés
                  </p>
                  {extracted?.type_document && (
                    <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 uppercase tracking-wide">
                      {extracted.type_document}
                    </span>
                  )}
                </div>

                {!hasExtracted ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-8 text-center">
                    <Sparkles className="h-7 w-7 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 font-medium">Aucune donnée extraite</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Lancez l'analyse IA pour remplir automatiquement les champs.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-100 bg-white divide-y divide-slate-100">
                    {champEntries.map(([k, v]) => (
                      <div key={k} className="grid grid-cols-[140px_1fr] gap-3 px-3 py-2.5 hover:bg-slate-50/60 transition-colors">
                        <p className="text-[11px] font-semibold text-slate-500 leading-tight pt-0.5">
                          {humanizeKey(k)}
                        </p>
                        <p className="text-[13px] text-slate-800 font-medium break-words">
                          {formatValue(v)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pièces complémentaires suggérées */}
              {extracted?.pieces_complementaires_suggerees && extracted.pieces_complementaires_suggerees.length > 0 && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-bold text-emerald-800">
                      Pièces complémentaires suggérées
                    </p>
                  </div>
                  <ul className="space-y-1">
                    {extracted.pieces_complementaires_suggerees.map((p, i) => (
                      <li key={i} className="text-[12px] text-emerald-900 leading-snug flex gap-2">
                        <span className="text-emerald-500 shrink-0">▸</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Métadonnées brutes du fichier */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">
                  Fichier
                </p>
                <div className="text-[11px] text-slate-500 space-y-1">
                  <p>
                    <span className="font-semibold text-slate-600">Type :</span>{" "}
                    {doc.file_type ?? "inconnu"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-600">Ajouté le :</span>{" "}
                    {doc.created_at
                      ? new Date(doc.created_at).toLocaleDateString("fr-CI", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Panneau droit — aperçu du document */}
          <section className="hidden lg:flex flex-1 bg-slate-100 items-stretch justify-stretch min-w-0">
            {pdf ? (
              <iframe
                src={`${doc.file_url}#toolbar=1&view=FitH`}
                title={doc.name}
                className="w-full h-full border-0 bg-white"
              />
            ) : image ? (
              <div className="w-full h-full flex items-center justify-center p-6 overflow-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={doc.file_url}
                  alt={doc.name}
                  className="max-w-full max-h-full object-contain shadow-lg rounded-md bg-white"
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                <ImageIcon className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-600">
                  Aperçu non disponible pour ce format
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Téléchargez le fichier pour le consulter, l'IA peut quand même tenter une lecture si le format est supporté.
                </p>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                >
                  <Download className="h-3.5 w-3.5" /> Télécharger
                </a>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
