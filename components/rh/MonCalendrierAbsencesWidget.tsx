"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, CheckCircle, Clock, Info } from "lucide-react";
import Link from "next/link";

export function MonCalendrierAbsencesWidget() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1)); // Avril 2026
  const [selectedDay, setSelectedDay] = useState<number | null>(14);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString("fr-FR", { month: "long", year: "numeric" });
  const formattedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Offset for Monday start (0 = Monday, ..., 6 = Sunday)
  const startDayOffset = (firstDayIndex + 6) % 7;

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: startDayOffset }, (_, i) => i);

  // Simulated leave days for April 2026
  const leaveDaysMap: Record<number, { type: string; bg: string }> = {
    9: { type: "Congé Payé", bg: "bg-amber-100 text-amber-800 border-amber-300" },
    10: { type: "Congé Payé", bg: "bg-amber-100 text-amber-800 border-amber-300" },
    11: { type: "Congé Payé", bg: "bg-amber-100 text-amber-800 border-amber-300" },
    28: { type: "Permission RTT", bg: "bg-sky-100 text-sky-800 border-sky-300" },
    29: { type: "Permission RTT", bg: "bg-sky-100 text-sky-800 border-sky-300" },
    30: { type: "Permission RTT", bg: "bg-sky-100 text-sky-800 border-sky-300" },
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all flex flex-col justify-between h-full">
      <div>
        {/* Header Widget */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                Calendrier d'Équipe & Absences
              </h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                Planning temps réel & solde des congés
              </p>
            </div>
          </div>
        </div>

        {/* Counter Cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-sm font-black shadow-xs">
              🌴
            </div>
            <div>
              <span className="text-lg font-black text-emerald-900 dark:text-emerald-200 leading-none block">12 jours</span>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">Solde Disponible</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center text-sm font-black shadow-xs">
              ⏳
            </div>
            <div>
              <span className="text-lg font-black text-amber-900 dark:text-amber-200 leading-none block">3 jours</span>
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block mt-0.5">En attente d'arbitrage</span>
            </div>
          </div>
        </div>

        {/* Navigation du Calendrier */}
        <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 mb-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs transition-all border border-transparent hover:border-slate-200"
              title="Mois précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {formattedMonthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs transition-all border border-transparent hover:border-slate-200"
              title="Mois suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 text-center text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-2">
            <span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span>
          </div>

          {/* Grille dynamique des jours */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold">
            {paddingDays.map((p) => (
              <div key={`pad-${p}`} className="h-8 w-full" />
            ))}
            {days.map((d) => {
              const leaveInfo = month === 3 && year === 2026 ? leaveDaysMap[d] : null;
              const isToday = d === 14 && month === 3 && year === 2026;
              const isSelected = selectedDay === d;

              return (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`h-8 w-full rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-[#ee7f03] ring-offset-1 font-black text-slate-900 bg-white dark:bg-slate-800 shadow-xs"
                      : ""
                  } ${
                    isToday
                      ? "bg-[#ee7f03] text-white font-black shadow-md shadow-emerald-600/20"
                      : leaveInfo
                      ? `${leaveInfo.bg} font-extrabold border`
                      : "hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* Détails du jour sélectionné */}
        {selectedDay && (
          <div className="mb-4 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-[#ee7f03]" />
              <span className="font-bold text-slate-900 dark:text-white">
                {selectedDay} {formattedMonthName} :
              </span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {month === 3 && year === 2026 && leaveDaysMap[selectedDay]
                  ? leaveDaysMap[selectedDay].type
                  : "Aucun événement prévu"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action CTA */}
      <Link
        href="/conges"
        className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-extrabold transition-all shadow-lg flex items-center justify-center gap-2 mt-2"
      >
        <Plus className="h-4 w-4 stroke-[3]" />
        <span>Soumettre ou Valider une Demande d'Absence</span>
      </Link>
    </div>
  );
}
