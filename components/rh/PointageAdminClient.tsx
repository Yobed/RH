"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock, Activity, Timer, Camera, Calendar, Sparkles, ShieldCheck } from "lucide-react";
import { format, addDays, parseISO, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { PageHelp } from "./PageHelp";
import { BiometricPointageSection } from "./BiometricPointageSection";

export type Employee = { id: string; full_name: string; poste: string | null };
export type TimeEntry = {
  id: string;
  employee_id: string;
  date: string;
  clock_in: string;
  clock_out: string | null;
  worked_minutes: number | null;
};

interface Props {
  employees: Employee[];
  entries: TimeEntry[];
  weekStart: string;
}

function formatHM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return min === 0 ? "—" : `${h}h${String(m).padStart(2, "0")}`;
}

export function PointageAdminClient({ employees, entries, weekStart }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"biometric" | "weekly">("biometric");

  const monday = useMemo(() => parseISO(weekStart), [weekStart]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday]);

  /** Map: empId_date → total minutes (somme des entries closes) */
  const minutesByCell = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of entries) {
      if (e.worked_minutes == null) continue;
      const k = `${e.employee_id}_${e.date}`;
      m.set(k, (m.get(k) ?? 0) + e.worked_minutes);
    }
    return m;
  }, [entries]);

  const totalsByEmployee = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of entries) {
      if (e.worked_minutes == null) continue;
      m.set(e.employee_id, (m.get(e.employee_id) ?? 0) + e.worked_minutes);
    }
    return m;
  }, [entries]);

  const totalMinutes = Array.from(totalsByEmployee.values()).reduce((a, b) => a + b, 0);
  const avgPerEmployee = employees.length > 0 ? Math.round(totalMinutes / employees.length) : 0;
  const presentToday = new Set(
    entries.filter(e => e.date === format(new Date(), "yyyy-MM-dd")).map(e => e.employee_id)
  ).size;

  const navigate = (delta: number) => {
    const newMonday = addDays(monday, delta * 7);
    startTransition(() => {
      router.push(`/pointage?week=${format(newMonday, "yyyy-MM-dd")}`, { scroll: false });
    });
  };

  const goToday = () => {
    const today = new Date();
    const dow = today.getDay(); // 0 = Sun, 1 = Mon...
    const mondayOfWeek = addDays(today, dow === 0 ? -6 : 1 - dow);
    startTransition(() => {
      router.push(`/pointage?week=${format(mondayOfWeek, "yyyy-MM-dd")}`, { scroll: false });
    });
  };

  return (
    <div className="space-y-6">
      {/* Radiant Page Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 shadow-md dark:border-slate-800">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                <Sparkles className="h-4 w-4" />
              </span>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Gestion & Pointage Biométrique
              </h1>
              <PageHelp text="Module de pointage biométrique par reconnaissance faciale 3D et suivi synthétique des heures de travail." />
            </div>
            <p className="text-xs text-slate-300">
              Surveillance en temps réel de la présence physique, de la ponctualité et du temps de travail effectif.
            </p>
          </div>

          {/* Radiant View Switcher Tabs */}
          <div className="flex items-center bg-slate-950/60 p-1.5 rounded-xl border border-white/10 backdrop-blur-md self-start sm:self-auto shadow-inner">
            <button
              onClick={() => setActiveTab("biometric")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "biometric"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/50"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Borne & Scan Facialis</span>
            </button>

            <button
              onClick={() => setActiveTab("weekly")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "weekly"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/50"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Synthèse Hebdomadaire</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic View rendering */}
      {activeTab === "biometric" ? (
        <BiometricPointageSection employees={employees} />
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Heures Travaillées Semaine par Semaine
              </h3>
              <p className="text-xs text-slate-500">
                Semaine du <span className="font-semibold text-slate-700 dark:text-slate-300">{format(monday, "d MMM", { locale: fr })}</span> au{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">{format(addDays(monday, 6), "d MMM yyyy", { locale: fr })}</span>
              </p>
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 self-start border border-slate-200/60 dark:border-slate-700">
              <button
                onClick={() => navigate(-1)}
                disabled={isPending}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToday}
                disabled={isPending}
                className="px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => navigate(1)}
                disabled={isPending}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Radiant KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Kpi label="Collaborateurs" value={String(employees.length)} icon={Activity} />
            <Kpi label="Total heures" value={formatHM(totalMinutes)} icon={Timer} highlight />
            <Kpi label="Moyenne / pers." value={formatHM(avgPerEmployee)} icon={Clock} />
            <Kpi
              label="Présents aujourd'hui"
              value={`${presentToday} / ${employees.length}`}
              icon={ShieldCheck}
              color={presentToday > 0 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-800 dark:text-slate-200"}
              highlight={presentToday > 0}
            />
          </div>

          {/* Grille */}
          {employees.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-16 text-center text-slate-400 shadow-2xs">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-500" />
              <p className="text-sm font-semibold">Aucun collaborateur actif</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs border-b border-r border-slate-200 dark:border-slate-700 px-4 py-3.5 text-left text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest min-w-[180px]">
                        Collaborateur
                      </th>
                      {days.map(d => (
                        <th
                          key={d.toISOString()}
                          className={`border-b border-slate-200 dark:border-slate-700 px-2 py-3.5 text-center text-[10px] font-bold uppercase tracking-widest min-w-[85px] ${isToday(d) ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-extrabold" : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300"}`}
                        >
                          <div>{format(d, "EEE", { locale: fr })}</div>
                          <div className="text-base font-bold normal-case">{format(d, "d", { locale: fr })}</div>
                        </th>
                      ))}
                      <th className="border-b border-l border-slate-200 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs px-3 py-3.5 text-center text-[10px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {employees.map(emp => {
                      const total = totalsByEmployee.get(emp.id) ?? 0;
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 px-4 py-3">
                            <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{emp.full_name}</p>
                            {emp.poste && <p className="text-[10px] text-slate-500 truncate font-medium">{emp.poste}</p>}
                          </td>
                          {days.map(d => {
                            const dateStr = format(d, "yyyy-MM-dd");
                            const m = minutesByCell.get(`${emp.id}_${dateStr}`) ?? 0;
                            return (
                              <td
                                key={dateStr}
                                className={`px-2 py-3 text-center font-mono tabular-nums text-xs ${isToday(d) ? "bg-emerald-500/5 dark:bg-emerald-500/10 font-bold" : ""} ${m > 0 ? "text-slate-900 dark:text-slate-100 font-semibold" : "text-slate-300 dark:text-slate-600"}`}
                              >
                                {formatHM(m)}
                              </td>
                            );
                          })}
                          <td className={`px-3 py-3 text-center border-l border-slate-100 dark:border-slate-800 font-mono tabular-nums text-xs ${total > 0 ? "font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-950/40" : "text-slate-300 dark:text-slate-600"}`}>
                            {formatHM(total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Kpi({
  label, value, icon: Icon, color = "text-slate-900 dark:text-white", highlight = false,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 shadow-2xs transition-all ${
      highlight
        ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-white to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 dark:border-emerald-500/30"
        : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900"
    }`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">{label}</p>
        <Icon className={`w-4 h-4 ${highlight ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
      </div>
      <p className={`text-xl font-extrabold mt-1.5 tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

