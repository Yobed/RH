"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PageShell, PageHeader } from "@/components/ui/page-shell";

interface Config {
  api_key: string;
  test_phone: string;
  enabled: boolean;
}

export default function WhatsAppPage() {
  const [config, setConfig] = useState<Config>({ api_key: "", test_phone: "", enabled: false });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch("/api/parametres/whatsapp-config")
      .then((r) => r.json())
      .then((d: Partial<Config>) => {
        if (d) setConfig({ api_key: d.api_key ?? "", test_phone: d.test_phone ?? "", enabled: d.enabled ?? false });
      })
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
      toast.success("Configuration Wasender sauvegardée");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    if (!config.test_phone) {
      toast.error("Saisissez un numéro de test");
      return;
    }
    setTesting(true);
    try {
      const res = await fetch("/api/parametres/whatsapp-config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: config.test_phone }),
      });
      const d = await res.json() as { success?: boolean };
      if (d.success) toast.success("Message de test envoyé !");
      else toast.error("Échec — vérifiez votre clé API Wasender");
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setTesting(false);
    }
  }

  return (
    <PageShell width="narrow">
      <PageHeader
        title="Notifications WhatsApp"
        description={
          <>
            Envoi de messages WhatsApp via{" "}
            <a
              href="https://wasenderapi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-500 hover:underline"
            >
              Wasender API
            </a>{" "}
            pour les bulletins de paie et notifications RH.
          </>
        }
      />

      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Intégration Wasender</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-muted-foreground">Activé</span>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig((c) => ({ ...c, enabled: e.target.checked }))}
              className="w-4 h-4 accent-teal-600"
            />
          </label>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Clé API Wasender
              <span className="ml-1 text-muted-foreground/60">(Personal Access Token)</span>
            </label>
            <input
              type="password"
              value={config.api_key}
              onChange={(e) => setConfig((c) => ({ ...c, api_key: e.target.value }))}
              placeholder="wsa_xxxxxxxxxxxxxxxx"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
            />
            <p className="text-xs text-muted-foreground/70 mt-1">
              Obtenez votre clé sur{" "}
              <a href="https://app.wasenderapi.com/settings" target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline">
                app.wasenderapi.com/settings
              </a>
            </p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Numéro de test (format international)
            </label>
            <input
              type="tel"
              value={config.test_phone}
              onChange={(e) => setConfig((c) => ({ ...c, test_phone: e.target.value }))}
              placeholder="+2250701234567"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60 transition-colors"
          >
            {saving ? "Sauvegarde…" : "Sauvegarder"}
          </button>
          <button
            onClick={test}
            disabled={testing || !config.enabled || !config.api_key}
            className="px-4 py-2 bg-[#25D366] text-white rounded-lg text-sm font-medium hover:bg-[#1ebe5a] disabled:opacity-60 transition-colors"
          >
            {testing ? "Envoi…" : "Tester"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Templates envoyés automatiquement</h2>
        <div className="space-y-2 text-sm">
          {[
            { key: "bulletin_disponible", label: "Bulletin de paie disponible" },
            { key: "conge_approuve", label: "Congé approuvé" },
            { key: "conge_refuse", label: "Congé refusé" },
            { key: "rappel_signature", label: "Document à signer" },
            { key: "alerte_contrat_expiration", label: "Expiration de contrat imminente" },
            { key: "bienvenue_portail", label: "Bienvenue sur le portail RH" },
          ].map((t) => (
            <div key={t.key} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#25D366] flex-shrink-0" />
              <code className="text-xs text-muted-foreground">{t.key}</code>
              <span className="text-muted-foreground">—</span>
              <span>{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
