"use client";

import { Cake, Calendar, Users, PartyPopper } from "lucide-react";

export function AnniversairesEvenementsWidget() {
  const birthdays = [
    {
      name: "Marie Durand",
      date: "17 févr.",
      dept: "Comptabilité",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Isabelle Bon... ",
      date: "17 févr.",
      dept: "Ressources Humaines",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    },
  ];

  const events = [
    { month: "Avr", day: "11", title: "Atelier QVT & Bien-être au travail", type: "Formation" },
    { month: "Mai", day: "16", title: "Comité de Direction Clôture Q1", type: "Réunion" },
    { month: "Mai", day: "18", title: "Journée de Cohésion Équipe", type: "Événement" },
  ];

  const absents = [
    { name: "Koffi Jean", status: "Congés payés", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
    { name: "Aminata Traoré", status: "Télétravail", avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80" },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Anniversaires Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-3">
          <div className="h-7 w-7 rounded-lg bg-pink-50 dark:bg-pink-950/50 flex items-center justify-center text-pink-600 dark:text-pink-400">
            <Cake className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">Anniversaires à venir</h3>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
          {birthdays.map((b, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 p-2 rounded-xl bg-pink-50/40 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/40 shrink-0 min-w-[140px]"
            >
              <img src={b.avatar} alt={b.name} className="h-9 w-9 rounded-full object-cover ring-2 ring-pink-300" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{b.name}</p>
                <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400">{b.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Événements à venir Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-3">
          <div className="h-7 w-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Calendar className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">Événements à venir</h3>
        </div>

        <div className="space-y-2">
          {events.map((e, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="h-10 w-10 rounded-lg bg-amber-500 text-white flex flex-col items-center justify-center shrink-0 leading-none">
                <span className="text-[9px] font-black uppercase tracking-wider opacity-90">{e.month}</span>
                <span className="text-sm font-black mt-0.5">{e.day}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{e.title}</p>
                <span className="text-[10px] font-medium text-slate-400">{e.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Statut de Présence Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-3">
          <div className="h-7 w-7 rounded-lg bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Users className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">Absences & Télétravail</h3>
        </div>

        <div className="space-y-2">
          {absents.map((a, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2">
                <img src={a.avatar} alt={a.name} className="h-7 w-7 rounded-full object-cover" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{a.name}</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {a.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
