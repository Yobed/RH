"use client";

import { useState } from "react";
import type { RisqueDepart } from "@/app/api/analytics/risque-depart/route";

type NiveauFilter = "tous" | RisqueDepart["niveau"];

const NIVEAU_CONFIG: Record<
  RisqueDepart["niveau"],
  { label: string; bar: string; badge: string; text: string }
> = {
  faible: {
    label: "Faible",
    bar: "bg-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    text: "text-emerald-400",
  },
  modere: {
    label: "Modéré",
    bar: "bg-amber-400",
    badge: "bg-amber-400/15 text-amber-300 border-amber-400/30",
    text: "text-amber-300",
  },
  eleve: {
    label: "Élevé",
    bar: "bg-orange-500",
    badge: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    text: "text-orange-400",
  },
  critique: {
    label: "Critique",
    bar: "bg-rose-500",
    badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    text: "text-rose-400",
  },
};

function ScoreBar({ score, niveau }: { score: number; niveau: RisqueDepart["niveau"] }) {
  const cfg = NIVEAU_CONFIG[niveau];
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${cfg.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums w-8 text-right ${cfg.text}`}>
        {score}
      </span>
    </div>
  );
}

function NiveauBadge({ niveau }: { niveau: RisqueDepart["niveau"] }) {
  const cfg = NIVEAU_CONFIG[niveau];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.badge}`}
    >
      {cfg.label}
    </span>
  );
}

function FacteursTooltip({ facteurs }: { facteurs: string[] }) {
  const [open, setOpen] = useState(false);

  if (facteurs.length === 0) {
    return <span className="text-xs text-slate-500">Aucun</span>;
  }

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        aria-label={`${facteurs.length} facteur(s) déclenchant(s)`}
      >
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/10 text-[9px] font-bold">
          {facteurs.length}
        </span>
        <span>facteur{facteurs.length > 1 ? "s" : ""}</span>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 z-50 w-56 rounded-lg border border-white/10 bg-slate-800 shadow-xl p-2 text-[11px] text-slate-300 space-y-1">
          {facteurs.map((f, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="mt-0.5 shrink-0 w-1 h-1 rounded-full bg-rose-400" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  data: RisqueDepart[];
}

export function RisqueDepartTable({ data }: Props) {
  const [filter, setFilter] = useState<NiveauFilter>("tous");

  const filtered =
    filter === "tous" ? data : data.filter((e) => e.niveau === filter);

  const top5 = data.slice(0, 5);
  const nbElevesCritiques = data.filter(
    (e) => e.niveau === "eleve" || e.niveau === "critique"
  ).length;

  const counts = {
    critique: data.filter((e) => e.niveau === "critique").length,
    eleve: data.filter((e) => e.niveau === "eleve").length,
    modere: data.filter((e) => e.niveau === "modere").length,
    faible: data.filter((e) => e.niveau === "faible").length,
  };

  return (
    <div className="space-y-6">
      {/* KPI résumé */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["critique", "eleve", "modere", "faible"] as const).map((niveau) => {
          const cfg = NIVEAU_CONFIG[niveau];
          return (
            <button
              key={niveau}
              onClick={() => setFilter(filter === niveau ? "tous" : niveau)}
              className={`rounded-xl border p-4 text-left transition-all ${
                filter === niveau
                  ? "border-white/20 bg-white/10"
                  : "border-white/5 bg-white/5 hover:bg-white/8"
              }`}
            >
              <p className="text-xs text-slate-400 mb-1">{cfg.label}</p>
              <p className={`text-2xl font-bold tabular-nums ${cfg.text}`}>
                {counts[niveau]}
              </p>
            </button>
          );
        })}
      </div>

      {/* Top 5 à surveiller */}
      {top5.length > 0 && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
          <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-3">
            Top 5 — À surveiller en priorité
          </p>
          <div className="flex flex-wrap gap-2">
            {top5.map((emp) => (
              <div
                key={emp.employee_id}
                className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${NIVEAU_CONFIG[emp.niveau].bar}`}
                />
                <span className="text-xs text-slate-200 font-medium">
                  {emp.full_name}
                </span>
                <span className="text-xs text-slate-400 tabular-nums">
                  {emp.score}/100
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtre rapide */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Filtrer :</span>
        {(["tous", "critique", "eleve", "modere", "faible"] as const).map((n) => (
          <button
            key={n}
            onClick={() => setFilter(n)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filter === n
                ? "bg-white/15 border-white/20 text-slate-100"
                : "bg-transparent border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20"
            }`}
          >
            {n === "tous"
              ? `Tous (${data.length})`
              : `${NIVEAU_CONFIG[n].label} (${counts[n]})`}
          </button>
        ))}
        {nbElevesCritiques > 0 && (
          <span className="ml-auto text-xs text-rose-400 font-medium">
            {nbElevesCritiques} employé{nbElevesCritiques > 1 ? "s" : ""} à risque élevé/critique
          </span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Employé
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">
                  Département
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Niveau
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                  Facteurs
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Aucun employé dans ce niveau de risque.
                  </td>
                </tr>
              )}
              {filtered.map((emp) => (
                <tr
                  key={emp.employee_id}
                  className="hover:bg-white/3 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-100">
                        {emp.full_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{emp.poste}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 hidden md:table-cell">
                    {emp.departement || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBar score={emp.score} niveau={emp.niveau} />
                  </td>
                  <td className="px-4 py-3">
                    <NiveauBadge niveau={emp.niveau} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <FacteursTooltip facteurs={emp.facteurs} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
