"use client";

import React, { useState, useMemo } from "react";
import {
  calculerBulletinComplet,
  calculerChargesPatronales,
  CHARGES_PATRONALES_TAUX,
  SMIG_MENSUEL,
} from "@/lib/paie-ci";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  Calculator, TrendingUp, Wallet, Briefcase, ArrowRightLeft,
  Users, User, ChevronDown, ChevronUp, BarChart2, Info,
} from "lucide-react";
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

interface SimInputs {
  brut: number;
  sursalaire: number;
  primeAnciennete: number;
  primeExceptionnelle: number;
  primeSalissure: number;
  primeDepassement: number;
  primeFonction: number;
  primeTransport: number;
  h15: number;
  h50: number;
  h75: number;
  autresRetenues: number;
  avances: number;
  nbJoursAbsence: number;
  tauxAtMp: number;
}

const DEFAULT_INPUTS: SimInputs = {
  brut: 250_000,
  sursalaire: 0,
  primeAnciennete: 0,
  primeExceptionnelle: 0,
  primeSalissure: 0,
  primeDepassement: 0,
  primeFonction: 0,
  primeTransport: 30_000,
  h15: 0, h50: 0, h75: 0,
  autresRetenues: 0,
  avances: 0,
  nbJoursAbsence: 0,
  tauxAtMp: CHARGES_PATRONALES_TAUX.at_mp,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fcfa = (n: number) =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(Math.round(n));

const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
const diff = (a: number, b: number) => b - a;
const diffPct = (a: number, b: number) => (a === 0 ? 0 : ((b - a) / a) * 100);

function empToInputs(e: EmpRow): SimInputs {
  return {
    brut: e.salaire_brut ?? SMIG_MENSUEL,
    sursalaire: e.sursalaire ?? 0,
    primeAnciennete: e.prime_anciennete ?? 0,
    primeExceptionnelle: e.prime_exceptionnelle ?? 0,
    primeSalissure: e.prime_salissure ?? 0,
    primeDepassement: e.prime_depassement ?? 0,
    primeFonction: e.prime_fonction ?? 0,
    primeTransport: e.prime_transport ?? 30_000,
    h15: 0, h50: 0, h75: 0,
    autresRetenues: 0,
    avances: 0,
    nbJoursAbsence: 0,
    tauxAtMp: CHARGES_PATRONALES_TAUX.at_mp,
  };
}

function compute(inputs: SimInputs) {
  const res = calculerBulletinComplet({
    salaire_brut: inputs.brut,
    sursalaire: inputs.sursalaire,
    prime_anciennete: inputs.primeAnciennete,
    prime_exceptionnelle: inputs.primeExceptionnelle,
    prime_salissure: inputs.primeSalissure,
    prime_depassement: inputs.primeDepassement,
    prime_fonction: inputs.primeFonction,
    prime_transport: inputs.primeTransport,
    heures_sup:
      inputs.h15 + inputs.h50 + inputs.h75 > 0
        ? { h15: inputs.h15, h50: inputs.h50, h75: inputs.h75 }
        : undefined,
    autres_retenues: inputs.autresRetenues,
    avances: inputs.avances,
    nb_jours_absence: inputs.nbJoursAbsence,
  });
  const charges = calculerChargesPatronales(res.total_imposable, inputs.tauxAtMp);
  const coutTotal = res.total_brut + charges.total;
  const netRatio = coutTotal > 0 ? (res.salaire_net / coutTotal) * 100 : 0;
  return { ...res, charges, coutTotal, netRatio };
}

// ─── Reusable input components ────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[oklch(0.22_0.03_248)] px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400/30";

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
        {label}
      </label>
      {children}
      {hint && <p className="text-[10px] text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}

function NumInput({
  value, onChange, placeholder, min = 0, step = 1000,
}: { value: number; onChange: (v: number) => void; placeholder?: string; min?: number; step?: number }) {
  return (
    <input
      type="number"
      min={min}
      step={step}
      value={value || ""}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      placeholder={placeholder}
      className={inputCls}
    />
  );
}

// ─── Config panel ─────────────────────────────────────────────────────────────

function ConfigPanel({
  inputs,
  onChange,
}: {
  inputs: SimInputs;
  onChange: (patch: Partial<SimInputs>) => void;
}) {
  const [openSec, setOpenSec] = useState<string[]>(["remun", "primes"]);
  const toggle = (k: string) =>
    setOpenSec((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const Section = ({
    id, title, children,
  }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => toggle(id)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-[oklch(0.195_0.025_248)] text-sm font-semibold text-slate-700 dark:text-slate-200"
      >
        {title}
        {openSec.includes(id) ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {openSec.includes(id) && <div className="p-4 space-y-3 bg-white dark:bg-[oklch(0.18_0.03_248)]">{children}</div>}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Salaire de base */}
      <Section id="remun" title="Rémunération de base">
        <Field label="Salaire catégoriel brut" hint={`SMIG : ${fcfa(SMIG_MENSUEL)}/mois`}>
          <div className="space-y-1.5">
            <input
              type="range"
              min={SMIG_MENSUEL}
              max={3_000_000}
              step={5_000}
              value={inputs.brut}
              onChange={(e) => onChange({ brut: Number(e.target.value) })}
              className="w-full accent-indigo-600"
            />
            <div className="flex items-center gap-2">
              <NumInput value={inputs.brut} onChange={(v) => onChange({ brut: Math.max(v, SMIG_MENSUEL) })} placeholder="250 000" />
              <span className="text-xs text-slate-400 shrink-0">FCFA</span>
            </div>
          </div>
        </Field>
        <Field label="Sursalaire">
          <NumInput value={inputs.sursalaire} onChange={(v) => onChange({ sursalaire: v })} placeholder="0" />
        </Field>
      </Section>

      {/* Primes */}
      <Section id="primes" title="Primes & Indemnités">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prime ancienneté" hint="CCI Art. 17">
            <NumInput value={inputs.primeAnciennete} onChange={(v) => onChange({ primeAnciennete: v })} placeholder="0" />
          </Field>
          <Field label="Prime exceptionnelle">
            <NumInput value={inputs.primeExceptionnelle} onChange={(v) => onChange({ primeExceptionnelle: v })} placeholder="0" />
          </Field>
          <Field label="Prime de salissure">
            <NumInput value={inputs.primeSalissure} onChange={(v) => onChange({ primeSalissure: v })} placeholder="0" />
          </Field>
          <Field label="Prime de dépassement">
            <NumInput value={inputs.primeDepassement} onChange={(v) => onChange({ primeDepassement: v })} placeholder="0" />
          </Field>
          <Field label="Prime de fonction">
            <NumInput value={inputs.primeFonction} onChange={(v) => onChange({ primeFonction: v })} placeholder="0" />
          </Field>
          <Field label="Prime de transport" hint="Exonérée ITS">
            <NumInput value={inputs.primeTransport} onChange={(v) => onChange({ primeTransport: v })} placeholder="30 000" />
          </Field>
        </div>
      </Section>

      {/* Heures sup */}
      <Section id="hsup" title="Heures supplémentaires">
        <div className="grid grid-cols-3 gap-3">
          <Field label="H. à +15%" hint="41e–46e h">
            <NumInput value={inputs.h15} onChange={(v) => onChange({ h15: v })} placeholder="0" step={1} />
          </Field>
          <Field label="H. à +50%" hint="> 46e h">
            <NumInput value={inputs.h50} onChange={(v) => onChange({ h50: v })} placeholder="0" step={1} />
          </Field>
          <Field label="H. à +75%" hint="Nuit/férié">
            <NumInput value={inputs.h75} onChange={(v) => onChange({ h75: v })} placeholder="0" step={1} />
          </Field>
        </div>
      </Section>

      {/* Retenues */}
      <Section id="retenues" title="Retenues & Absences">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Autres retenues">
            <NumInput value={inputs.autresRetenues} onChange={(v) => onChange({ autresRetenues: v })} placeholder="0" />
          </Field>
          <Field label="Avances sur salaire">
            <NumInput value={inputs.avances} onChange={(v) => onChange({ avances: v })} placeholder="0" />
          </Field>
          <Field label="Jours absence" hint="1 j = salaire ÷ 26">
            <NumInput value={inputs.nbJoursAbsence} onChange={(v) => onChange({ nbJoursAbsence: v })} placeholder="0" step={0.5} min={0} />
          </Field>
        </div>
      </Section>

      {/* Employeur */}
      <Section id="emp" title="Paramètres employeur">
        <Field label="Taux AT/MP (risques professionnels)">
          <select
            value={inputs.tauxAtMp}
            onChange={(e) => onChange({ tauxAtMp: Number(e.target.value) })}
            className={inputCls}
          >
            <option value={0.02}>Administration (2%)</option>
            <option value={0.03}>Services / Commerce (3%)</option>
            <option value={0.05}>Industrie / BTP (5%)</option>
          </select>
        </Field>
      </Section>
    </div>
  );
}

// ─── Results panel ────────────────────────────────────────────────────────────

function ResultsPanel({ sim }: { sim: ReturnType<typeof compute> }) {
  const [view, setView] = useState<"chart" | "table">("chart");

  const chartData = [
    { name: "Net à payer", value: sim.salaire_net, color: "#10b981" },
    { name: "Charges salariales", value: sim.cnps_retraite + sim.cmu, color: "#3b82f6" },
    { name: "ITS", value: sim.its, color: "#f59e0b" },
    { name: "Charges patronales", value: sim.charges.total, color: "#6366f1" },
  ];

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Net à payer", value: sim.salaire_net, color: "emerald" as const },
          { label: "Coût employeur", value: sim.coutTotal, color: "indigo" as const },
          { label: "Écart fiscal", value: sim.coutTotal - sim.salaire_net, color: "amber" as const },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className={cn(
              "rounded-xl border p-4",
              color === "emerald" && "border-emerald-100 bg-emerald-50/40 dark:border-emerald-900/30 dark:bg-emerald-900/10",
              color === "indigo" && "border-indigo-100 bg-indigo-50/40 dark:border-indigo-900/30 dark:bg-indigo-900/10",
              color === "amber" && "border-amber-100 bg-amber-50/40 dark:border-amber-900/30 dark:bg-amber-900/10",
            )}
          >
            <p className={cn(
              "text-[10px] font-semibold uppercase tracking-wider mb-1",
              color === "emerald" && "text-emerald-600 dark:text-emerald-400",
              color === "indigo" && "text-indigo-600 dark:text-indigo-400",
              color === "amber" && "text-amber-600 dark:text-amber-400",
            )}>{label}</p>
            <p className={cn(
              "text-lg font-black leading-none",
              color === "emerald" && "text-emerald-900 dark:text-emerald-200",
              color === "indigo" && "text-indigo-900 dark:text-indigo-200",
              color === "amber" && "text-amber-900 dark:text-amber-200",
            )}>{fcfa(value)}</p>
            {label === "Net à payer" && (
              <p className="text-[10px] text-slate-400 mt-1">{sim.netRatio.toFixed(1)}% du coût total</p>
            )}
          </div>
        ))}
      </div>

      {/* Sub-KPIs */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Brut total", value: sim.total_brut },
          { label: "CNPS + CMU", value: sim.cnps_salarie },
          { label: "ITS", value: sim.its },
          { label: "H. sup", value: sim.heures_sup_montant },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg bg-slate-50 dark:bg-[oklch(0.195_0.025_248)] p-3 text-center">
            <p className="text-[10px] text-slate-400 uppercase">{label}</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-0.5">{fcfa(value)}</p>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex gap-1 bg-slate-100 dark:bg-[oklch(0.22_0.03_248)] p-1 rounded-lg w-fit">
        {[{ k: "chart", label: "Graphique" }, { k: "table", label: "Détail" }].map(({ k, label }) => (
          <button
            key={k}
            onClick={() => setView(k as "chart" | "table")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
              view === k
                ? "bg-white dark:bg-[oklch(0.175_0.04_248)] text-indigo-600 dark:text-[oklch(0.78_0.13_73)] shadow-sm"
                : "text-slate-500",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "chart" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v) => fcfa(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{fcfa(item.value)}</span>
                  <span className="text-[10px] text-slate-400 ml-1.5">
                    {((item.value / sim.coutTotal) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
            <div className="border-t dark:border-slate-700 pt-2 flex justify-between font-bold text-slate-800 dark:text-slate-100">
              <span className="text-xs uppercase tracking-wider">Coût employeur total</span>
              <span>{fcfa(sim.coutTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {view === "table" && (
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-[oklch(0.195_0.025_248)] border-b border-slate-100 dark:border-slate-700">
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Composante</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Salariale</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Patronale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {[
                { label: "Retraite CNPS (6,3% / 7,7%)", sal: sim.cnps_retraite, pat: sim.charges.retraite },
                { label: "CMU forfait", sal: sim.cmu, pat: sim.charges.cmu },
                { label: "ITS", sal: sim.its, pat: 0 },
                { label: "Prest. familiales (5%)", sal: 0, pat: sim.charges.familiales },
                { label: "Maternité (0,75%)", sal: 0, pat: sim.charges.maternite },
                { label: "AT/MP", sal: 0, pat: sim.charges.at_mp },
                { label: "FDFP (1%)", sal: 0, pat: sim.charges.fdfp },
              ].map(({ label, sal, pat }) => (
                <tr key={label} className="bg-white dark:bg-[oklch(0.18_0.03_248)]">
                  <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{label}</td>
                  <td className="py-2.5 px-4 text-right text-slate-600 dark:text-slate-400">{sal > 0 ? fcfa(sal) : "—"}</td>
                  <td className="py-2.5 px-4 text-right text-slate-600 dark:text-slate-400">{pat > 0 ? fcfa(pat) : "—"}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 dark:bg-[oklch(0.195_0.025_248)] font-bold">
                <td className="py-3 px-4 text-slate-800 dark:text-slate-100 uppercase text-xs tracking-wide">Total</td>
                <td className="py-3 px-4 text-right text-slate-800 dark:text-slate-100">{fcfa(sim.cnps_salarie + sim.its)}</td>
                <td className="py-3 px-4 text-right text-indigo-600 dark:text-[oklch(0.72_0.12_252)]">{fcfa(sim.charges.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Libre mode ───────────────────────────────────────────────────────────────

function LibreMode() {
  const [inputs, setInputs] = useState<SimInputs>(DEFAULT_INPUTS);
  const sim = useMemo(() => compute(inputs), [inputs]);
  const patch = (p: Partial<SimInputs>) => setInputs((prev) => ({ ...prev, ...p }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Configuration</h3>
          <button
            onClick={() => setInputs(DEFAULT_INPUTS)}
            className="text-xs text-slate-400 hover:text-indigo-600 transition-colors"
          >
            Réinitialiser
          </button>
        </div>
        <ConfigPanel inputs={inputs} onChange={patch} />
        {/* Efficacité */}
        <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/40 p-4 flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">Efficacité salariale</p>
            <p className="text-2xl font-black text-indigo-700 dark:text-indigo-200">{sim.netRatio.toFixed(1)}%</p>
            <p className="text-[10px] text-indigo-500 dark:text-indigo-400">Net perçu / Coût patronal total</p>
          </div>
        </div>
      </div>
      <div className="lg:col-span-8">
        <ResultsPanel sim={sim} />
      </div>
    </div>
  );
}

// ─── Delta row helper ─────────────────────────────────────────────────────────

function DeltaRow({
  label, avant, apres, highlight,
}: { label: string; avant: number; apres: number; highlight?: boolean }) {
  const d = diff(avant, apres);
  const dp = diffPct(avant, apres);
  const pos = d >= 0;
  return (
    <tr className={cn(highlight && "bg-slate-50 dark:bg-[oklch(0.195_0.025_248)] font-bold")}>
      <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300 text-sm">{label}</td>
      <td className="py-2.5 px-4 text-right text-slate-600 dark:text-slate-400 text-sm">{fcfa(avant)}</td>
      <td className="py-2.5 px-4 text-right text-slate-800 dark:text-slate-100 text-sm">{fcfa(apres)}</td>
      <td className={cn("py-2.5 px-4 text-right text-sm font-semibold", d === 0 ? "text-slate-400" : pos ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>
        {d === 0 ? "—" : `${pos ? "+" : ""}${fcfa(d)}`}
      </td>
      <td className={cn("py-2.5 px-4 text-right text-xs", d === 0 ? "text-slate-400" : pos ? "text-emerald-500" : "text-red-400")}>
        {d === 0 ? "—" : pct(dp)}
      </td>
    </tr>
  );
}

// ─── Par salarié mode ─────────────────────────────────────────────────────────

function ParSalarieMode({ employees }: { employees: EmpRow[] }) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [scenario, setScenario] = useState<SimInputs>(DEFAULT_INPUTS);
  const [augPct, setAugPct] = useState<number>(5);

  const selectedEmp = employees.find((e) => e.id === selectedId) ?? null;

  const currentInputs: SimInputs = useMemo(
    () => (selectedEmp ? empToInputs(selectedEmp) : DEFAULT_INPUTS),
    [selectedEmp],
  );

  const simAvant = useMemo(() => compute(currentInputs), [currentInputs]);
  const simApres = useMemo(() => compute(scenario), [scenario]);

  const patchScenario = (p: Partial<SimInputs>) => setScenario((prev) => ({ ...prev, ...p }));

  function loadEmployee(id: string) {
    setSelectedId(id);
    const emp = employees.find((e) => e.id === id);
    if (emp) setScenario(empToInputs(emp));
  }

  // Impact collectif
  const collectifAvant = useMemo(() => {
    return employees.reduce((acc, e) => {
      const inp = empToInputs(e);
      const r = compute(inp);
      return acc + r.coutTotal;
    }, 0);
  }, [employees]);

  const collectifApres = useMemo(() => {
    return employees.reduce((acc, e) => {
      const inp = empToInputs(e);
      const r = compute({ ...inp, brut: Math.round(inp.brut * (1 + augPct / 100)) });
      return acc + r.coutTotal;
    }, 0);
  }, [employees, augPct]);

  const collectifDelta = collectifApres - collectifAvant;

  const barData = selectedEmp
    ? [
        { label: "Net", avant: simAvant.salaire_net, apres: simApres.salaire_net },
        { label: "CNPS+ITS", avant: simAvant.cnps_salarie + simAvant.its, apres: simApres.cnps_salarie + simApres.its },
        { label: "Ch. patron.", avant: simAvant.charges.total, apres: simApres.charges.total },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Employee selector */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[oklch(0.18_0.03_248)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Sélectionner un salarié</h3>
          <span className="ml-auto text-xs text-slate-400">{employees.length} actif(s) chargé(s)</span>
        </div>
        <select
          value={selectedId}
          onChange={(e) => loadEmployee(e.target.value)}
          className={inputCls}
        >
          <option value="">— Choisir un salarié —</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.full_name}
              {e.matricule ? ` (${e.matricule})` : ""}
              {e.departement ? ` — ${e.departement}` : ""}
              {e.salaire_brut ? ` — ${fcfa(e.salaire_brut)}` : ""}
            </option>
          ))}
        </select>
        {!selectedEmp && (
          <p className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            Sélectionnez un salarié pour voir son état actuel et simuler des modifications.
          </p>
        )}
      </div>

      {selectedEmp && (
        <>
          {/* Before / after comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Scenario inputs */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Scénario — {selectedEmp.full_name.split(" ")[0]}
                </h3>
                <button
                  onClick={() => setScenario(currentInputs)}
                  className="text-xs text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  Réinitialiser
                </button>
              </div>
              <ConfigPanel inputs={scenario} onChange={patchScenario} />
            </div>

            {/* Delta table + chart */}
            <div className="lg:col-span-8 space-y-5">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Net salarié",
                    avant: simAvant.salaire_net,
                    apres: simApres.salaire_net,
                    color: "emerald" as const,
                  },
                  {
                    label: "ITS retenu",
                    avant: simAvant.its,
                    apres: simApres.its,
                    color: "amber" as const,
                  },
                  {
                    label: "Coût employeur",
                    avant: simAvant.coutTotal,
                    apres: simApres.coutTotal,
                    color: "indigo" as const,
                  },
                ].map(({ label, avant, apres, color }) => {
                  const d = apres - avant;
                  const dp = avant > 0 ? (d / avant) * 100 : 0;
                  return (
                    <div
                      key={label}
                      className={cn(
                        "rounded-xl border p-4",
                        color === "emerald" && "border-emerald-100 bg-emerald-50/40 dark:border-emerald-900/30 dark:bg-emerald-900/10",
                        color === "indigo" && "border-indigo-100 bg-indigo-50/40 dark:border-indigo-900/30 dark:bg-indigo-900/10",
                        color === "amber" && "border-amber-100 bg-amber-50/40 dark:border-amber-900/30 dark:bg-amber-900/10",
                      )}
                    >
                      <p className={cn(
                        "text-[10px] font-semibold uppercase tracking-wider mb-1",
                        color === "emerald" && "text-emerald-600 dark:text-emerald-400",
                        color === "indigo" && "text-indigo-600 dark:text-indigo-400",
                        color === "amber" && "text-amber-600 dark:text-amber-400",
                      )}>{label}</p>
                      <p className="text-base font-black text-slate-800 dark:text-slate-100">{fcfa(apres)}</p>
                      <p className={cn(
                        "text-xs font-semibold mt-1",
                        d === 0 ? "text-slate-400" : d > 0 ? "text-emerald-500" : "text-red-500",
                      )}>
                        {d === 0 ? "Inchangé" : `${d > 0 ? "+" : ""}${fcfa(d)} (${pct(dp)})`}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Delta table */}
              <div className="rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 dark:bg-[oklch(0.195_0.025_248)] border-b border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Comparaison détaillée — Avant / Après
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-50 dark:border-slate-800">
                        <th className="py-2 px-4 text-left text-[10px] font-semibold text-slate-400 uppercase">Composante</th>
                        <th className="py-2 px-4 text-right text-[10px] font-semibold text-slate-400 uppercase">Avant</th>
                        <th className="py-2 px-4 text-right text-[10px] font-semibold text-slate-400 uppercase">Après</th>
                        <th className="py-2 px-4 text-right text-[10px] font-semibold text-slate-400 uppercase">Différence</th>
                        <th className="py-2 px-4 text-right text-[10px] font-semibold text-slate-400 uppercase">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-[oklch(0.18_0.03_248)]">
                      <DeltaRow label="Brut total" avant={simAvant.total_brut} apres={simApres.total_brut} />
                      <DeltaRow label="CNPS salarié" avant={simAvant.cnps_retraite} apres={simApres.cnps_retraite} />
                      <DeltaRow label="CMU" avant={simAvant.cmu} apres={simApres.cmu} />
                      <DeltaRow label="ITS" avant={simAvant.its} apres={simApres.its} />
                      <DeltaRow label="Net à payer" avant={simAvant.salaire_net} apres={simApres.salaire_net} highlight />
                      <DeltaRow label="Ch. patronales" avant={simAvant.charges.total} apres={simApres.charges.total} />
                      <DeltaRow label="Coût total employeur" avant={simAvant.coutTotal} apres={simApres.coutTotal} highlight />
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bar chart */}
              <div className="h-52">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Répartition Avant / Après</p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => fcfa(Number(v))} />
                    <Legend />
                    <Bar dataKey="avant" name="Avant" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="apres" name="Après" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Impact collectif */}
      <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-900/10 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-200">
            Impact collectif — {employees.length} salarié(s)
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Field label="Augmentation globale (%)">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={50}
                step={0.5}
                value={augPct}
                onChange={(e) => setAugPct(Number(e.target.value))}
                className="w-36 accent-indigo-600"
              />
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={augPct}
                onChange={(e) => setAugPct(Number(e.target.value) || 0)}
                className="w-16 rounded-lg border border-indigo-200 dark:border-indigo-800 px-2 py-1.5 text-sm text-center font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-[oklch(0.18_0.03_248)]"
              />
              <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">%</span>
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Masse salariale actuelle", value: collectifAvant, sub: "/mois" },
            { label: "Masse simulée", value: collectifApres, sub: "/mois" },
            { label: "Surcoût mensuel", value: collectifDelta, sub: "/mois", delta: true },
            { label: "Surcoût annuel", value: collectifDelta * 12, sub: "/an", delta: true },
          ].map(({ label, value, sub, delta }) => (
            <div key={label} className="rounded-xl bg-white dark:bg-[oklch(0.18_0.03_248)] border border-indigo-100 dark:border-indigo-900/30 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
              <p className={cn(
                "text-lg font-black",
                delta
                  ? value === 0
                    ? "text-slate-400"
                    : value > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-500"
                  : "text-slate-800 dark:text-slate-100",
              )}>
                {delta && value > 0 ? "+" : ""}{fcfa(value)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5">
          <Info className="h-3 w-3 shrink-0" />
          L&apos;augmentation s&apos;applique au salaire catégoriel brut de chaque salarié — les primes existantes sont conservées.
        </p>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function SimulatorCockpit({ employees = [] }: { employees?: EmpRow[] }) {
  const [mode, setMode] = useState<"libre" | "salarie">("libre");

  return (
    <div className="space-y-5">
      {/* Mode switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Cockpit de Simulation RH</h2>
          <p className="text-sm text-slate-400 dark:text-slate-500">Analyse de masse salariale · Conforme CT-CI 2025</p>
        </div>
        <div className="flex gap-1 bg-slate-100 dark:bg-[oklch(0.22_0.03_248)] p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setMode("libre")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
              mode === "libre"
                ? "bg-white dark:bg-[oklch(0.175_0.04_248)] text-indigo-600 dark:text-[oklch(0.78_0.13_73)] shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200",
            )}
          >
            <Calculator className="h-4 w-4" />
            Simulation libre
          </button>
          <button
            onClick={() => setMode("salarie")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
              mode === "salarie"
                ? "bg-white dark:bg-[oklch(0.175_0.04_248)] text-indigo-600 dark:text-[oklch(0.78_0.13_73)] shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200",
            )}
          >
            <Users className="h-4 w-4" />
            Par salarié
            {employees.length > 0 && (
              <span className="ml-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-300">
                {employees.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {mode === "libre" && <LibreMode />}
      {mode === "salarie" && (
        employees.length === 0 ? (
          <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-[oklch(0.18_0.03_248)] p-10 text-center">
            <Users className="h-10 w-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">Aucun salarié actif trouvé.</p>
            <p className="text-xs text-slate-400 mt-1">Ajoutez des employés dans le module Employés.</p>
          </div>
        ) : (
          <ParSalarieMode employees={employees} />
        )
      )}
    </div>
  );
}
