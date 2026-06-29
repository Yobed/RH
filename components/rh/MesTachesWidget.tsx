"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRight, Check } from "lucide-react";
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
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                Mes Tâches & Validation
              </h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                Flux de travail individuel & équipe
              </p>
            </div>
          </div>
          <Link
            href="/rappels"
            className="text-xs font-black text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 hover:underline shrink-0"
          >
            <span>Voir tout</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                task.completed
                  ? "bg-slate-50 dark:bg-slate-800/20 border-slate-200/60 opacity-60"
                  : task.canceled
                  ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/60 opacity-60"
                  : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-white hover:border-[#059669]/40 hover:shadow-md transition-all"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <button
                  onClick={() => toggleComplete(task.id)}
                  className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                    task.completed
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-slate-400 hover:border-emerald-500 bg-white dark:bg-slate-800"
                  }`}
                >
                  {task.completed && <Check className="h-3 w-3 stroke-[3]" />}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-black leading-snug ${
                      task.completed
                        ? "text-slate-400 line-through"
                        : task.canceled
                        ? "text-rose-400 line-through"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {task.title}
                  </p>
                  <span className="inline-block px-2.5 py-0.5 mt-1.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-200/80 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
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
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-black border border-emerald-200 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Compléter</span>
                    </button>
                    <button
                      onClick={() => toggleCancel(task.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      Annuler
                    </button>
                  </>
                )}
                {(task.completed || task.canceled) && (
                  <button
                    onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: false, canceled: false } : t))}
                    className="text-xs font-black text-slate-600 hover:underline cursor-pointer"
                  >
                    Rétablir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
