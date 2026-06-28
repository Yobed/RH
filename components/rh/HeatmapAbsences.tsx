"use client";

import { useMemo, useState } from "react";

interface Conge {
  date_debut: string;
  date_fin: string;
  type: string;
  statut: string;
  employees: { full_name: string; departement: string } | null;
}

interface Employee {
  id: string;
  full_name: string;
  departement: string | null;
}

interface Props {
  conges: Conge[];
  employees: Employee[];
  annee: number;
}

type AbsenceType = "conge_annuel" | "maladie" | "maternite_paternite" | "autre";

interface DayAbsence {
  type: AbsenceType;
  label: string;
}

const COLORS: Record<AbsenceType, { cell: string; legend: string }> = {
  conge_annuel:       { cell: "bg-teal-400 dark:bg-teal-500",   legend: "Congé annuel" },
  maladie:            { cell: "bg-orange-400 dark:bg-orange-500", legend: "Maladie" },
  maternite_paternite:{ cell: "bg-pink-400 dark:bg-pink-500",   legend: "Maternité / Paternité" },
  autre:              { cell: "bg-slate-400 dark:bg-slate-500", legend: "Autre" },
};

const MONTHS_FR = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc",
];

function classifyType(type: string): AbsenceType {
  const t = type.toLowerCase();
  if (t.includes("annuel") || t.includes("payé") || t.includes("paye")) return "conge_annuel";
  if (t.includes("malad") || t.includes("maladie")) return "maladie";
  if (t.includes("matern") || t.includes("patern")) return "maternite_paternite";
  return "autre";
}

/** Génère tous les jours de l'année sous forme YYYY-MM-DD */
function buildYearDays(annee: number): string[] {
  const days: string[] = [];
  const start = new Date(annee, 0, 1);
  const end = new Date(annee, 11, 31);
  const cur = new Date(start);
  while (cur <= end) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

/** Retourne le numéro de mois (0-11) pour chaque jour */
function buildMonthHeaders(days: string[]): { label: string; start: number; count: number }[] {
  const map: Record<number, number> = {};
  days.forEach((d, i) => {
    const m = new Date(d).getMonth();
    if (!(m in map)) map[m] = i;
  });
  return Object.entries(map).map(([mStr, start], idx, arr) => {
    const m = Number(mStr);
    const next = idx + 1 < arr.length ? arr[idx + 1][1] : days.length;
    return { label: MONTHS_FR[m], start, count: next - start };
  });
}

/** Construit un index: employeeName -> Set<YYYY-MM-DD> avec type */
function buildAbsenceIndex(
  conges: Conge[]
): Map<string, Map<string, DayAbsence>> {
  const index = new Map<string, Map<string, DayAbsence>>();

  for (const conge of conges) {
    const name = conge.employees?.full_name;
    if (!name) continue;

    const absType = classifyType(conge.type);
    const debut = new Date(conge.date_debut);
    const fin = new Date(conge.date_fin);
    const cur = new Date(debut);

    while (cur <= fin) {
      const dayKey = cur.toISOString().slice(0, 10);
      if (!index.has(name)) index.set(name, new Map());
      index.get(name)!.set(dayKey, { type: absType, label: conge.type });
      cur.setDate(cur.getDate() + 1);
    }
  }

  return index;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  name: string;
  day: string;
  label: string;
}

export function HeatmapAbsences({ conges, employees, annee }: Props) {
  const [departement, setDepartement] = useState<string>("all");
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, name: "", day: "", label: "",
  });

  const yearDays = useMemo(() => buildYearDays(annee), [annee]);
  const monthHeaders = useMemo(() => buildMonthHeaders(yearDays), [yearDays]);
  const absenceIndex = useMemo(() => buildAbsenceIndex(conges), [conges]);

  const departements = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => { if (e.departement) set.add(e.departement); });
    return Array.from(set).sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const list = departement === "all"
      ? employees
      : employees.filter((e) => e.departement === departement);
    return list.slice(0, 30);
  }, [employees, departement]);

  function handleCellMouseEnter(
    e: React.MouseEvent<HTMLDivElement>,
    name: string,
    day: string,
    absence: DayAbsence | undefined
  ) {
    if (!absence) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY - 40,
      name,
      day,
      label: absence.label,
    });
  }

  function handleCellMouseLeave() {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }

  const CELL_W = 3; // px par jour
  const CELL_H = 18; // px par employé
  const NAME_W = 160; // px pour la colonne nom

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Département :
        </label>
        <select
          value={departement}
          onChange={(e) => setDepartement(e.target.value)}
          className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">Tous les départements</option>
          {departements.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {filteredEmployees.length >= 30 && (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            Affichage limité à 30 employés
          </span>
        )}
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(COLORS) as [AbsenceType, { cell: string; legend: string }][]).map(
          ([type, { cell, legend }]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className={`h-3 w-3 rounded-sm ${cell}`} />
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{legend}</span>
            </div>
          )
        )}
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600" />
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Présent</span>
        </div>
      </div>

      {/* Grille scrollable */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: NAME_W + yearDays.length * CELL_W + 16 }}>
            {/* En-têtes mois */}
            <div
              className="flex sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800"
              style={{ paddingLeft: NAME_W }}
            >
              {monthHeaders.map(({ label, count }) => (
                <div
                  key={label}
                  className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 pt-2 pb-1 shrink-0 border-r border-slate-100 dark:border-slate-800"
                  style={{ width: count * CELL_W }}
                >
                  <span className="ml-1">{label}</span>
                </div>
              ))}
            </div>

            {/* Lignes employés */}
            {filteredEmployees.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                Aucun employé actif.
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const empAbsences = absenceIndex.get(emp.full_name);
                return (
                  <div
                    key={emp.id}
                    className="flex items-center border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    style={{ height: CELL_H }}
                  >
                    {/* Nom */}
                    <div
                      className="shrink-0 flex items-center px-3"
                      style={{ width: NAME_W }}
                    >
                      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">
                        {emp.full_name}
                      </span>
                    </div>

                    {/* Cellules jours */}
                    {yearDays.map((day) => {
                      const absence = empAbsences?.get(day);
                      const colorClass = absence
                        ? COLORS[absence.type].cell
                        : "bg-slate-100 dark:bg-slate-700/40";

                      return (
                        <div
                          key={day}
                          className={`shrink-0 ${colorClass} border-r border-white dark:border-slate-900 cursor-default`}
                          style={{ width: CELL_W, height: CELL_H - 2 }}
                          onMouseEnter={(e) =>
                            handleCellMouseEnter(e, emp.full_name, day, absence)
                          }
                          onMouseLeave={handleCellMouseLeave}
                        />
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed z-50 pointer-events-none rounded-lg bg-slate-900 dark:bg-slate-700 text-white px-3 py-2 text-xs shadow-xl"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="font-semibold">{tooltip.name}</p>
          <p className="text-slate-300 dark:text-slate-200">
            {new Date(tooltip.day).toLocaleDateString("fr-CI", {
              day: "numeric",
              month: "long",
            })}
          </p>
          <p className="text-teal-300 dark:text-teal-200 mt-0.5">{tooltip.label}</p>
        </div>
      )}
    </div>
  );
}
