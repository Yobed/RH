"use client";

import { useState } from "react";
import { FileText, Download, Loader2, BadgeCheck } from "lucide-react";

type AttestationType = "salaire" | "travail";

export function AttestationSelfService() {
  const [type, setType] = useState<AttestationType>("salaire");
  const [loading, setLoading] = useState(false);
  const [attestation, setAttestation] = useState<{
    content: { title: string; body: string; date: string };
    company: { name: string };
    employee: { full_name: string };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setAttestation(null);

    try {
      const res = await fetch("/api/portail/attestation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur lors de la génération");
      }
      const data = await res.json();
      setAttestation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    if (!attestation) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>${attestation.content.title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 48px; max-width: 700px; margin: 0 auto; color: #1e293b; line-height: 1.7; }
          h1 { text-align: center; font-size: 18px; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 32px; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; }
          .body-text { white-space: pre-wrap; font-size: 14px; margin-bottom: 40px; }
          .footer { text-align: right; font-size: 13px; color: #475569; }
          .company { font-weight: 700; font-size: 15px; margin-bottom: 4px; }
          .seal { margin-top: 60px; text-align: right; font-size: 12px; color: #94a3b8; font-style: italic; }
          @media print { body { padding: 24px; } }
        </style>
      </head>
      <body>
        <h1>${attestation.content.title}</h1>
        <div class="body-text">${attestation.content.body}</div>
        <div class="footer">
          <p class="company">${attestation.company.name}</p>
          <p>Fait à Abidjan, le ${attestation.content.date}</p>
        </div>
        <div class="seal">Document généré automatiquement — RH Manager CI</div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setType("salaire")}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
            type === "salaire"
              ? "border-slate-900 bg-slate-900 text-white dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-400"
              : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
          }`}
        >
          <FileText className="h-4 w-4" />
          Attestation de salaire
        </button>
        <button
          onClick={() => setType("travail")}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
            type === "travail"
              ? "border-slate-900 bg-slate-900 text-white dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-400"
              : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
          }`}
        >
          <BadgeCheck className="h-4 w-4" />
          Attestation de travail
        </button>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-amber-600 dark:hover:bg-amber-500"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        {loading ? "Génération en cours…" : "Générer mon attestation"}
      </button>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Preview */}
      {attestation && (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-4">
            <h3 className="text-center text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
              {attestation.content.title}
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {attestation.content.body}
            </p>
            <div className="text-right text-sm text-slate-600 dark:text-slate-400">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {attestation.company.name}
              </p>
              <p>Fait à Abidjan, le {attestation.content.date}</p>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="h-4 w-4" />
            Télécharger / Imprimer
          </button>
        </div>
      )}
    </div>
  );
}
