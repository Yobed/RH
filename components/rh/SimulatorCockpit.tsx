"use client";

import React, { useState, useMemo } from "react";
import {
  calculerBulletinComplet,
  calculerChargesPatronales,
  CHARGES_PATRONALES_TAUX,
  SMIG_MENSUEL,
} from "@/lib/paie-ci";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmpRow = {
  id: string;
  full_name: string;
  matricule: string | null;
  salaire_brut: number | null;
  type_contrat: string | null;
  date_embauche: string | null;
  departement?: string | null;
  sursalaire?: number | null;
  prime_transport?: number | null;
  prime_anciennete?: number | null;
  prime_exceptionnelle?: number | null;
  prime_salissure?: number | null;
  prime_depassement?: number | null;
  prime_fonction?: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fcfa = (n: number) =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(Math.round(n));

interface SimInputs {
  brut: number;
  primeTransport: number;
  sursalaire: number;
  primeAnciennete: number;
  primeExceptionnelle: number;
  primeSalissure: number;
  primeDepassement: number;
  primeFonction: number;
  autresRetenues: number;
  avances: number;
  nbJoursAbsence: number;
  tauxAtMp: number;
}

const DEFAULT: SimInputs = {
  brut: 250_000,
  primeTransport: 30_000,
  sursalaire: 0,
  primeAnciennete: 0,
  primeExceptionnelle: 0,
  primeSalissure: 0,
  primeDepassement: 0,
  primeFonction: 0,
  autresRetenues: 0,
  avances: 0,
  nbJoursAbsence: 0,
  tauxAtMp: CHARGES_PATRONALES_TAUX.at_mp,
};

function compute(i: SimInputs) {
  const res = calculerBulletinComplet({
    salaire_brut: i.brut,
    sursalaire: i.sursalaire,
    prime_anciennete: i.primeAnciennete,
    prime_exceptionnelle: i.primeExceptionnelle,
    prime_salissure: i.primeSalissure,
    prime_depassement: i.primeDepassement,
    prime_fonction: i.primeFonction,
    prime_transport: i.primeTransport,
    autres_retenues: i.autresRetenues,
    avances: i.avances,
    nb_jours_absence: i.nbJoursAbsence,
  });
  const charges = calculerChargesPatronales(res.total_imposable, i.tauxAtMp);
  return { ...res, charges, coutTotal: res.total_brut + charges.total };
}

function empToInputs(e: EmpRow): SimInputs {
  return {
    ...DEFAULT,
    brut: e.salaire_brut ?? SMIG_MENSUEL,
    sursalaire: e.sursalaire ?? 0,
    primeAnciennete: e.prime_anciennete ?? 0,
    primeExceptionnelle: e.prime_exceptionnelle ?? 0,
    primeSalissure: e.prime_salissure ?? 0,
    primeDepassement: e.prime_depassement ?? 0,
    primeFonction: e.prime_fonction ?? 0,
    primeTransport: e.prime_transport ?? 30_000,
  };
}

// ─── Petits composants ────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-colors";

function NumInput({
  label, value, onChange, hint, step = 1000,
}: { label: string; value: number; onChange: (v: number) => void; hint?: string; step?: number }) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <input
        type="number"
        min={0}
        step={step}
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className={inputCls}
      />
      {hint && <p className="text-[10px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

const KPI_CONFIG = {
  green:  { border: "border-emerald-200/60 dark:border-emerald-900/40", bg: "bg-emerald-50/50 dark:bg-emerald-950/20", label: "text-emerald-600 dark:text-emerald-400", value: "text-emerald-900 dark:text-emerald-100" },
  indigo: { border: "border-indigo-200/60 dark:border-indigo-900/40",  bg: "bg-indigo-50/50 dark:bg-indigo-950/20",  label: "text-indigo-600 dark:text-indigo-400",  value: "text-indigo-900 dark:text-indigo-100"  },
  amber:  { border: "border-amber-200/60 dark:border-amber-900/40",    bg: "bg-amber-50/50 dark:bg-amber-950/20",    label: "text-amber-600 dark:text-amber-400",    value: "text-amber-900 dark:text-amber-100"    },
} as const;

function Kpi({ label, value, color }: { label: string; value: number; color: keyof typeof KPI_CONFIG }) {
  const cfg = KPI_CONFIG[color];
  return (
    <div className={cn("rounded-xl border p-4", cfg.border, cfg.bg)}>
      <p className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1.5", cfg.label)}>
        {label}
      </p>
      <p className={cn("text-base font-black tabular-nums leading-none", cfg.value)}>
        {fcfa(value)}
      </p>
    </div>
  );
}

// ─── Détail cotisations (optionnel) ───────────────────────────────────────────

function DetailCotisations({ sim }: { sim: ReturnType<typeof compute> }) {
  const rows = [
    { label: "Retraite CNPS (6,3% / 7,7%)", sal: sim.cnps_retraite, pat: sim.charges.retraite },
    { label: "CMU forfait", sal: sim.cmu, pat: sim.charges.cmu },
    { label: "ITS", sal: sim.its, pat: 0 },
    { label: "Prest. familiales (5%)", sal: 0, pat: sim.charges.familiales },
    { label: "Maternité (0,75%)", sal: 0, pat: sim.charges.maternite },
    { label: "AT/MP", sal: 0, pat: sim.charges.at_mp },
    { label: "FDFP (1%)", sal: 0, pat: sim.charges.fdfp },
  ];

  return (
    <div className="rounded-xl border border-border overflow-hidden text-sm">
      <table className="w-full">
        <thead>
          <tr className="bg-muted border-b border-border text-[10px] font-semibold text-muted-foreground uppercase">
            <th className="text-left py-2.5 px-4">Composante</th>
            <th className="text-right py-2.5 px-4">Salariale</th>
            <th className="text-right py-2.5 px-4">Patronale</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {rows.map(({ label, sal, pat }) => (
            <tr key={label} className="hover:bg-muted/40 transition-colors">
              <td className="py-2 px-4 text-foreground/80">{label}</td>
              <td className="py-2 px-4 text-right text-muted-foreground tabular-nums">
                {sal > 0 ? fcfa(sal) : "—"}
              </td>
              <td className="py-2 px-4 text-right text-muted-foreground tabular-nums">
                {pat > 0 ? fcfa(pat) : "—"}
              </td>
            </tr>
          ))}
          <tr className="bg-muted font-semibold">
            <td className="py-2.5 px-4 text-xs uppercase text-foreground/70">Total</td>
            <td className="py-2.5 px-4 text-right text-foreground tabular-nums">{fcfa(sim.cnps_salarie + sim.its)}</td>
            <td className="py-2.5 px-4 text-right text-indigo-500 dark:text-indigo-400 tabular-nums">{fcfa(sim.charges.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Comparaison salarié existant ─────────────────────────────────────────────

function ComparaisonSalarie({ employees }: { employees: EmpRow[] }) {
  const [selectedId, setSelectedId] = useState("");
  const [nouveauBrut, setNouveauBrut] = useState(0);

  const emp = employees.find((e) => e.id === selectedId) ?? null;
  const avant = useMemo(() => emp ? compute(empToInputs(emp)) : null, [emp]);
  const apres = useMemo(
    () => emp && nouveauBrut > 0 ? compute({ ...empToInputs(emp), brut: nouveauBrut }) : null,
    [emp, nouveauBrut],
  );

  function handleSelect(id: string) {
    setSelectedId(id);
    const e = employees.find((x) => x.id === id);
    if (e) setNouveauBrut(e.salaire_brut ?? SMIG_MENSUEL);
  }

  return (
    <div className="space-y-4 pt-4">
      <select value={selectedId} onChange={(e) => handleSelect(e.target.value)} className={inputCls}>
        <option value="">— Choisir un salarié —</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>
            {e.full_name}
            {e.matricule ? ` (${e.matricule})` : ""}
            {e.salaire_brut ? ` — ${fcfa(e.salaire_brut)}` : ""}
          </option>
        ))}
      </select>

      {emp && avant && (
        <div className="space-y-3">
          <NumInput
            label="Nouveau salaire brut"
            value={nouveauBrut}
            onChange={setNouveauBrut}
            hint={`Actuel : ${fcfa(emp.salaire_brut ?? 0)}`}
          />

          {apres && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Net à payer", a: avant.salaire_net, b: apres.salaire_net, color: "green" as const },
                { label: "ITS", a: avant.its, b: apres.its, color: "amber" as const },
                { label: "Coût employeur", a: avant.coutTotal, b: apres.coutTotal, color: "indigo" as const },
              ].map(({ label, a, b, color }) => {
                const delta = b - a;
                const cfg = KPI_CONFIG[color];
                return (
                  <div key={label} className={cn("rounded-xl border p-4", cfg.border, cfg.bg)}>
                    <p className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1.5", cfg.label)}>
                      {label}
                    </p>
                    <p className={cn("text-base font-black tabular-nums leading-none", cfg.value)}>
                      {fcfa(b)}
                    </p>
                    <p className={cn(
                      "text-[11px] font-semibold mt-1.5 tabular-nums",
                      delta === 0 ? "text-muted-foreground" : delta > 0 ? "text-emerald-500" : "text-red-500",
                    )}>
                      {delta === 0 ? "Inchangé" : `${delta > 0 ? "+" : ""}${fcfa(delta)}`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Export principal ─────────────────────────────────────────────────────────

export function SimulatorCockpit({ employees = [] }: { employees?: EmpRow[] }) {
  const [inputs, setInputs] = useState<SimInputs>(DEFAULT);
  const [showOptions, setShowOptions] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const sim = useMemo(() => compute(inputs), [inputs]);
  const set = (p: Partial<SimInputs>) => setInputs((prev) => ({ ...prev, ...p }));

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Salaire principal */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
            Salaire catégoriel brut
          </label>
          <span className="text-[10px] text-muted-foreground/60">
            SMIG : {fcfa(SMIG_MENSUEL)}/mois
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={SMIG_MENSUEL}
            max={3_000_000}
            step={5_000}
            value={inputs.brut}
            onChange={(e) => set({ brut: Number(e.target.value) })}
            className="flex-1 accent-indigo-500 h-1.5 rounded-full cursor-pointer"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="number"
              min={SMIG_MENSUEL}
              step={5_000}
              value={inputs.brut || ""}
              onChange={(e) => set({ brut: Math.max(Number(e.target.value) || 0, SMIG_MENSUEL) })}
              className="w-36 rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold text-foreground text-right focus:outline-none focus:ring-2 focus:ring-ring/30 transition-colors tabular-nums"
            />
            <span className="text-xs text-muted-foreground">FCFA</span>
          </div>
        </div>
      </div>

      {/* KPIs immédiats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Kpi label="Net à payer" value={sim.salaire_net} color="green" />
        <Kpi label="Coût employeur" value={sim.coutTotal} color="indigo" />
        <Kpi label="ITS retenu" value={sim.its} color="amber" />
      </div>

      {/* Options supplémentaires */}
      <div className="space-y-3">
        <button
          onClick={() => setShowOptions((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          aria-expanded={showOptions}
        >
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform duration-200", showOptions && "rotate-180")}
          />
          {showOptions ? "Masquer les options" : "Primes, retenues et paramètres"}
        </button>

        {showOptions && (
          <div className="rounded-xl border border-border bg-muted/30 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NumInput label="Prime transport" hint="Exonérée ITS" value={inputs.primeTransport} onChange={(v) => set({ primeTransport: v })} />
            <NumInput label="Sursalaire" value={inputs.sursalaire} onChange={(v) => set({ sursalaire: v })} />
            <NumInput label="Prime ancienneté" value={inputs.primeAnciennete} onChange={(v) => set({ primeAnciennete: v })} />
            <NumInput label="Prime exceptionnelle" value={inputs.primeExceptionnelle} onChange={(v) => set({ primeExceptionnelle: v })} />
            <NumInput label="Prime de fonction" value={inputs.primeFonction} onChange={(v) => set({ primeFonction: v })} />
            <NumInput label="Prime de salissure" value={inputs.primeSalissure} onChange={(v) => set({ primeSalissure: v })} />
            <NumInput label="Avances sur salaire" value={inputs.avances} onChange={(v) => set({ avances: v })} />
            <NumInput label="Autres retenues" value={inputs.autresRetenues} onChange={(v) => set({ autresRetenues: v })} />
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                Taux AT/MP
              </label>
              <select
                value={inputs.tauxAtMp}
                onChange={(e) => set({ tauxAtMp: Number(e.target.value) })}
                className={inputCls}
              >
                <option value={0.02}>Administration (2%)</option>
                <option value={0.03}>Services / Commerce (3%)</option>
                <option value={0.05}>Industrie / BTP (5%)</option>
              </select>
            </div>
            <div className="col-span-1 sm:col-span-2 flex justify-end">
              <button
                onClick={() => setInputs(DEFAULT)}
                className="text-xs text-muted-foreground hover:text-indigo-500 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Détail cotisations */}
      <div className="space-y-3">
        <button
          onClick={() => setShowDetail((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          aria-expanded={showDetail}
        >
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform duration-200", showDetail && "rotate-180")}
          />
          {showDetail ? "Masquer le détail des cotisations" : "Voir le détail des cotisations"}
        </button>
        {showDetail && <DetailCotisations sim={sim} />}
      </div>

      {/* Comparaison salarié existant */}
      {employees.length > 0 && (
        <div className="border-t border-border pt-4">
          <button
            onClick={() => setShowComparison((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
            aria-expanded={showComparison}
          >
            <Users className="h-4 w-4 shrink-0" />
            <span>{showComparison ? "Masquer la comparaison" : "Simuler l'impact d'une augmentation"}</span>
            <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
              {employees.length}
            </span>
          </button>
          {showComparison && <ComparaisonSalarie employees={employees} />}
        </div>
      )}
    </div>
  );
}
