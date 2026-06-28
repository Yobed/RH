"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Parcours guidé (stepper) — montre les étapes ordonnées d'un processus et où
// l'on se trouve. Route-aware : l'étape active = la page courante (match exact).
// Ne s'affiche QUE sur une page du parcours (sinon rend null), pour ne pas
// polluer les autres pages d'une même section.
// ─────────────────────────────────────────────────────────────────────────────

export interface ProcessStep {
  label: string;
  href: string;
}

export function ProcessStepper({
  steps,
  title,
}: {
  steps: ProcessStep[];
  title?: string;
}) {
  const pathname = usePathname();
  const currentIndex = steps.findIndex((s) => pathname === s.href);

  // Page hors parcours → on n'affiche rien (pas de conteneur, pas d'espace vide)
  if (currentIndex === -1) return null;

  return (
    <div className="px-4 pt-4 sm:px-6 md:px-8">
    <nav
      aria-label={title ?? "Étapes du processus"}
      className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_1px_8px_-2px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-[oklch(0.17_0.03_255)]"
    >
      {title && (
        <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          {title}
        </p>
      )}
      <ol className="flex items-center gap-1 overflow-x-auto">
        {steps.map((step, i) => {
          const status =
            i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming";
          const isLast = i === steps.length - 1;

          return (
            <li key={step.href} className="flex shrink-0 items-center">
              <Link
                href={step.href}
                aria-current={status === "current" ? "step" : undefined}
                className={cn(
                  "group flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-400",
                  status === "current" &&
                    "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300",
                  status === "done" &&
                    "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5",
                  status === "upcoming" &&
                    "text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-white/5"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    status === "current" && "bg-teal-600 text-white",
                    status === "done" && "bg-emerald-500 text-white",
                    status === "upcoming" &&
                      "border border-slate-300 text-slate-400 dark:border-slate-600"
                  )}
                >
                  {status === "done" ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className="whitespace-nowrap">{step.label}</span>
              </Link>

              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    "mx-0.5 h-px w-5 shrink-0",
                    i < currentIndex ? "bg-emerald-300 dark:bg-emerald-500/40" : "bg-slate-200 dark:bg-slate-700"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
    </div>
  );
}
