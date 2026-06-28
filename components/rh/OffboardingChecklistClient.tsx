"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle, Circle, Warning, ArrowsCounterClockwise, ChatCircle } from "@phosphor-icons/react";
import {
  OFFBOARDING_CATEGORY_LABELS,
  offboardingProgress,
  type OffboardingCategory,
  type OffboardingItem,
} from "@/lib/offboarding-template";
import { Button } from "@/components/ui/button";

interface Props {
  employeeId: string;
  employeeName: string;
  initialItems: OffboardingItem[];
  dateSortiePrevue: string | null;
  completedAt: string | null;
}

const CATEGORY_COLORS: Record<OffboardingCategory, { dot: string; bg: string; text: string }> = {
  biens:         { dot: "bg-amber-500",   bg: "bg-amber-50",   text: "text-amber-700" },
  acces:         { dot: "bg-rose-500",    bg: "bg-rose-50",    text: "text-rose-700" },
  administratif: { dot: "bg-teal-500",    bg: "bg-teal-50",    text: "text-teal-700" },
  paie:          { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  humain:        { dot: "bg-slate-500",  bg: "bg-slate-50",  text: "text-slate-700" },
};

const ALL_CATEGORIES: OffboardingCategory[] = ["biens", "acces", "administratif", "paie", "humain"];

export function OffboardingChecklistClient({
  employeeId,
  employeeName,
  initialItems,
  dateSortiePrevue,
  completedAt,
}: Props) {
  const router = useRouter();
  const [items, setItems] = useState<OffboardingItem[]>(initialItems);
  const [completed, setCompleted] = useState<string | null>(completedAt);
  const [isPending, startTransition] = useTransition();
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState<string>("");

  const progress = offboardingProgress(items);

  async function patchItem(id: string, patch: { done?: boolean; comment?: string | null }) {
    const previous = items;
    // Optimistic update
    setItems((cur) =>
      cur.map((it) => (it.id === id ? { ...it, ...patch } : it))
    );

    try {
      const res = await fetch(`/api/offboarding/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patch: { id, ...patch } }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Erreur serveur");
      }
      const data = await res.json();
      setItems(data.items);
      setCompleted(data.completed_at);
    } catch (e) {
      setItems(previous);
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      toast.error(msg);
    }
  }

  function handleToggle(item: OffboardingItem) {
    startTransition(() => {
      void patchItem(item.id, { done: !item.done });
    });
  }

  function openComment(item: OffboardingItem) {
    setEditingComment(item.id);
    setCommentDraft(item.comment ?? "");
  }

  function saveComment(id: string) {
    startTransition(() => {
      void patchItem(id, { comment: commentDraft.trim() || null });
      setEditingComment(null);
      setCommentDraft("");
    });
  }

  async function handleReset() {
    if (!confirm("Réinitialiser toute la checklist ? Cette action efface l'historique des cases cochées.")) return;
    startTransition(async () => {
      const res = await fetch(`/api/offboarding/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });
      if (!res.ok) {
        toast.error("Erreur de réinitialisation");
        return;
      }
      const data = await res.json();
      setItems(data.items);
      setCompleted(null);
      toast.success("Checklist réinitialisée");
      router.refresh();
    });
  }

  const byCategory = ALL_CATEGORIES.map((cat) => ({
    cat,
    items: items.filter((it) => it.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-5">
      {/* Bandeau progression */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Checklist de sortie
            </p>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">{employeeName}</h2>
            {dateSortiePrevue && (
              <p className="text-xs text-slate-500 mt-1">
                Date de sortie prévue :{" "}
                <strong>
                  {new Date(dateSortiePrevue).toLocaleDateString("fr-CI", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </strong>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums text-slate-900">
                {progress.done}<span className="text-slate-400">/{progress.total}</span>
              </p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">étapes</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isPending}
              title="Réinitialiser"
            >
              <ArrowsCounterClockwise className="h-3.5 w-3.5" weight="bold" />
            </Button>
          </div>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress.pct === 100 ? "bg-emerald-500" : progress.pct >= 50 ? "bg-amber-400" : "bg-red-400"
            }`}
            style={{ width: `${progress.pct}%` }}
          />
        </div>
        {completed && (
          <p className="mt-3 text-xs text-emerald-600 font-medium flex items-center gap-1.5">
            <CheckCircle weight="fill" className="h-4 w-4" />
            Sortie clôturée le{" "}
            {new Date(completed).toLocaleDateString("fr-CI", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Sections par catégorie */}
      {byCategory.map(({ cat, items: catItems }) => {
        const colors = CATEGORY_COLORS[cat];
        const catProgress = offboardingProgress(catItems);
        return (
          <section key={cat} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <header className={`flex items-center justify-between px-4 py-2.5 ${colors.bg} border-b border-slate-100`}>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                <h3 className={`text-sm font-semibold ${colors.text}`}>
                  {OFFBOARDING_CATEGORY_LABELS[cat]}
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-600">
                {catProgress.done}/{catProgress.total}
              </span>
            </header>
            <ul className="divide-y divide-slate-100">
              {catItems.map((item) => {
                const isEditingThis = editingComment === item.id;
                return (
                  <li key={item.id} className="px-4 py-3 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggle(item)}
                        disabled={isPending}
                        className="mt-0.5 shrink-0 disabled:opacity-50"
                        aria-label={item.done ? "Décocher" : "Cocher"}
                      >
                        {item.done ? (
                          <CheckCircle weight="fill" className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-300 hover:text-slate-500" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-medium ${item.done ? "text-slate-400 line-through" : "text-slate-900"}`}>
                            {item.title}
                          </p>
                          {item.legal_ref && (
                            <span className="rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono px-1.5 py-0.5">
                              {item.legal_ref}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>

                        {item.comment && !isEditingThis && (
                          <div className="mt-1.5 flex items-start gap-1.5 rounded-md bg-slate-50 border border-slate-100 px-2 py-1">
                            <ChatCircle className="h-3 w-3 mt-0.5 shrink-0 text-slate-400" />
                            <p className="text-xs italic text-slate-600">{item.comment}</p>
                          </div>
                        )}

                        {isEditingThis ? (
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="text"
                              value={commentDraft}
                              onChange={(e) => setCommentDraft(e.target.value)}
                              placeholder="État, observations, manquements…"
                              className="flex-1 text-xs rounded-md border border-slate-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-slate-400"
                              autoFocus
                            />
                            <Button type="button" size="sm" variant="outline"
                              onClick={() => { setEditingComment(null); setCommentDraft(""); }}>
                              Annuler
                            </Button>
                            <Button type="button" size="sm" onClick={() => saveComment(item.id)} disabled={isPending}>
                              OK
                            </Button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openComment(item)}
                            className="mt-1 text-[10px] text-slate-400 hover:text-slate-700 underline-offset-2 hover:underline"
                          >
                            {item.comment ? "Modifier le commentaire" : "+ Ajouter un commentaire"}
                          </button>
                        )}

                        {item.done && item.done_at && (
                          <p className="text-[10px] text-emerald-600 mt-1">
                            ✓ Validé le{" "}
                            {new Date(item.done_at).toLocaleDateString("fr-CI", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
