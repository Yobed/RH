"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertTriangle, Stamp, FileText, Wrench, Users, Download, Check } from "lucide-react";
import { toast } from "sonner";
import type { OnboardingItem } from "@/lib/onboarding-template";

interface EmployeeInfo {
  id: string;
  full_name: string;
  matricule: string;
  poste: string | null;
  date_embauche: string;
  type_contrat: string | null;
  statut: string | null;
}

interface Props {
  employee: EmployeeInfo;
  initialItems: OnboardingItem[];
  completedAt: string | null;
}

const CATEGORY_META: Record<
  OnboardingItem["category"],
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  legal: { label: "Légal", icon: Stamp },
  admin: { label: "Administratif", icon: FileText },
  technique: { label: "Technique", icon: Wrench },
  humain: { label: "Humain", icon: Users },
};

function dueDate(item: OnboardingItem, dateEmbauche: string): Date | null {
  if (item.due_offset_days === undefined) return null;
  const d = new Date(dateEmbauche);
  d.setDate(d.getDate() + item.due_offset_days);
  return d;
}

export function OnboardingClient({ employee, initialItems, completedAt }: Props) {
  const [items, setItems] = useState<OnboardingItem[]>(initialItems);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  const progress = useMemo(() => {
    const done = items.filter((i) => i.done).length;
    return { done, total: items.length, pct: items.length === 0 ? 0 : Math.round((done / items.length) * 100) };
  }, [items]);

  const grouped = useMemo(() => {
    const map = new Map<OnboardingItem["category"], OnboardingItem[]>();
    for (const it of items) {
      const arr = map.get(it.category) ?? [];
      arr.push(it);
      map.set(it.category, arr);
    }
    return (Object.keys(CATEGORY_META) as OnboardingItem["category"][])
      .filter((c) => map.has(c))
      .map((c) => ({ category: c, items: map.get(c)! }));
  }, [items]);

  const overdueCount = useMemo(() => {
    const today = new Date();
    return items.filter((i) => {
      if (i.done) return false;
      const due = dueDate(i, employee.date_embauche);
      return due && due < today;
    }).length;
  }, [items, employee.date_embauche]);

  async function persist(next: OnboardingItem[]): Promise<void> {
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}/onboarding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: next }),
      });
      if (!res.ok) {
        toast.error("Échec de l'enregistrement");
        return;
      }
    } finally {
      setSaving(false);
    }
  }

  function toggleItem(id: string): void {
    const next = items.map((it) =>
      it.id === id
        ? {
            ...it,
            done: !it.done,
            done_at: !it.done ? new Date().toISOString() : null,
          }
        : it
    );
    setItems(next);
    void persist(next);
  }

  async function generateDoc(docType: string, itemId: string): Promise<void> {
    setGenerating(itemId);
    try {
      const res = await fetch("/api/documents/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employee.id, doc_type: docType }),
      });
      if (!res.ok) {
        toast.error("Erreur de génération");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${docType}_${employee.matricule}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Document généré");

      // Auto-coche l'item correspondant
      const next = items.map((it) =>
        it.id === itemId
          ? { ...it, done: true, done_at: new Date().toISOString() }
          : it
      );
      setItems(next);
      void persist(next);
    } finally {
      setGenerating(null);
    }
  }

  const isCompleted = progress.pct === 100;
  const dateEmbaucheLabel = new Date(employee.date_embauche).toLocaleDateString("fr-CI", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <header className="pb-4 border-b border-slate-200">
        <Link href={`/employes/${employee.id}`} className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5">
          <ArrowLeft className="h-3 w-3" /> Fiche du salarié
        </Link>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">
              Onboarding · {employee.matricule}
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">
              {employee.full_name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-snug">
              {employee.poste ?? "Poste non défini"} · {employee.type_contrat ?? "CDI"} ·
              embauché le {dateEmbaucheLabel}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
            <p className="text-2xl font-semibold text-slate-900 tabular-nums">{progress.pct}%</p>
            <p className="text-xs text-slate-500 tabular-nums">
              {progress.done} / {progress.total} étapes terminées
            </p>
            {saving && <p className="text-[10px] text-slate-400">Enregistrement…</p>}
          </div>
        </div>
        <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted ? "bg-emerald-500" : "bg-slate-900"
            }`}
            style={{ width: `${progress.pct}%` }}
          />
        </div>
      </header>

      {/* Bandeau alertes */}
      {overdueCount > 0 && !isCompleted && (
        <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3.5 flex gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed">
            <span className="font-semibold">{overdueCount} étape(s) en retard</span> par rapport
            au calendrier prévisionnel à partir de la date d'embauche.
          </p>
        </div>
      )}
      {isCompleted && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3.5 flex gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-900 leading-relaxed">
            Onboarding complet — terminé{" "}
            {completedAt
              ? `le ${new Date(completedAt).toLocaleDateString("fr-CI")}`
              : "à l'instant"}
            .
          </p>
        </div>
      )}

      {/* Sections par catégorie */}
      <div className="space-y-6">
        {grouped.map(({ category, items: cItems }) => {
          const meta = CATEGORY_META[category];
          const Icon = meta.icon;
          const cDone = cItems.filter((i) => i.done).length;
          return (
            <section key={category} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <header className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h2 className="text-sm font-semibold text-slate-900">{meta.label}</h2>
                </div>
                <span className="text-xs text-slate-500 tabular-nums">
                  {cDone} / {cItems.length}
                </span>
              </header>
              <ul className="divide-y divide-slate-100">
                {cItems.map((it) => {
                  const due = dueDate(it, employee.date_embauche);
                  const isOverdue = due && !it.done && due < new Date();
                  const docResource = it.resource?.type === "document" ? it.resource.id : null;
                  return (
                    <li key={it.id} className="px-4 sm:px-5 py-3 sm:py-4 flex items-start gap-3">
                      <button
                        onClick={() => toggleItem(it.id)}
                        className={[
                          "mt-0.5 h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                          it.done
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-300 hover:border-slate-500",
                        ].join(" ")}
                        aria-label={it.done ? "Décocher" : "Cocher"}
                      >
                        {it.done && <Check className="h-3.5 w-3.5" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3 flex-wrap">
                          <p
                            className={[
                              "text-sm font-medium",
                              it.done ? "text-slate-400 line-through" : "text-slate-900",
                            ].join(" ")}
                          >
                            {it.title}
                          </p>
                          {due && (
                            <span
                              className={[
                                "text-[10px] tabular-nums px-2 py-0.5 rounded",
                                isOverdue
                                  ? "bg-rose-50 text-rose-700"
                                  : it.done
                                  ? "bg-slate-50 text-slate-400"
                                  : "bg-slate-50 text-slate-500",
                              ].join(" ")}
                            >
                              Échéance : {due.toLocaleDateString("fr-CI")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{it.description}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                          {it.legal_ref && <span>📎 {it.legal_ref}</span>}
                          {it.done && it.done_at && (
                            <span>✓ {new Date(it.done_at).toLocaleDateString("fr-CI")}</span>
                          )}
                        </div>
                        {docResource && !it.done && (
                          <button
                            onClick={() => generateDoc(docResource, it.id)}
                            disabled={generating === it.id}
                            className="mt-2 h-7 inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 text-[11px] font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                          >
                            <Download className="h-3 w-3" />
                            {generating === it.id ? "Génération…" : "Générer le document"}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
