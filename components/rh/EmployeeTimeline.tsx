"use client";

export interface TimelineEvent {
  date: string;
  type:
    | "embauche"
    | "contrat"
    | "salaire"
    | "conge"
    | "evaluation"
    | "formation"
    | "accident"
    | "autre";
  titre: string;
  description?: string;
}

interface EmployeeTimelineProps {
  events: TimelineEvent[];
}

const typeConfig: Record<
  TimelineEvent["type"],
  { bg: string; ring: string; icon: React.ReactNode; label: string }
> = {
  embauche: {
    bg: "bg-emerald-500 dark:bg-emerald-600",
    ring: "ring-emerald-200 dark:ring-emerald-900",
    label: "Embauche",
    icon: (
      <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  contrat: {
    bg: "bg-teal-500 dark:bg-teal-600",
    ring: "ring-teal-200 dark:ring-teal-900",
    label: "Contrat",
    icon: (
      <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  salaire: {
    bg: "bg-amber-500 dark:bg-amber-600",
    ring: "ring-amber-200 dark:ring-amber-900",
    label: "Salaire",
    icon: (
      <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  conge: {
    bg: "bg-sky-500 dark:bg-sky-600",
    ring: "ring-sky-200 dark:ring-sky-900",
    label: "Congé",
    icon: (
      <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  evaluation: {
    bg: "bg-slate-500 dark:bg-slate-600",
    ring: "ring-slate-200 dark:ring-slate-900",
    label: "Évaluation",
    icon: (
      <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  formation: {
    bg: "bg-teal-500 dark:bg-teal-600",
    ring: "ring-teal-200 dark:ring-teal-900",
    label: "Formation",
    icon: (
      <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  accident: {
    bg: "bg-red-500 dark:bg-red-600",
    ring: "ring-red-200 dark:ring-red-900",
    label: "Accident",
    icon: (
      <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  autre: {
    bg: "bg-slate-500 dark:bg-slate-600",
    ring: "ring-slate-200 dark:ring-slate-700",
    label: "Autre",
    icon: (
      <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
      </svg>
    ),
  },
};

function safeFormatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("fr-CI", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export function EmployeeTimeline({ events }: EmployeeTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Aucun événement enregistré</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">La chronologie apparaîtra ici</p>
      </div>
    );
  }

  return (
    <div className="relative pl-8 space-y-0">
      {/* Ligne centrale */}
      <div className="absolute left-[15px] top-4 bottom-4 w-px bg-slate-200 dark:bg-slate-700" />

      {events.map((event, index) => {
        const cfg = typeConfig[event.type];
        return (
          <div key={index} className="relative flex gap-5 pb-6 last:pb-0">
            {/* Cercle */}
            <div
              className={`absolute left-[-23px] flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-2 ${cfg.bg} ${cfg.ring} z-10`}
            >
              {cfg.icon}
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                    {event.titre}
                  </p>
                  {event.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {event.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end shrink-0 gap-1">
                  <time className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    {safeFormatDate(event.date)}
                  </time>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${cfg.bg}`}>
                    {cfg.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
