"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Clock, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

interface TaskItem {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  canceled: boolean;
}

export function MesTachesWidget() {
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: "1",
      title: "Ajout d'un employé à la plateforme HCM de Bizneo",
      category: "Onboarding RH",
      completed: false,
      canceled: false,
    },
    {
      id: "2",
      title: "Demander un téléphone d'entreprise (Koffi Brou)",
      category: "Matériel",
      completed: false,
      canceled: false,
    },
    {
      id: "3",
      title: "Validation de l'avenant de passage en CDI (Awa Koné)",
      category: "Contractuel",
      completed: false,
      canceled: false,
    },
  ]);

  const toggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed, canceled: false } : t))
    );
  };

  const toggleCancel = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, canceled: !t.canceled, completed: false } : t))
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Mes tâches</h3>
            <p className="text-[11px] text-slate-500 font-medium">Flux de travail individuel & équipe</p>
          </div>
        </div>
        <Link
          href="/rappels"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 hover:underline"
        >
          <span>Aller aux tâches</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              task.completed
                ? "bg-slate-50 dark:bg-slate-800/20 border-slate-200/60 opacity-60"
                : task.canceled
                ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/60 opacity-60"
                : "bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:bg-slate-50 hover:border-slate-200"
            }`}
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <button
                onClick={() => toggleComplete(task.id)}
                className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  task.completed
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-slate-300 hover:border-emerald-500 bg-white dark:bg-slate-800"
                }`}
              >
                {task.completed && <Check className="h-3 w-3 stroke-[3]" />}
              </button>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-bold leading-snug ${
                    task.completed
                      ? "text-slate-400 line-through"
                      : task.canceled
                      ? "text-rose-400 line-through"
                      : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {task.title}
                </p>
                <span className="inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-semibold bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {task.category}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
              {!task.completed && !task.canceled && (
                <>
                  <button
                    onClick={() => toggleComplete(task.id)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200/60 transition-all flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Compléter</span>
                  </button>
                  <button
                    onClick={() => toggleCancel(task.id)}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[11px] font-bold transition-all"
                  >
                    Annuler
                  </button>
                </>
              )}
              {(task.completed || task.canceled) && (
                <button
                  onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: false, canceled: false } : t))}
                  className="text-[11px] font-bold text-slate-500 hover:underline"
                >
                  Rétablir
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
