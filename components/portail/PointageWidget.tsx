"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, Square, Clock } from "lucide-react";
import { toast } from "sonner";

interface ActiveEntry {
  id: string;
  clock_in: string;
}

interface Props {
  active: ActiveEntry | null;
  todayMinutes: number;
}

function formatHM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}`;
}

export function PointageWidget({ active, todayMinutes }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const update = () => {
      const start = new Date(active.clock_in).getTime();
      setElapsed(Math.max(0, Math.round((Date.now() - start) / 60000)));
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [active]);

  const handle = (action: "in" | "out") => {
    startTransition(async () => {
      const res = await fetch("/api/pointage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast.success(action === "in" ? "Pointage d'entrée enregistré" : "Pointage de sortie enregistré");
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({})) as { error?: string };
        toast.error(err.error ?? "Erreur");
      }
    });
  };

  const totalToday = todayMinutes + (active ? elapsed : 0);

  return (
    <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
            Pointage du jour
          </p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
            {formatHM(totalToday)}
          </p>
          {active ? (
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              En cours depuis {new Date(active.clock_in).toLocaleTimeString("fr-CI", { hour: "2-digit", minute: "2-digit" })}
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              <Clock className="w-3 h-3 inline mr-1" />
              Aucun pointage actif
            </p>
          )}
        </div>

        <button
          onClick={() => handle(active ? "out" : "in")}
          disabled={isPending}
          className={
            active
              ? "h-11 px-5 inline-flex items-center gap-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-60 transition-colors"
              : "h-11 px-5 inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors"
          }
        >
          {active ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPending ? "…" : active ? "Pointer la sortie" : "Pointer l'arrivée"}
        </button>
      </div>
    </section>
  );
}
