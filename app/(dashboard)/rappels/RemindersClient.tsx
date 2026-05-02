"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bell, AlertTriangle, Calendar, FileText, HeartPulse, Briefcase, Gavel } from "lucide-react";
import type { Reminder, ReminderSeverity, ReminderCategory } from "@/lib/reminders-engine";

const SEVERITY_STYLES: Record<ReminderSeverity, { dot: string; tone: string; label: string }> = {
  overdue: { dot: "bg-rose-500", tone: "border-rose-200 bg-rose-50/40", label: "En retard" },
  danger:  { dot: "bg-amber-500", tone: "border-amber-200 bg-amber-50/40", label: "Urgent" },
  warn:    { dot: "bg-sky-500",   tone: "border-sky-200 bg-sky-50/40",     label: "À venir" },
  info:    { dot: "bg-slate-300", tone: "border-slate-200 bg-white",       label: "Info" },
};

const CATEGORY_ICONS: Record<ReminderCategory, React.ComponentType<{ className?: string }>> = {
  declaration: FileText,
  contract: Briefcase,
  medical: HeartPulse,
  discipline: Gavel,
  cdd: Briefcase,
  accident: AlertTriangle,
  probation: Briefcase,
  leave_balance: Calendar,
};

const CATEGORY_LABELS: Record<ReminderCategory, string> = {
  declaration: "Déclarations",
  contract: "Contrats",
  medical: "Médical",
  discipline: "Disciplinaire",
  cdd: "CDD",
  accident: "Accidents",
  probation: "Période d'essai",
  leave_balance: "Soldes congés",
};

interface Props {
  initial: Reminder[];
}

export function RemindersClient({ initial }: Props) {
  const [filter, setFilter] = useState<"all" | ReminderSeverity | ReminderCategory>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return initial;
    if (filter === "overdue" || filter === "danger" || filter === "warn" || filter === "info") {
      return initial.filter((r) => r.severity === filter);
    }
    return initial.filter((r) => r.category === filter);
  }, [initial, filter]);

  const counts = useMemo(() => {
    return {
      total: initial.length,
      overdue: initial.filter((r) => r.severity === "overdue").length,
      danger: initial.filter((r) => r.severity === "danger").length,
      warn: initial.filter((r) => r.severity === "warn").length,
    };
  }, [initial]);

  const grouped = useMemo(() => {
    const map = new Map<string, Reminder[]>();
    for (const r of filtered) {
      let bucket = "Plus tard";
      if (r.severity === "overdue") bucket = "En retard";
      else if (r.days_remaining !== null && r.days_remaining <= 0) bucket = "Aujourd'hui";
      else if (r.days_remaining !== null && r.days_remaining <= 7) bucket = "Cette semaine";
      else if (r.days_remaining !== null && r.days_remaining <= 30) bucket = "Ce mois";
      const arr = map.get(bucket) ?? [];
      arr.push(r);
      map.set(bucket, arr);
    }
    const order = ["En retard", "Aujourd'hui", "Cette semaine", "Ce mois", "Plus tard"];
    return order.filter((o) => map.has(o)).map((o) => ({ label: o, items: map.get(o)! }));
  }, [filtered]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <header className="pb-4 border-b border-slate-200 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-slate-700" />
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">
            Centre de notifications
          </p>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
          Rappels &amp; Échéances
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-snug max-w-3xl">
          Toutes les obligations qui requièrent votre attention, consolidées depuis l'ensemble des modules
          (déclarations, contrats, médical, disciplinaire, accidents, périodes d'essai).
        </p>
      </header>

      {/* KPI */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <Kpi label="Total" value={counts.total} accent="neutral" filter="all" current={filter} setFilter={setFilter} />
        <Kpi label="En retard" value={counts.overdue} accent="overdue" filter="overdue" current={filter} setFilter={setFilter} />
        <Kpi label="Urgent" value={counts.danger} accent="danger" filter="danger" current={filter} setFilter={setFilter} />
        <Kpi label="À venir 7j" value={counts.warn} accent="warn" filter="warn" current={filter} setFilter={setFilter} />
      </section>

      {/* Filtres catégorie */}
      <nav className="flex flex-wrap gap-1.5">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>Toutes</FilterChip>
        {(Object.keys(CATEGORY_LABELS) as ReminderCategory[]).map((c) => {
          const count = initial.filter((r) => r.category === c).length;
          if (count === 0) return null;
          return (
            <FilterChip
              key={c}
              active={filter === c}
              onClick={() => setFilter(c)}
            >
              {CATEGORY_LABELS[c]} <span className="ml-1 text-slate-400 tabular-nums">{count}</span>
            </FilterChip>
          );
        })}
      </nav>

      {/* Liste groupée */}
      {grouped.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <Bell className="h-7 w-7 text-slate-300 mx-auto mb-2.5" />
          <p className="text-sm font-medium text-slate-700">Tout est à jour</p>
          <p className="text-xs text-slate-500 mt-1">Aucun rappel pour le filtre sélectionné.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.label}>
              <h2 className="text-xs uppercase tracking-[0.12em] text-slate-500 font-medium mb-2.5">
                {group.label} <span className="text-slate-400">· {group.items.length}</span>
              </h2>
              <ul className="space-y-2">
                {group.items.map((r) => (
                  <ReminderItem key={r.id} r={r} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Kpi({
  label, value, accent, filter, current, setFilter,
}: {
  label: string; value: number;
  accent: "neutral" | "overdue" | "danger" | "warn";
  filter: "all" | ReminderSeverity;
  current: string; setFilter: (f: typeof filter) => void;
}) {
  const bar = {
    neutral: "bg-slate-300",
    overdue: "bg-rose-500",
    danger: "bg-amber-500",
    warn: "bg-sky-500",
  }[accent];
  const active = current === filter;
  return (
    <button
      onClick={() => setFilter(filter)}
      className={[
        "relative text-left rounded-lg border bg-white p-3.5 sm:p-5 transition-colors",
        active ? "border-slate-400 ring-1 ring-slate-300" : "border-slate-200 hover:border-slate-300",
      ].join(" ")}
    >
      <div className={`absolute left-0 top-3.5 bottom-3.5 sm:top-5 sm:bottom-5 w-0.5 rounded-r ${bar}`} />
      <p className="text-[11px] sm:text-xs text-slate-500 font-medium">{label}</p>
      <p className="mt-1 sm:mt-1.5 text-lg sm:text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
    </button>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        "h-7 px-3 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
        active ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ReminderItem({ r }: { r: Reminder }) {
  const sev = SEVERITY_STYLES[r.severity];
  const Icon = CATEGORY_ICONS[r.category];
  const daysLabel = r.days_remaining === null
    ? ""
    : r.days_remaining < 0
    ? `${Math.abs(r.days_remaining)} j de retard`
    : r.days_remaining === 0
    ? "Aujourd'hui"
    : `dans ${r.days_remaining} j`;

  return (
    <li>
      <Link
        href={r.href ?? "#"}
        className={[
          "flex items-start gap-3 rounded-lg border p-3 sm:p-4 hover:border-slate-300 transition-colors",
          sev.tone,
        ].join(" ")}
      >
        <span className={`mt-1 inline-block h-2 w-2 rounded-full shrink-0 ${sev.dot}`} />
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white border border-slate-100 text-slate-600 shrink-0">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-900 truncate">{r.title}</p>
            <span className="text-[11px] tabular-nums text-slate-500 shrink-0">{daysLabel}</span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5 leading-snug">{r.description}</p>
          <div className="flex items-center gap-2 mt-1.5 text-[10px] uppercase tracking-wider text-slate-400">
            <span>{CATEGORY_LABELS[r.category]}</span>
            <span>·</span>
            <span>{sev.label}</span>
          </div>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-1.5" />
      </Link>
    </li>
  );
}
