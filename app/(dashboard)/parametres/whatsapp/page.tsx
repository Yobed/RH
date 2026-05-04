"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Config {
  webhook_url: string;
  access_token: string;
  enabled: boolean;
}

export default function WhatsAppPage() {
  const [config, setConfig] = useState<Config>({ webhook_url: "", access_token: "", enabled: false });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch("/api/parametres/whatsapp-config")
      .then((r) => r.json())
      .then((d: Partial<Config>) => d && setConfig({ webhook_url: d.webhook_url ?? "", access_token: d.access_token ?? "", enabled: d.enabled ?? false }))
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/parametres/whatsapp-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      toast.success("Configuration WhatsApp sauvegardée");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    setTesting(true);
    try {
      const res = await fetch("/api/parametres/whatsapp-config/test", { method: "POST" });
      const d = await res.json() as { success?: boolean };
      if (d.success) toast.success("Message de test envoyé !");
      else toast.error("Échec du test — vérifiez la configuration");
    } catch {
      toast.error("Erreur de test");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notifications WhatsApp</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configurez l'intégration WhatsApp Business via n8n pour les bulletins de paie et notifications RH.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Intégration WhatsApp Business</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-muted-foreground">Activé</span>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig((c) => ({ ...c, enabled: e.target.checked }))}
              className="w-4 h-4 accent-indigo-600"
            />
          </label>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">URL Webhook n8n</label>
            <input
              type="url"
              value={config.webhook_url}
              onChange={(e) => setConfig((c) => ({ ...c, webhook_url: e.target.value }))}
              placeholder="https://yobed-n8n-supabase-claude.hf.space/webhook/whatsapp"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Access Token WhatsApp Business API</label>
            <input
              type="password"
              value={config.access_token}
              onChange={(e) => setConfig((c) => ({ ...c, access_token: e.target.value }))}
              placeholder="EAAxxxxx…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {saving ? "Sauvegarde…" : "Sauvegarder"}
          </button>
          <button
            onClick={test}
            disabled={testing || !config.enabled}
            className="px-4 py-2 bg-[#25D366] text-white rounded-lg text-sm font-medium hover:bg-[#1ebe5a] disabled:opacity-60 transition-colors"
          >
            {testing ? "Envoi…" : "Tester"}
          </button>
        </div>

        <div className="rounded-lg bg-muted/40 p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Templates disponibles :</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li><code>bulletin_disponible</code> — Nouveau bulletin de paie disponible</li>
            <li><code>conge_approuve</code> — Congé approuvé par le manager</li>
            <li><code>conge_rejete</code> — Congé refusé</li>
            <li><code>rappel_entretien</code> — Rappel entretien annuel</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
