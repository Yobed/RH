"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRight, Check, Clock, AlertCircle, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

interface TaskItem {
  id: string;
  title: string;
  category: string;
  priority: "Haute" | "Moyenne" | "Normale";
  dueDate: string;
  source: string;
  completed: boolean;
  canceled: boolean;
}

export function MesTachesWidget() {
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: "1",
      title: "Ajout d'un employé à la plateforme HCM Bizneo",
      category: "Onboarding RH",
      priority: "Haute",
      dueDate: "Aujourd'hui",
      source: "Workflow d'Embauche automatique",
      completed: false,
      canceled: false,
    },
    {
      id: "2",
      title: "Demander un téléphone d'entreprise (Koffi Brou)",
      category: "Matériel",
      priority: "Moyenne",
      dueDate: "Demain",
      source: "Portail Employé (Self-Service)",
      completed: false,
      canceled: false,
    },
    {
      id: "3",
      title: "Validation de l'avenant de passage en CDI (Awa Koné)",
      category: "Contractuel",
      priority: "Haute",
      dueDate: "Dans 48h",
      source: "Alerte Décret n°96-195",
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

  const pendingCount = tasks.filter((t) => !t.completed && !t.canceled).length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all flex flex-col justify-between h-full w-full">
      <div>
        {/* Header - Strictly Harmonized 3 Colors */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  Mes Tâches & Validations RH
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                  <Zap className="h-3 w-3 fill-emerald-600 text-emerald-600" /> Auto-Alimenté
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                {pendingCount > 0 ? `${pendingCount} validation(s) prioritaire(s) en attente d'action` : "Toutes les tâches sont à jour"}
              </p>
            </div>
          </div>
          <Link
            href="/rappels"
            className="text-xs font-black text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 flex items-center gap-1 hover:underline shrink-0 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 rounded-xl border border-emerald-200/80 transition-all"
          >
            <span>Console Globale</span>
            <ArrowRight className="h-3.5 w-3.5 text-current" />
          </Link>
        </div>

        {/* Task List - 3-Color Strict Palette */}
        <div className="space-y-3.5 mb-6">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                task.completed
                  ? "bg-slate-50 dark:bg-slate-800/20 border-slate-200 opacity-60"
                  : task.canceled
                  ? "bg-slate-100 dark:bg-slate-800/40 border-slate-300 opacity-60"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-white hover:border-emerald-500 hover:shadow-md transition-all"
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <button
                  onClick={() => toggleComplete(task.id)}
                  className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                    task.completed
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "border-slate-400 hover:border-emerald-600 bg-white dark:bg-slate-800"
                  }`}
                  title={task.completed ? "Marquer comme non terminé" : "Valider la tâche"}
                >
                  {task.completed && <Check className="h-3.5 w-3.5 stroke-[3] text-white" />}
                </button>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <p
                    className={`text-sm font-black leading-snug text-left ${
                      task.completed || task.canceled
                        ? "text-slate-400 line-through"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {task.title}
                  </p>
                  
                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                      {task.category}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                      <AlertCircle className="h-3 w-3 text-current" />
                      Priorité {task.priority}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1">
                      <Clock className="h-3 w-3 text-slate-500" /> Échéance: <strong className="text-slate-800 dark:text-slate-200">{task.dueDate}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons - Harmonized 3 Colors */}
              <div className="flex items-center gap-2 shrink-0 self-start md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-700 w-full md:w-auto justify-end">
                {!task.completed && !task.canceled && (
                  <>
                    <button
                      onClick={() => toggleComplete(task.id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <CheckCircle2 className="h-4 w-4 text-white" />
                      <span>Compléter</span>
                    </button>
                    <button
                      onClick={() => toggleCancel(task.id)}
                      className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                    >
                      Annuler
                    </button>
                  </>
                )}
                {(task.completed || task.canceled) && (
                  <button
                    onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: false, canceled: false } : t))}
                    className="text-xs font-black text-emerald-600 hover:underline cursor-pointer py-1 px-2"
                  >
                    Rétablir la tâche
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Executive Footer explaining the automated feeding mechanism */}
      <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold leading-tight">
            <strong>Source d'alimentation :</strong> Généré automatiquement par les workflows RH (Onboarding, demandes self-service & alertes légales CI).
          </span>
        </div>
      </div>
    </div>
  );
}
