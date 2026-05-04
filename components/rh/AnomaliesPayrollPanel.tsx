"use client";

import { useState, useMemo } from "react";
import type { AnomaliePayroll } from "@/app/api/analytics/anomalies-paie/route";

const SMIG_CI = 75_000;

const TYPE_LABELS: Record<AnomaliePayroll["type"], string> = {
  variation: "Variation brute > 20%",
  smig: `Salaire < SMIG (${SMIG_CI.toLocaleString("fr-CI")} FCFA)`,
  charges: "Charges patronales incohérentes",
  doublon: "Bulletin en doublon",
  inactif: "Employé inactif",
};

const SEVERITE_CONFIG = {
  erreur: {
    badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    dot: "bg-rose-500",
    label: "Erreur",
  },
  warning: {
    badge: "bg-amber-400/15 text-amber-300 border-amber-400/30",
    dot: "bg-amber-400",
    label: "Avertissement",
  },
};

function formatFcfa(val: number | null): string {
  if (val === null) return "—";
  return val.toLocaleString("fr-CI") + " FCFA";
}

interface Props {
  anomalies: AnomaliePayroll[];
}

export function AnomaliesPayrollPanel({ anomalies }: Props) {
  const [ignored, setIgnored] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem("anomalies-ignorees");
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  const ignorer = (id: string) => {
    setIgnored((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem("anomalies-ignorees", JSON.stringify(Array.from(next)));
      } catch {
        // storage non disponible
      }
      return next;
    });
  };

  const restaurer = (id: string) => {
    setIgnored((prev) => {
      const next = new Set(prev);
      next.delete(id);
      try {
        localStorage.setItem("anomalies-ignorees", JSON.stringify(Array.from(next)));
      } catch {
        // storage non disponible
      }
      return next;
    });
  };

  const visible = useMemo(
    () => anomalies.filter((a) => !ignored.has(a.id)),
    [anomalies, ignored]
  );
  const ignorees = useMemo(
    () => anomalies.filter((a) => ignored.has(a.id)),
    [anomalies, ignored]
  );

  const erreurs = visible.filter((a) => a.severite === "erreur");
  const warnings = visible.filter((a) => a.severite === "warning");

  const exportCsv = () => {
    const rows = [
      ["ID", "Employé", "Mois", "Type", "Description", "Valeur attendue", "Valeur observée", "Sévérité"],
      ...anomalies.map((a) => [
        a.id,
        a.employee_name,
        a.mois,
        TYPE_LABELS[a.type],
        `"${a.description.replace(/"/g, '""')}"`,
        a.valeur_attendue?.toString() ?? "",
        a.valeur_observee?.toString() ?? "",
        a.severite,
      ]),
    ];
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anomalies-paie-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {erreurs.length} erreur{erreurs.length > 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {warnings.length} avert.
            </span>
          </div>
          {ignorees.length > 0 && (
            <span className="text-xs text-slate-500">{ignorees.length} ignorée(s)</span>
          )}
        </div>
        <button
          onClick={exportCsv}
          className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-medium transition-colors"
        >
          Exporter CSV
        </button>
      </div>

      {visible.length === 0 && (
        <div className="rounded-xl border border-white/5 bg-white/3 p-10 text-center">
          <p className="text-sm text-slate-400">
            {anomalies.length === 0
              ? "Aucune anomalie détectée sur les bulletins analysés."
              : "Toutes les anomalies ont été marquées comme revues."}
          </p>
        </div>
      )}

      {/* Erreurs */}
      {erreurs.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400 mb-2">
            Erreurs ({erreurs.length})
          </p>
          <AnomalieList items={erreurs} onIgnorer={ignorer} />
        </div>
      )}

      {/* Avertissements */}
      {warnings.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-2">
            Avertissements ({warnings.length})
          </p>
          <AnomalieList items={warnings} onIgnorer={ignorer} />
        </div>
      )}

      {/* Ignorées */}
      {ignorees.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-300 select-none">
            {ignorees.length} anomalie{ignorees.length > 1 ? "s" : ""} ignorée{ignorees.length > 1 ? "s" : ""} — cliquer pour afficher
          </summary>
          <div className="mt-2">
            <AnomalieList items={ignorees} onRestaurer={restaurer} />
          </div>
        </details>
      )}
    </div>
  );
}

function AnomalieList({
  items,
  onIgnorer,
  onRestaurer,
}: {
  items: AnomaliePayroll[];
  onIgnorer?: (id: string) => void;
  onRestaurer?: (id: string) => void;
}) {
  return (
    <ul className="space-y-2">
      {items.map((anomalie) => {
        const cfg = SEVERITE_CONFIG[anomalie.severite];
        return (
          <li
            key={anomalie.id}
            className="rounded-xl border border-white/8 bg-white/3 p-4 flex items-start gap-3"
          >
            <span
              className={`mt-1 shrink-0 w-2 h-2 rounded-full ${cfg.dot}`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${cfg.badge}`}>
                  {cfg.label}
                </span>
                <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                  {TYPE_LABELS[anomalie.type]}
                </span>
                <span className="text-xs font-medium text-slate-200">
                  {anomalie.employee_name}
                </span>
                <span className="text-xs text-slate-500">
                  · {anomalie.mois}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {anomalie.description}
              </p>
              {(anomalie.valeur_attendue !== null ||
                anomalie.valeur_observee !== null) && (
                <div className="flex gap-4 mt-1.5 text-[11px]">
                  {anomalie.valeur_attendue !== null && (
                    <span className="text-slate-500">
                      Attendu :{" "}
                      <span className="text-slate-300 font-medium">
                        {formatFcfa(anomalie.valeur_attendue)}
                      </span>
                    </span>
                  )}
                  {anomalie.valeur_observee !== null && (
                    <span className="text-slate-500">
                      Observé :{" "}
                      <span className="text-slate-300 font-medium">
                        {formatFcfa(anomalie.valeur_observee)}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>
            {onIgnorer && (
              <button
                onClick={() => onIgnorer(anomalie.id)}
                className="shrink-0 text-[11px] text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded hover:bg-white/5"
                title="Marquer comme revue"
              >
                Ignorer
              </button>
            )}
            {onRestaurer && (
              <button
                onClick={() => onRestaurer(anomalie.id)}
                className="shrink-0 text-[11px] text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded hover:bg-white/5"
              >
                Restaurer
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
