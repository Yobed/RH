"use client";

import { Briefcase, TrendingUp, MapPin, GraduationCap, FileEdit } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface CareerEvent {
  id: string;
  event_type: string;
  date_event: string;
  description: string;
  old_value?: any;
  new_value?: any;
}

export function CareerTimeline({ events }: { events: CareerEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground bg-white">
        Aucun événement de carrière enregistré.
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "promotion":
        return <TrendingUp className="h-4 w-4" />;
      case "mutation":
        return <MapPin className="h-4 w-4" />;
      case "formation":
        return <GraduationCap className="h-4 w-4" />;
      case "avenant":
        return <FileEdit className="h-4 w-4" />;
      default:
        return <Briefcase className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "promotion":
        return "text-emerald-600 bg-emerald-100 border-emerald-200";
      case "mutation":
        return "text-teal-600 bg-teal-100 border-teal-200";
      case "formation":
        return "text-slate-600 bg-slate-100 border-slate-200";
      case "avenant":
        return "text-amber-600 bg-amber-100 border-amber-200";
      default:
        return "text-slate-600 bg-slate-100 border-slate-200";
    }
  };

  const safeFormatDate = (dateStr: string | null | undefined, fmtStr: string) => {
    if (!dateStr) return "Date indét.";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Date invalide";
    return format(d, fmtStr, { locale: fr });
  };

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200 py-4">
      {events.map((event) => (
        <div key={event.id} className="relative pl-12 group">
          <div
            className={`absolute left-0 p-2 rounded-full border-2 bg-white transition-all z-10 ${getEventColor(
              event.event_type
            )}`}
          >
            {getIcon(event.event_type)}
          </div>
          <div className="flex flex-col gap-1 bg-white p-3 rounded-lg border shadow-sm group-hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-900 capitalize">
                {event.event_type}
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600">
                {safeFormatDate(event.date_event, "d MMM yyyy")}
              </span>
            </div>
            <p className="text-sm text-slate-600">{event.description}</p>
            {event.new_value && typeof event.new_value === "object" && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {Object.entries(event.new_value).map(([key, val]) => (
                  <div key={key} className="text-[10px] bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    <span className="text-muted-foreground">{key}: </span>
                    <span className="font-medium text-slate-700">{String(val)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
