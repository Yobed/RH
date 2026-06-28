"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export function MonCalendrierAbsencesWidget() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1)); // Avril 2026 for demonstration

  const daysInMonth = 30;
  const startDayOffset = 3; // Wednesday start

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: startDayOffset }, (_, i) => i);

  // Highlighted days (absences or events)
  const leaveDays = [9, 10, 11, 28, 29, 30];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Mon calendrier</h3>
            <p className="text-[11px] text-slate-500 font-medium">Gestion du temps & solde congés</p>
          </div>
        </div>
      </div>

      {/* Leave Balance Counter Cards */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
            🌴
          </div>
          <div>
            <span className="text-base font-bold text-emerald-800 dark:text-emerald-300 leading-none block">12j</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block mt-0.5">Disponibles</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
            ⏳
          </div>
          <div>
            <span className="text-base font-bold text-amber-800 dark:text-amber-300 leading-none block">3j</span>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 block mt-0.5">En attente</span>
          </div>
        </div>
      </div>

      {/* Mini Calendar Navigation */}
      <div className="bg-slate-50/60 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <button className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Avril 2026</span>
          <button className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 uppercase mb-2">
          <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
          {paddingDays.map((p) => (
            <div key={`pad-${p}`} className="h-6 w-full" />
          ))}
          {days.map((d) => {
            const isSelected = leaveDays.includes(d);
            const isToday = d === 14;
            return (
              <button
                key={d}
                className={`h-6 w-full rounded-md flex items-center justify-center transition-all ${
                  isToday
                    ? "bg-[#0d9488] text-white font-bold shadow-xs"
                    : isSelected
                    ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-300/50"
                    : "hover:bg-slate-200/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA Button */}
      <Link
        href="/conges"
        className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4 stroke-[2.5]" />
        <span>Demander une absence</span>
      </Link>
    </div>
  );
}
