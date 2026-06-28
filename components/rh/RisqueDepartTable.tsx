"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import {
  CaretDown,
  CaretRight,
  Info,
  Lightbulb,
  ShieldCheck,
  ArrowRight,
} from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/ui/page-shell";
import {
  RISK_LEVEL_META,
  RISK_FACTORS_ORDERED,
  type RiskLevel,
  type RisqueDepartRow,
} from "@/lib/risque-depart";

type NiveauFilter = "tous" | RiskLevel;

function ScoreGauge({ score, niveau }: { score: number; niveau: RiskLevel }) {
  const meta = RISK_LEVEL_META[niveau];
  return (
    <div className="flex items-center gap-2.5 min-w-[140px]">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full transition-all ${meta.dot}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`w-9 text-right font-display text-sm font-bold tabular-nums ${meta.text}`}>{score}</span>
    </div>
  );
}

function NiveauBadge({ niveau }: { niveau: RiskLevel }) {
  const meta = RISK_LEVEL_META[niveau];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${meta.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

// Carte « Méthodologie » : documente le barème et les seuils de niveau.
function MethodologyCard() {
  const [open, setOpen] = useState(false);
  const maxTotal = RISK_FACTORS_ORDERED.reduce((s, f) => s + f.weight, 0);

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d9488]/10 text-[#0f766e] dark:text-[#2dd4bf]">
            <Info weight="duotone" className="h-4 w-4" />
          </span>
          <span>
            <span className="block font-display text-sm font-bold text-slate-900 dark:text-white">Méthodologie du score</span>
            <span className="block text-[11px] text-slate-400">7 signaux RH pondérés · score plafonné à 100</span>
          </span>
        </span>
        {open ? <CaretDown className="h-4 w-4 text-slate-400" /> : <CaretRight className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <div className="space-y-5 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          {/* Seuils de niveau */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Niveaux de risque</p>
            <div className="flex flex-wrap gap-2">
              {(["critique", "eleve", "modere", "faible"] as const).map((lvl) => {
                const m = RISK_LEVEL_META[lvl];
                const range =
                  lvl === "critique" ? "≥ 70" : lvl === "eleve" ? "45 – 69" : lvl === "modere" ? "20 – 44" : "< 20";
                return (
                  <span key={lvl} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${m.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
                    {m.label} · {range}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Barème des facteurs */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Barème des facteurs (total max {maxTotal} pts, plafonné à 100)
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {RISK_FACTORS_ORDERED.map((f) => (
                <div key={f.key} className="flex items-start gap-3 rounded-xl border border-slate-200/70 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="mt-0.5 shrink-0 rounded-md bg-slate-900 px-1.5 py-0.5 font-display text-[11px] font-bold tabular-nums text-white dark:bg-slate-700">
                    +{f.weight}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                      {f.label}
                      <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">{f.category}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Détail par employé : facteurs déclenchés + recommandations RH.
function EmployeeDetail({ row }: { row: RisqueDepartRow }) {
  if (row.facteurs.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
        <ShieldCheck weight="duotone" className="h-5 w-5 shrink-0" />
        Aucun signal de risque détecté — collaborateur stable.
      </div>
    );
  }
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {row.facteurs.map((f) => (
        <div key={f.key} className="rounded-xl border border-slate-200/70 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">{f.label}</p>
            <span className="shrink-0 rounded-md bg-rose-50 px-1.5 py-0.5 font-display text-[11px] font-bold tabular-nums text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              +{f.points}
            </span>
          </div>
          {f.detail && <p className="mt-0.5 text-[11px] font-medium text-slate-500">{f.detail}</p>}
          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            <Lightbulb weight="duotone" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            {f.recommendation}
          </p>
        </div>
      ))}
    </div>
  );
}

export function RisqueDepartTable({ data }: { data: RisqueDepartRow[] }) {
  const [filter, setFilter] = useState<NiveauFilter>("tous");
  const [expanded, setExpanded] = useState<string | null>(null);

  const counts = {
    critique: data.filter((e) => e.niveau === "critique").length,
    eleve: data.filter((e) => e.niveau === "eleve").length,
    modere: data.filter((e) => e.niveau === "modere").length,
    faible: data.filter((e) => e.niveau === "faible").length,
  };
  const filtered = filter === "tous" ? data : data.filter((e) => e.niveau === filter);
  const top5 = data.filter((e) => e.score > 0).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Résumé par niveau (cliquable = filtre) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Critique" value={counts.critique} sub="≥ 70 pts" tone="danger" onClick={() => setFilter(filter === "critique" ? "tous" : "critique")} />
        <StatCard label="Élevé" value={counts.eleve} sub="45 – 69 pts" tone="warning" onClick={() => setFilter(filter === "eleve" ? "tous" : "eleve")} />
        <StatCard label="Modéré" value={counts.modere} sub="20 – 44 pts" tone="warning" onClick={() => setFilter(filter === "modere" ? "tous" : "modere")} />
        <StatCard label="Faible" value={counts.faible} sub="< 20 pts" tone="success" onClick={() => setFilter(filter === "faible" ? "tous" : "faible")} />
      </div>

      {/* Top 5 à surveiller (seulement si score > 0) */}
      {top5.length > 0 && (
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50/40 p-4 dark:border-rose-900/40 dark:bg-rose-950/10">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-rose-600 dark:text-rose-400">
            Top {top5.length} — à surveiller en priorité
          </p>
          <div className="flex flex-wrap gap-2">
            {top5.map((emp) => (
              <button
                key={emp.employee_id}
                onClick={() => { setFilter("tous"); setExpanded(emp.employee_id); }}
                className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white px-2.5 py-1.5 text-left transition-colors hover:border-[#0d9488]/40 dark:border-slate-800 dark:bg-slate-900"
              >
                <Avatar src={emp.photo_url} name={emp.full_name} size={22} rounded="full" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{emp.full_name}</span>
                <span className={`text-xs font-bold tabular-nums ${RISK_LEVEL_META[emp.niveau].text}`}>{emp.score}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Méthodologie documentée */}
      <MethodologyCard />

      {/* Filtre rapide */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Filtrer :</span>
        {(["tous", "critique", "eleve", "modere", "faible"] as const).map((n) => (
          <button
            key={n}
            onClick={() => setFilter(n)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filter === n
                ? "border-[#0d9488] bg-[#0d9488] text-white"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
            }`}
          >
            {n === "tous" ? `Tous (${data.length})` : `${RISK_LEVEL_META[n].label} (${counts[n]})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/70 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Collaborateur</th>
                <th className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 md:table-cell">Département</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Score</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Niveau</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Détail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    Aucun collaborateur dans ce niveau de risque.
                  </td>
                </tr>
              )}
              {filtered.map((emp) => {
                const isOpen = expanded === emp.employee_id;
                return (
                  <Fragment key={emp.employee_id}>
                    <tr
                      onClick={() => setExpanded(isOpen ? null : emp.employee_id)}
                      className="cursor-pointer transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={emp.photo_url} name={emp.full_name} size={36} rounded="full" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{emp.full_name}</p>
                            <p className="truncate text-xs text-slate-400">{emp.poste}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-slate-500 md:table-cell">{emp.departement}</td>
                      <td className="px-4 py-3"><ScoreGauge score={emp.score} niveau={emp.niveau} /></td>
                      <td className="px-4 py-3"><NiveauBadge niveau={emp.niveau} /></td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0f766e] dark:text-[#2dd4bf]">
                          {emp.facteurs.length} facteur{emp.facteurs.length > 1 ? "s" : ""}
                          <CaretDown weight="bold" className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </span>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                        <td colSpan={5} className="px-4 py-4">
                          <div className="space-y-3">
                            <EmployeeDetail row={emp} />
                            <div className="flex justify-end">
                              <Link
                                href={`/employes/${emp.employee_id}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-[#0d9488]/40 hover:text-[#0f766e] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                              >
                                Ouvrir la fiche <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
