"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock, Activity, Timer } from "lucide-react";
import { format, addDays, parseISO, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { PageHelp } from "./PageHelp";

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
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold font-heading">Pointage</h1>
            <PageHelp text="Le suivi des heures d'arrivée et de départ de vos salariés, semaine par semaine. Il sert de base au calcul des heures travaillées et des heures supplémentaires." />
          </div>
          <p className="text-sm text-slate-500">
            Heures travaillées · Semaine du {format(monday, "d MMM", { locale: fr })} au{" "}
            {format(addDays(monday, 6), "d MMM yyyy", { locale: fr })}
          </p>
        </div>

        <div className="flex items-center bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => navigate(-1)}
            disabled={isPending}
            className="p-1.5 rounded-md hover:bg-white"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={goToday}
            disabled={isPending}
            className="px-3 py-1 text-xs font-medium text-slate-700 hover:bg-white rounded-md"
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => navigate(1)}
            disabled={isPending}
            className="p-1.5 rounded-md hover:bg-white"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="Collaborateurs" value={String(employees.length)} icon={Activity} />
        <Kpi label="Total heures" value={formatHM(totalMinutes)} icon={Timer} />
        <Kpi label="Moyenne / pers." value={formatHM(avgPerEmployee)} icon={Clock} />
        <Kpi
          label="Présents aujourd'hui"
          value={`${presentToday} / ${employees.length}`}
          icon={Activity}
          color={presentToday > 0 ? "text-emerald-600" : "text-slate-800"}
        />
      </div>

      {/* Grille */}
      {employees.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center text-slate-400">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun collaborateur actif</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-slate-50 border-b border-r border-slate-200 px-4 py-3 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-widest min-w-[180px]">
                    Collaborateur
                  </th>
                  {days.map(d => (
                    <th
                      key={d.toISOString()}
                      className={`border-b border-slate-200 px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-widest min-w-[80px] ${isToday(d) ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-600"}`}
                    >
                      <div>{format(d, "EEE", { locale: fr })}</div>
                      <div className="text-base font-bold normal-case">{format(d, "d", { locale: fr })}</div>
                    </th>
                  ))}
                  <th className="border-b border-l border-slate-200 bg-slate-50 px-3 py-3 text-center text-[10px] font-semibold text-slate-700 uppercase tracking-widest">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map(emp => {
                  const total = totalsByEmployee.get(emp.id) ?? 0;
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/40">
                      <td className="sticky left-0 z-10 bg-white border-r border-slate-200 px-4 py-2">
                        <p className="font-semibold text-xs text-slate-800 truncate">{emp.full_name}</p>
                        {emp.poste && <p className="text-[10px] text-slate-500 truncate">{emp.poste}</p>}
                      </td>
                      {days.map(d => {
                        const dateStr = format(d, "yyyy-MM-dd");
                        const m = minutesByCell.get(`${emp.id}_${dateStr}`) ?? 0;
                        return (
                          <td
                            key={dateStr}
                            className={`px-2 py-2 text-center font-mono tabular-nums text-xs ${isToday(d) ? "bg-blue-50/30" : ""} ${m > 0 ? "text-slate-800 font-semibold" : "text-slate-300"}`}
                          >
                            {formatHM(m)}
                          </td>
                        );
                      })}
                      <td className={`px-3 py-2 text-center border-l border-slate-100 font-mono tabular-nums text-xs ${total > 0 ? "font-bold text-emerald-700 bg-emerald-50/40" : "text-slate-300"}`}>
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
  );
}

function Kpi({
  label, value, icon: Icon, color = "text-slate-800",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">{label}</p>
        <Icon className="w-3.5 h-3.5 text-slate-300" />
      </div>
      <p className={`text-xl font-bold mt-1 tabular-nums ${color}`}>{value}</p>
    </div>
  );
}
