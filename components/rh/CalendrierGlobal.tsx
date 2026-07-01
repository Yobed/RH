"use client";

import { useState, useRef, useEffect } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { fr } from "date-fns/locale";
import { CaretLeft, CaretRight, X } from "@phosphor-icons/react";

const FERIES_CI_2025 = new Set([
  "2025-01-01",
  "2025-04-18",
  "2025-05-01",
  "2025-06-09",
  "2025-08-07",
  "2025-08-15",
  "2025-11-01",
  "2025-11-15",
  "2025-12-25",
]);

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

type EventType = "conge" | "formation" | "medical" | "essai";

export interface CalendarEvent {
  id: string;
  type: EventType;
  label: string;
  employe: string;
  date: string; // YYYY-MM-DD
}

const TYPE_CONFIG: Record<EventType, { dot: string; bg: string; text: string; label: string }> = {
  conge:    { dot: "bg-[#ee7f03]",   bg: "bg-[#ee7f03]/15 dark:bg-[#ee7f03]/20",   text: "text-[#ee7f03] dark:text-[#f8d3a3]",    label: "Congé" },
  formation:{ dot: "bg-green-500",  bg: "bg-green-500/15 dark:bg-green-500/20", text: "text-green-700 dark:text-green-300",  label: "Formation" },
  medical:  { dot: "bg-orange-500", bg: "bg-orange-500/15 dark:bg-orange-500/20",text: "text-orange-700 dark:text-orange-300",label: "Médical" },
  essai:    { dot: "bg-slate-500", bg: "bg-slate-500/15 dark:bg-slate-500/20",text: "text-slate-700 dark:text-slate-300",label: "Période d'essai" },
};

function isFerie(date: Date): boolean {
  return FERIES_CI_2025.has(format(date, "yyyy-MM-dd"));
}

function eventsOnDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const key = format(date, "yyyy-MM-dd");
  return events.filter((e) => e.date === key);
}

interface PopoverProps {
  events: CalendarEvent[];
  dateLabel: string;
  onClose: () => void;
  anchor: { top: number; left: number };
}

function Popover({ events, dateLabel, onClose, anchor }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{ position: "fixed", top: anchor.top, left: anchor.left, zIndex: 50 }}
      className="w-64 rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{dateLabel}</p>
        <button
          onClick={onClose}
          className="p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
        >
          <X size={13} weight="bold" />
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        {events.map((ev) => {
          const cfg = TYPE_CONFIG[ev.type];
          return (
            <div key={ev.id} className={`rounded-lg px-2.5 py-2 ${cfg.bg}`}>
              <p className={`text-[11px] font-bold leading-tight ${cfg.text}`}>{ev.label}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{ev.employe}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  events: CalendarEvent[];
}

export function CalendrierGlobal({ events }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [popover, setPopover] = useState<{
    date: Date;
    events: CalendarEvent[];
    anchor: { top: number; left: number };
  } | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  // Start from Monday
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  function handleDayClick(e: React.MouseEvent, day: Date, dayEvents: CalendarEvent[]) {
    if (dayEvents.length === 0) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopover({
      date: day,
      events: dayEvents,
      anchor: { top: rect.bottom + 4, left: rect.left },
    });
  }

  const monthLabel = format(currentMonth, "MMMM yyyy", { locale: fr });
  // Capitalize
  const monthLabelDisplay = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          aria-label="Mois précédent"
        >
          <CaretLeft size={16} weight="bold" />
        </button>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">{monthLabelDisplay}</h2>
        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          aria-label="Mois suivant"
        >
          <CaretRight size={16} weight="bold" />
        </button>
      </div>

      {/* Grid */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
          {JOURS.map((j) => (
            <div
              key={j}
              className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              {j}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const ferie = isFerie(day);
            const today = isSameDay(day, new Date());
            const dayEvents = eventsOnDay(events, day);
            const MAX_VISIBLE = 2;
            const visible = dayEvents.slice(0, MAX_VISIBLE);
            const overflow = dayEvents.length - MAX_VISIBLE;
            const isWeekend = getDay(day) === 0 || getDay(day) === 6;

            return (
              <button
                key={idx}
                onClick={(e) => handleDayClick(e, day, dayEvents)}
                className={[
                  "relative min-h-[80px] p-1.5 border-b border-r border-slate-100 dark:border-slate-800 text-left transition-colors",
                  isCurrentMonth ? "" : "opacity-40",
                  ferie ? "bg-slate-50 dark:bg-slate-800/60" : isWeekend ? "bg-slate-50/50 dark:bg-slate-800/30" : "bg-white dark:bg-slate-900",
                  dayEvents.length > 0 ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" : "cursor-default",
                ].join(" ")}
                aria-label={`${format(day, "d MMMM yyyy", { locale: fr })}${dayEvents.length > 0 ? `, ${dayEvents.length} événement(s)` : ""}`}
              >
                <span
                  className={[
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold",
                    today
                      ? "bg-[#ee7f03] text-white"
                      : ferie
                      ? "text-slate-400 dark:text-slate-500"
                      : isCurrentMonth
                      ? "text-slate-700 dark:text-slate-300"
                      : "text-slate-400",
                  ].join(" ")}
                >
                  {format(day, "d")}
                </span>
                {ferie && (
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 leading-tight">Férié</span>
                )}
                <div className="flex flex-col gap-0.5 mt-1">
                  {visible.map((ev) => {
                    const cfg = TYPE_CONFIG[ev.type];
                    return (
                      <span
                        key={ev.id}
                        className={`block truncate rounded px-1 py-0.5 text-[9px] font-bold leading-tight ${cfg.bg} ${cfg.text}`}
                        title={`${ev.label} — ${ev.employe}`}
                      >
                        {ev.employe.split(" ")[0]}: {ev.label}
                      </span>
                    );
                  })}
                  {overflow > 0 && (
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold px-1">
                      +{overflow} autre{overflow > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 pt-1">
        {(Object.entries(TYPE_CONFIG) as [EventType, typeof TYPE_CONFIG[EventType]][]).map(([, cfg]) => (
          <span key={cfg.label} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
            {cfg.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-slate-300" />
          Jour férié CI
        </span>
      </div>

      {/* Popover */}
      {popover && (
        <Popover
          events={popover.events}
          dateLabel={format(popover.date, "EEEE d MMMM", { locale: fr })}
          onClose={() => setPopover(null)}
          anchor={popover.anchor}
        />
      )}
    </div>
  );
}
