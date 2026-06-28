"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Copy, ArrowCounterClockwise } from "@phosphor-icons/react";
import { PageShell, PageHeader } from "@/components/ui/page-shell";

export default function ApiPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    fetch("/api/parametres/api-key")
      .then((r) => r.json())
      .then((d: { api_key?: string }) => {
        setApiKey(d.api_key ?? null);
        setLoading(false);
      });
  }, []);

  async function regenerate() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/parametres/api-key", { method: "POST" });
      const d = await res.json() as { api_key?: string };
      setApiKey(d.api_key ?? null);
      setRevealed(true);
      toast.success("Clé API régénérée");
    } catch {
      toast.error("Erreur lors de la régénération");
    } finally {
      setRegenerating(false);
    }
  }

  function copy() {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      toast.success("Clé copiée");
    }
  }

  const displayKey = apiKey
    ? revealed
      ? apiKey
      : apiKey.slice(0, 8) + "••••••••••••••••••••••••••••••••"
    : null;

  return (
    <PageShell width="narrow">
      <PageHeader
        title="API publique REST"
        description="Accédez à vos données RH via l'API REST. Authentifiez-vous avec votre clé API."
      />

      {/* Clé API */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Clé API</h2>
        {loading ? (
          <div className="h-10 bg-muted animate-pulse rounded-lg" />
        ) : apiKey ? (
          <div className="flex items-center gap-2">
            <code
              className="flex-1 font-mono text-xs bg-muted rounded-lg px-3 py-2.5 text-foreground cursor-pointer select-all"
              onClick={() => setRevealed((v) => !v)}
              title="Cliquer pour afficher/masquer"
            >
              {displayKey}
            </code>
            <button onClick={copy} className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Copier">
              <Copy className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucune clé générée. Cliquez sur "Générer" ci-dessous.</p>
        )}
        <button
          onClick={regenerate}
          disabled={regenerating}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          <ArrowCounterClockwise className="h-4 w-4" />
          {apiKey ? "Régénérer la clé" : "Générer une clé"}
        </button>
        <p className="text-xs text-amber-500">
          Attention : régénérer la clé invalidera immédiatement l'ancienne.
        </p>
      </div>

      {/* Documentation */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Endpoints disponibles</h2>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[10px] font-bold">GET</span>
            <code className="text-muted-foreground">/api/v1/employees</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[10px] font-bold">GET</span>
            <code className="text-muted-foreground">/api/v1/employees?page=1&limit=50</code>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Header requis : <code className="bg-muted px-1 rounded">x-api-key: votre-clé</code>
        </p>
      </div>
    </PageShell>
  );
}
