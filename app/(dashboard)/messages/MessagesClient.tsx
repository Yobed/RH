"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Profile = { id: string; full_name: string; avatar_url: string | null };

type Message = {
  id: string;
  sujet: string | null;
  corps: string;
  lu: boolean;
  type: "message" | "notification";
  created_at: string;
  sender: Profile | null;
  recipient: Profile | null;
};

type Recipient = { id: string; full_name: string };

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return new Date(iso).toLocaleDateString("fr-CI");
}

function InitialsAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className={cn(
      "rounded-full bg-[oklch(0.175_0.04_248)] flex items-center justify-center text-[oklch(0.78_0.13_73)] font-semibold shrink-0",
      size === "sm" ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs"
    )}>
      {initials}
    </div>
  );
}

export function MessagesClient({ currentUserId }: { currentUserId: string }) {
  const [box, setBox] = useState<"inbox" | "sent">("inbox");
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [form, setForm] = useState({ recipient_id: "", sujet: "", corps: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/messages?box=${box}`)
      .then((r) => r.json())
      .then((d: unknown) => {
        if (Array.isArray(d)) setMessages(d as Message[]);
      })
      .finally(() => setLoading(false));
  }, [box]);

  useEffect(() => {
    fetch("/api/employes/profiles")
      .then((r) => r.json())
      .then((d: unknown) => {
        if (Array.isArray(d)) setRecipients(d as Recipient[]);
      })
      .catch(() => {});
  }, []);

  async function selectMessage(msg: Message) {
    setSelected(msg);
    if (!msg.lu && msg.recipient?.id === currentUserId) {
      await fetch("/api/messages/lu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [msg.id] }),
      });
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, lu: true } : m));
    }
  }

  async function send() {
    if (!form.recipient_id || !form.corps.trim()) {
      toast.error("Destinataire et message requis");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Message envoyé");
      setComposing(false);
      setForm({ recipient_id: "", sujet: "", corps: "" });
      if (box === "sent") {
        const data = (await res.json()) as Message;
        setMessages((prev) => [data, ...prev]);
      }
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  }

  const unread = messages.filter((m) => !m.lu && m.recipient?.id === currentUserId).length;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 shrink-0 border-r bg-white flex flex-col">
        {/* Compose + box tabs */}
        <div className="p-4 border-b space-y-3">
          <button
            onClick={() => setComposing(true)}
            className="w-full rounded-xl bg-[oklch(0.175_0.04_248)] py-2.5 text-sm font-semibold text-[oklch(0.78_0.13_73)] hover:opacity-90 transition-opacity shadow-sm"
          >
            + Nouveau message
          </button>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
            {(["inbox", "sent"] as const).map((b) => (
              <button
                key={b}
                onClick={() => { setBox(b); setSelected(null); }}
                className={cn(
                  "flex-1 rounded-md py-1.5 text-xs font-medium transition-all",
                  box === b ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
                )}
              >
                {b === "inbox" ? `Reçus${unread > 0 ? ` (${unread})` : ""}` : "Envoyés"}
              </button>
            ))}
          </div>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {loading && (
            <div className="p-4 text-center text-xs text-slate-400">Chargement…</div>
          )}
          {!loading && messages.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-400">Aucun message</div>
          )}
          {messages.map((msg) => {
            const other = box === "inbox" ? msg.sender : msg.recipient;
            return (
              <button
                key={msg.id}
                onClick={() => selectMessage(msg)}
                className={cn(
                  "w-full text-left px-4 py-3 hover:bg-slate-50/80 transition-colors",
                  selected?.id === msg.id && "bg-slate-50",
                  !msg.lu && box === "inbox" && "bg-blue-50/40"
                )}
              >
                <div className="flex items-start gap-3">
                  <InitialsAvatar name={other?.full_name ?? "?"} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={cn("text-xs truncate", !msg.lu && box === "inbox" ? "font-semibold text-slate-900" : "font-medium text-slate-700")}>
                        {other?.full_name ?? "—"}
                      </p>
                      <span className="text-[9px] text-slate-400 shrink-0">{timeAgo(msg.created_at)}</span>
                    </div>
                    {msg.sujet && (
                      <p className="text-[10px] font-medium text-slate-600 truncate">{msg.sujet}</p>
                    )}
                    <p className="text-[10px] text-slate-400 truncate">{msg.corps}</p>
                  </div>
                  {!msg.lu && box === "inbox" && (
                    <span className="h-2 w-2 rounded-full bg-[oklch(0.38_0.10_252)] shrink-0 mt-1" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 bg-slate-50/60 flex flex-col overflow-hidden">
        {composing ? (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-xl space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-slate-800">Nouveau message</h2>
                <button onClick={() => setComposing(false)} className="text-xs text-slate-400 hover:text-slate-600">Annuler</button>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Destinataire</p>
                <select
                  value={form.recipient_id}
                  onChange={(e) => setForm({ ...form, recipient_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.38_0.10_252/0.3)]"
                >
                  <option value="">— Choisir —</option>
                  {recipients.map((r) => (
                    <option key={r.id} value={r.id}>{r.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Objet <span className="text-slate-300">(optionnel)</span></p>
                <input
                  type="text"
                  value={form.sujet}
                  onChange={(e) => setForm({ ...form, sujet: e.target.value })}
                  placeholder="Objet du message"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.38_0.10_252/0.3)]"
                />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Message</p>
                <textarea
                  value={form.corps}
                  onChange={(e) => setForm({ ...form, corps: e.target.value })}
                  rows={8}
                  placeholder="Votre message…"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[oklch(0.38_0.10_252/0.3)]"
                />
              </div>
              <button
                onClick={send}
                disabled={sending || !form.recipient_id || !form.corps.trim()}
                className="rounded-xl bg-[oklch(0.175_0.04_248)] px-6 py-2.5 text-sm font-semibold text-[oklch(0.78_0.13_73)] hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {sending ? "Envoi…" : "Envoyer"}
              </button>
            </div>
          </div>
        ) : selected ? (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-xl space-y-4">
              <div className="flex items-start gap-3">
                <InitialsAvatar name={(box === "inbox" ? selected.sender?.full_name : selected.recipient?.full_name) ?? "?"} size="md" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {box === "inbox" ? selected.sender?.full_name : selected.recipient?.full_name}
                  </p>
                  {selected.sujet && <p className="text-xs font-medium text-slate-600 mt-0.5">{selected.sujet}</p>}
                  <p className="text-[10px] text-slate-400 mt-0.5">{new Date(selected.created_at).toLocaleString("fr-CI")}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selected.corps}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-slate-400">Sélectionnez un message</p>
          </div>
        )}
      </div>
    </div>
  );
}
