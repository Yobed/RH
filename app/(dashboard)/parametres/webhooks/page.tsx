"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash, Copy } from "@phosphor-icons/react";
import { PageShell, PageHeader } from "@/components/ui/page-shell";

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  actif: boolean;
  created_at: string;
}

const EVENTS = [
  "employee.created",
  "employee.updated",
  "conge.approved",
  "conge.rejected",
  "bulletin.generated",
  "evaluation.completed",
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", url: "", events: [] as string[] });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/v1/webhooks")
      .then((r) => r.json())
      .then((d: Webhook[]) => { setWebhooks(d ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function create() {
    if (!form.name || !form.url || form.events.length === 0) {
      toast.error("Remplissez le nom, l'URL et sélectionnez au moins un événement");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/v1/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json() as { webhook?: Webhook; error?: string };
      if (d.webhook) {
        setWebhooks((w) => [...w, d.webhook!]);
        setForm({ name: "", url: "", events: [] });
        toast.success("Webhook créé");
      } else {
        toast.error(d.error ?? "Erreur");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setCreating(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/v1/webhooks?id=${id}`, { method: "DELETE" });
    setWebhooks((w) => w.filter((wh) => wh.id !== id));
    toast.success("Webhook supprimé");
  }

  function toggleEvent(ev: string) {
    setForm((f) => ({
      ...f,
      events: f.events.includes(ev) ? f.events.filter((e) => e !== ev) : [...f.events, ev],
    }));
  }

  if (loading) return <div className="px-8 py-6 text-sm text-muted-foreground">Chargement…</div>;

  return (
    <PageShell width="narrow">
      <PageHeader
        title="Webhooks"
        description="Recevez des notifications en temps réel dans vos systèmes externes lors d'événements RH."
      />

      {/* Création */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Nouveau webhook</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nom</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Mon intégration CRM"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">URL de destination</label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://mon-app.com/webhook"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Événements</label>
          <div className="flex flex-wrap gap-2">
            {EVENTS.map((ev) => (
              <button
                key={ev}
                onClick={() => toggleEvent(ev)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  form.events.includes(ev)
                    ? "bg-[#ee7f03] text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {ev}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={create}
          disabled={creating}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#ee7f03] text-white rounded-lg text-sm font-medium hover:bg-[#ee7f03] disabled:opacity-60 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {creating ? "Création…" : "Créer le webhook"}
        </button>
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {webhooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun webhook configuré.</p>
        ) : (
          webhooks.map((wh) => (
            <div key={wh.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{wh.name}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-xs">{wh.url}</p>
                </div>
                <button onClick={() => remove(wh.id)} className="text-rose-400 hover:text-rose-600 p-1 transition-colors">
                  <Trash className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {wh.events.map((ev) => (
                  <span key={ev} className="bg-[#ee7f03]/15 text-[#f6c68a] text-[10px] px-1.5 py-0.5 rounded-full">{ev}</span>
                ))}
              </div>
              {wh.secret && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground">Secret :</span>
                  <code className="font-mono text-muted-foreground">{wh.secret.slice(0, 8)}••••</code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(wh.secret); toast.success("Secret copié"); }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </PageShell>
  );
}
