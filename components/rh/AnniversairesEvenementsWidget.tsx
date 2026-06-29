"use client";

import { Cake, Calendar, Users } from "lucide-react";

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch w-full">
      {/* 1. Événements à venir Card (Highlighting top priority) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3.5">
            <div className="h-9 w-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Événements à venir</h3>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Agenda d'entreprise</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {events.map((e, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex flex-col items-center justify-center shrink-0 leading-none shadow-xs">
                  <span className="text-[9px] font-black uppercase tracking-wider opacity-90">{e.month}</span>
                  <span className="text-sm font-black mt-0.5">{e.day}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">{e.title}</p>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md inline-block mt-0.5 border border-amber-200/50">
                    {e.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Statut de Présence Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3.5">
            <div className="h-9 w-9 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Absences & Télétravail</h3>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Planning du jour</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {absents.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <img src={a.avatar} alt={a.name} className="h-8 w-8 rounded-full object-cover ring-2 ring-sky-200" />
                  <span className="text-xs font-black text-slate-900 dark:text-white">{a.name}</span>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200/80">
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Anniversaires Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3.5">
            <div className="h-9 w-9 rounded-2xl bg-pink-500 text-white flex items-center justify-center shadow-md shadow-pink-500/20 shrink-0">
              <Cake className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Anniversaires</h3>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Célébrations à venir</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {birthdays.map((b, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-pink-50/40 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/40"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img src={b.avatar} alt={b.name} className="h-8 w-8 rounded-full object-cover ring-2 ring-pink-300 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate">{b.name}</p>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate block">{b.dept}</span>
                  </div>
                </div>
                <span className="text-[10px] font-black text-pink-700 dark:text-pink-300 bg-pink-100/80 dark:bg-pink-950 px-2 py-0.5 rounded-md shrink-0 border border-pink-200/60">
                  {b.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
