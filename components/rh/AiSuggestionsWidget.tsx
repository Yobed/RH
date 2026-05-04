"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Robot, ArrowRight, SpinnerGap } from "@phosphor-icons/react";

interface Suggestion {
  id: string;
  priorite: "haute" | "moyenne" | "basse";
  emoji: string;
  titre: string;
  action: string;
  href: string;
}

interface Props {
  totalActifs: number;
  cddExpirant: number;
  medicalAlertsCount: number;
  evalBrouillon: number;
  contentieuxOuverts: number;
  congesEnAttente: number;
}

const PRIORITY_STYLES: Record<
  Suggestion["priorite"],
  { card: string; badge: string; badgeText: string; dot: string }
> = {
  haute: {
    card: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50",
    badge: "bg-rose-100 dark:bg-rose-900/50 border-rose-200 dark:border-rose-700",
    badgeText: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  moyenne: {
    card: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50",
    badge: "bg-amber-100 dark:bg-amber-900/50 border-amber-200 dark:border-amber-700",
    badgeText: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  basse: {
    card: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50",
    badge: "bg-emerald-100 dark:bg-emerald-900/50 border-emerald-200 dark:border-emerald-700",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
};

const PRIORITY_LABEL: Record<Suggestion["priorite"], string> = {
  haute: "Prioritaire",
  moyenne: "Importante",
  basse: "À planifier",
};

export function AiSuggestionsWidget({
  totalActifs,
  cddExpirant,
  medicalAlertsCount,
  evalBrouillon,
  contentieuxOuverts,
  congesEnAttente,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchSuggestions = async () => {
      try {
        const res = await fetch("/api/ai-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            totalActifs,
            cddExpirant,
            medicalAlertsCount,
            evalBrouillon,
            contentieuxOuverts,
            congesEnAttente,
          }),
        });

        if (!res.ok) throw new Error("Réponse non valide");

        const data = (await res.json()) as { suggestions: Suggestion[] };
        if (!cancelled) setSuggestions(data.suggestions ?? []);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSuggestions();
    return () => {
      cancelled = true;
    };
  }, [
    totalActifs,
    cddExpirant,
    medicalAlertsCount,
    evalBrouillon,
    contentieuxOuverts,
    congesEnAttente,
  ]);

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-[oklch(0.155_0.030_248)] shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] p-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "oklch(0.175 0.045 248)", color: "oklch(0.78 0.13 73)" }}
        >
          <Robot weight="duotone" size={18} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">
            Suggestions IA
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Analyse contextuelle de vos indicateurs RH
          </p>
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="flex items-center gap-2.5 py-6 justify-center">
          <SpinnerGap
            size={18}
            className="animate-spin text-slate-400 dark:text-slate-500"
          />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Analyse en cours…
          </span>
        </div>
      )}

      {!loading && error && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
          Suggestions indisponibles pour le moment.
        </p>
      )}

      {!loading && !error && suggestions.length === 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
          Aucune suggestion générée.
        </p>
      )}

      {!loading && !error && suggestions.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {suggestions.map((s) => {
            const styles = PRIORITY_STYLES[s.priorite] ?? PRIORITY_STYLES.basse;
            return (
              <div
                key={s.id}
                className={`rounded-xl border p-4 flex flex-col gap-2.5 ${styles.card}`}
              >
                {/* Priority badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xl leading-none">{s.emoji}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-widest ${styles.badge} ${styles.badgeText}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
                    {PRIORITY_LABEL[s.priorite]}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                    {s.titre}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                    {s.action}
                  </p>
                </div>

                {/* CTA */}
                <Link
                  href={s.href}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors self-start group"
                >
                  Agir
                  <ArrowRight
                    size={11}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
