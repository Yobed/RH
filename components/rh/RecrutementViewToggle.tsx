"use client";

import { useState, useEffect } from "react";
import { Rows, SquaresFour } from "@phosphor-icons/react";
import { KanbanRecrutement, type KanbanCandidate } from "@/components/rh/KanbanRecrutement";

const STORAGE_KEY = "recrutement-view";

interface Props {
  listView: React.ReactNode;
  candidates: KanbanCandidate[];
}

export function RecrutementViewToggle({ listView, candidates }: Props) {
  const [view, setView] = useState<"liste" | "kanban">("liste");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "kanban" || saved === "liste") {
      setView(saved);
    }
  }, []);

  function switchView(next: "liste" | "kanban") {
    setView(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1 dark:border-slate-700 dark:bg-slate-800/60">
          <button
            onClick={() => switchView("liste")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
              view === "liste"
                ? "bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
            aria-pressed={view === "liste"}
          >
            <Rows size={13} weight="bold" />
            Vue liste
          </button>
          <button
            onClick={() => switchView("kanban")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
              view === "kanban"
                ? "bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
            aria-pressed={view === "kanban"}
          >
            <SquaresFour size={13} weight="bold" />
            Kanban
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "liste" ? listView : <KanbanRecrutement candidates={candidates} />}
    </div>
  );
}
