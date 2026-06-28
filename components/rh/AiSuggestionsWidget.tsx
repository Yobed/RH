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
  { card: string; badge: string; badgeText: string }
> = {
  haute: {
    card: "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
    badge: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    badgeText: "text-slate-600 dark:text-slate-400",
  },
  moyenne: {
    card: "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
    badge: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    badgeText: "text-slate-600 dark:text-slate-400",
  },
  basse: {
    card: "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
    badge: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    badgeText: "text-slate-500 dark:text-slate-500",
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
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 transition-all">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-[#059669]/10 text-[#059669]">
          <Robot weight="duotone" size={18} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 leading-none">
            Suggestions IA
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            Analyse contextuelle de vos indicateurs RH
          </p>
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="flex items-center gap-2.5 py-6 justify-center">
          <SpinnerGap
            size={18}
            className="animate-spin text-[#059669]"
          />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
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
                className={`rounded-lg border p-3.5 flex flex-col justify-between gap-3 transition-all ${styles.card}`}
              >
                {/* Priority badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg leading-none">{s.emoji}</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold tracking-wide ${styles.badge} ${styles.badgeText}`}
                  >
                    {PRIORITY_LABEL[s.priorite]}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                    {s.titre}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                    {s.action}
                  </p>
                </div>

                {/* CTA */}
                <Link
                  href={s.href}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#059669] hover:text-[#047857] hover:underline transition-all self-start group pt-1"
                >
                  Agir
                  <ArrowRight
                    size={12}
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
