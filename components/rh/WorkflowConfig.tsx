"use client";

import { useState, useCallback } from "react";
import { Plus, Trash, ArrowUp, ArrowDown, FloppyDisk, CheckCircle, WarningCircle } from "@phosphor-icons/react";

type NiveauRole = "manager" | "responsable_rh" | "admin" | "directeur";
type DelaiOption = 24 | 48 | 72;

type Niveau = {
  id: string;
  ordre: number;
  role: NiveauRole;
  delai_heures: DelaiOption;
};

type WorkflowConfigProps = {
  module: "conges" | "documents" | "recrutement";
  moduleLabel: string;
  initialNiveaux?: Niveau[];
  initialEscaladeAuto?: boolean;
};

const ROLE_LABELS: Record<NiveauRole, string> = {
  manager: "Manager direct",
  responsable_rh: "Responsable RH",
  admin: "Administrateur",
  directeur: "Directeur",
};

const DELAI_OPTIONS: DelaiOption[] = [24, 48, 72];

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function WorkflowConfig({
  module,
  moduleLabel,
  initialNiveaux = [],
  initialEscaladeAuto = true,
}: WorkflowConfigProps) {
  const [niveaux, setNiveaux] = useState<Niveau[]>(
    initialNiveaux.length > 0
      ? initialNiveaux
      : [{ id: generateId(), ordre: 1, role: "manager", delai_heures: 48 }]
  );
  const [escaladeAuto, setEscaladeAuto] = useState(initialEscaladeAuto);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    setNiveaux((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((n, i) => ({ ...n, ordre: i + 1 }));
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setNiveaux((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((n, i) => ({ ...n, ordre: i + 1 }));
    });
  }, []);

  const addNiveau = useCallback(() => {
    if (niveaux.length >= 3) return;
    setNiveaux((prev) => [
      ...prev,
      { id: generateId(), ordre: prev.length + 1, role: "responsable_rh", delai_heures: 48 },
    ]);
  }, [niveaux.length]);

  const removeNiveau = useCallback((id: string) => {
    setNiveaux((prev) => prev.filter((n) => n.id !== id).map((n, i) => ({ ...n, ordre: i + 1 })));
  }, []);

  const updateNiveau = useCallback(
    (id: string, field: keyof Pick<Niveau, "role" | "delai_heures">, value: string | number) => {
      setNiveaux((prev) => prev.map((n) => (n.id === id ? { ...n, [field]: value } : n)));
    },
    []
  );

  const handleSave = useCallback(async () => {
    setStatus("saving");
    try {
      const res = await fetch("/api/parametres/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module,
          niveaux: niveaux.map(({ ordre, role, delai_heures }) => ({ ordre, role, delai_heures })),
          escalade_auto: escaladeAuto,
        }),
      });
      if (!res.ok) throw new Error("Erreur sauvegarde");
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [module, niveaux, escaladeAuto]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{moduleLabel}</h3>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          {niveaux.length} niveau{niveaux.length > 1 ? "x" : ""}
        </span>
      </div>

      <div className="space-y-2">
        {niveaux.map((niveau, index) => (
          <div
            key={niveau.id}
            className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
          >
            {/* Ordre */}
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors"
              >
                <ArrowUp className="h-3 w-3" weight="bold" />
              </button>
              <button
                onClick={() => moveDown(index)}
                disabled={index === niveaux.length - 1}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors"
              >
                <ArrowDown className="h-3 w-3" weight="bold" />
              </button>
            </div>

            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ee7f03]/15 dark:bg-[#b35c00]/40 text-[10px] font-bold text-[#ee7f03] dark:text-[#f6c68a]">
              {index + 1}
            </span>

            <select
              value={niveau.role}
              onChange={(e) => updateNiveau(niveau.id, "role", e.target.value as NiveauRole)}
              className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2.5 py-1 text-[12.5px] text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#f8d3a3]"
            >
              {(Object.keys(ROLE_LABELS) as NiveauRole[]).map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>

            <select
              value={niveau.delai_heures}
              onChange={(e) => updateNiveau(niveau.id, "delai_heures", Number(e.target.value) as DelaiOption)}
              className="w-28 shrink-0 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2.5 py-1 text-[12.5px] text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#f8d3a3]"
            >
              {DELAI_OPTIONS.map((h) => (
                <option key={h} value={h}>{h}h de délai</option>
              ))}
            </select>

            {niveaux.length > 1 && (
              <button
                onClick={() => removeNiveau(niveau.id)}
                className="shrink-0 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash weight="bold" className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {niveaux.length < 3 && (
        <button
          onClick={addNiveau}
          className="flex items-center gap-1.5 text-[12.5px] text-[#ee7f03] dark:text-[#f6c68a] hover:text-[#ee7f03] font-medium transition-colors"
        >
          <Plus weight="bold" className="h-3.5 w-3.5" />
          Ajouter un niveau
        </button>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
        <div>
          <p className="text-[12.5px] font-medium text-slate-700 dark:text-slate-300">Escalade automatique</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Passe au niveau suivant si le délai expire</p>
        </div>
        <button
          role="switch"
          aria-checked={escaladeAuto}
          onClick={() => setEscaladeAuto((v) => !v)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#f8d3a3] ${
            escaladeAuto ? "bg-[#ee7f03]" : "bg-slate-200 dark:bg-slate-600"
          }`}
        >
          <span
            aria-hidden
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              escaladeAuto ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <button
        onClick={handleSave}
        disabled={status === "saving"}
        className={`w-full flex items-center justify-center gap-2 rounded-xl py-2 text-[13px] font-semibold transition-all ${
          status === "saved"
            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
            : status === "error"
            ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
            : "bg-[#ee7f03] hover:bg-[#ee7f03] text-white disabled:opacity-60"
        }`}
      >
        {status === "saving" && (
          <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
        )}
        {status === "saved" && <CheckCircle weight="fill" className="h-4 w-4" />}
        {status === "error" && <WarningCircle weight="fill" className="h-4 w-4" />}
        {status === "idle" && <FloppyDisk weight="bold" className="h-4 w-4" />}
        {status === "saving" ? "Enregistrement…" : status === "saved" ? "Enregistré" : status === "error" ? "Erreur — réessayer" : "Sauvegarder"}
      </button>
    </div>
  );
}
