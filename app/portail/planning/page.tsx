export const dynamic = "force-dynamic";
export const metadata = { title: "Mon planning — Portail salarié" };

import { createServerClient } from "@/lib/supabase/server";
import { requirePortailContext } from "@/lib/portail";
import { startOfWeek, addDays, format, parseISO, isToday, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { Calendar as CalendarBlank, ChevronLeft, ChevronRight, Briefcase, Clock } from "lucide-react";

interface PageProps {
  searchParams: { from?: string };
}

interface Slot {
  id: string;
  role_id: string | null;
  start_at: string;
  end_at: string;
  project: string | null;
  notes: string | null;
}

interface Role {
  id: string;
  name: string;
  color: string;
}

export default async function MonPlanningPage({ searchParams }: PageProps) {
  const ctx = await requirePortailContext();
  const supabase = createServerClient();

  const ref = searchParams.from ? new Date(searchParams.from) : new Date();
  const validRef = isNaN(ref.getTime()) ? new Date() : ref;
  const monday = startOfWeek(validRef, { weekStartsOn: 1 });
  const sunday = addDays(monday, 6);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const [{ data: slots }, { data: roles }] = await Promise.all([
    supabase
      .from("planning_slots")
      .select("id, role_id, start_at, end_at, project, notes")
      .eq("employee_id", ctx.employeeId)
      .eq("status", "publie")
      .gte("start_at", monday.toISOString())
      .lt("start_at", addDays(monday, 7).toISOString())
      .order("start_at"),
    supabase
      .from("planning_roles")
      .select("id, name, color"),
  ]);

  const slotList = (slots ?? []) as Slot[];
  const roleMap = new Map<string, Role>((roles ?? []).map((r) => [r.id, r as Role]));

  const slotsByDay = new Map<string, Slot[]>();
  for (const s of slotList) {
    const key = format(parseISO(s.start_at), "yyyy-MM-dd");
    const list = slotsByDay.get(key);
    if (list) list.push(s);
    else slotsByDay.set(key, [s]);
  }

  const totalMinutes = slotList.reduce(
    (acc, s) => acc + differenceInMinutes(parseISO(s.end_at), parseISO(s.start_at)),
    0
  );
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  const prevWeek = format(addDays(monday, -7), "yyyy-MM-dd");
  const nextWeek = format(addDays(monday, 7), "yyyy-MM-dd");
  const todayLink = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CalendarBlank className="h-5 w-5 text-teal-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Mon planning</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Semaine du {format(monday, "d MMMM", { locale: fr })} au {format(sunday, "d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/portail/planning?from=${prevWeek}`}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            title="Semaine précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={`/portail/planning?from=${todayLink}`}
            className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 h-8 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cette semaine
          </Link>
          <Link
            href={`/portail/planning?from=${nextWeek}`}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            title="Semaine suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Stats compactes */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Créneaux" value={slotList.length} icon={CalendarBlank} accent="bg-teal-50 text-teal-600" />
        <StatCard label="Heures totales" value={`${totalHours} h`} icon={Clock} accent="bg-emerald-50 text-emerald-600" />
        <StatCard
          label="Rôles distincts"
          value={new Set(slotList.map((s) => s.role_id).filter(Boolean)).size}
          icon={Briefcase}
          accent="bg-slate-50 text-slate-600"
        />
      </div>

      {/* Grille semaine */}
      {slotList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <CalendarBlank className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Aucun créneau publié cette semaine</p>
          <p className="text-xs text-slate-500 mt-1.5">
            Votre planning n&apos;a pas encore été publié pour cette période. Repassez plus tard ou contactez votre manager.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2.5">
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const list = slotsByDay.get(key) ?? [];
            const today = isToday(d);
            return (
              <div
                key={key}
                className={`rounded-xl border bg-white p-3 min-h-[180px] ${
                  today ? "border-amber-300 bg-amber-50/30" : "border-slate-100"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${today ? "text-amber-700" : "text-slate-400"}`}>
                      {format(d, "EEEE", { locale: fr })}
                    </p>
                    <p className={`text-lg font-bold leading-tight ${today ? "text-amber-700" : "text-slate-800"}`}>
                      {format(d, "d")}
                    </p>
                  </div>
                  {today && (
                    <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800">
                      Aujourd&apos;hui
                    </span>
                  )}
                </div>
                {list.length === 0 ? (
                  <p className="text-[11px] text-slate-300 italic">Libre</p>
                ) : (
                  <ul className="space-y-1.5">
                    {list.map((s) => {
                      const role = s.role_id ? roleMap.get(s.role_id) : null;
                      const bg = role?.color ?? "#94a3b8";
                      return (
                        <li
                          key={s.id}
                          className="rounded-lg px-2 py-1.5 text-[11px] font-semibold text-white shadow-sm"
                          style={{ background: bg }}
                        >
                          <p className="leading-tight">{role?.name ?? "Sans rôle"}</p>
                          <p className="text-[10px] opacity-90 mt-0.5 tabular-nums">
                            {format(parseISO(s.start_at), "HH:mm")} – {format(parseISO(s.end_at), "HH:mm")}
                          </p>
                          {s.project && (
                            <p className="text-[10px] opacity-90 mt-0.5 truncate">📍 {s.project}</p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-slate-400 text-center">
        Les créneaux affichés sont uniquement ceux publiés par votre manager.
      </p>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, accent,
}: { label: string; value: number | string; icon: React.ComponentType<{ className?: string }>; accent: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none">{label}</p>
        <p className="text-lg font-bold text-slate-800 mt-1 leading-none tabular-nums">{value}</p>
      </div>
    </div>
  );
}
