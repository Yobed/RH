"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const fcfa = (v: number) =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(v);

const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

interface Props {
  masseSalarialeActuelle: number;
  effectifActuel: number;
  anneeActuelle: number;
}

interface Scenario {
  nom: string;
  couleur: string;
  masseSalarialeMensuelle: number;
  masseSalarialeAnnuelle: number;
  coutTotal: number;
  delta: number;
  deltaPct: number;
}

function computeScenario(
  nom: string,
  couleur: string,
  masseMensuelleBase: number,
  effectifBase: number,
  tauxAugmentation: number,
  nbRecrutements: number,
  salaireMoyenNouveaux: number,
  tauxDepart: number,
  tauxCharges: number,
  extraAugmentation = 0,
  extraRecrutements = 0
): Scenario {
  const departs = Math.round(effectifBase * (tauxDepart / 100));
  const recrutements = nbRecrutements + extraRecrutements;
  const effectifFinal = effectifBase - departs + recrutements;

  const salairesMoyenActuel = effectifBase > 0 ? masseMensuelleBase / effectifBase : 0;
  const salairesMoyenRevalorise = salairesMoyenActuel * (1 + (tauxAugmentation + extraAugmentation) / 100);

  const masseSalariesMaintenu = salairesMoyenRevalorise * Math.max(0, effectifBase - departs);
  const masseNouveaux = salaireMoyenNouveaux * recrutements;
  const masseSalarialeMensuelle = masseSalariesMaintenu + masseNouveaux;

  const masseSalarialeAnnuelle = masseSalarialeMensuelle * 12;
  const coutTotal = masseSalarialeAnnuelle * (1 + tauxCharges / 100);
  const delta = masseSalarialeAnnuelle - masseMensuelleBase * 12;
  const deltaPct = masseMensuelleBase > 0 ? (delta / (masseMensuelleBase * 12)) * 100 : 0;

  return { nom, couleur, masseSalarialeMensuelle, masseSalarialeAnnuelle, coutTotal, delta, deltaPct };
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step, unit, onChange }: SliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label>
        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
          {unit === "FCFA"
            ? fcfa(value)
            : `${value}${unit}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-indigo-500"
      />
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>{unit === "FCFA" ? fcfa(min) : `${min}${unit}`}</span>
        <span>{unit === "FCFA" ? fcfa(max) : `${max}${unit}`}</span>
      </div>
    </div>
  );
}

export function SimulateurMasseSalariale({ masseSalarialeActuelle, effectifActuel, anneeActuelle }: Props) {
  const masseMensuelleBase = masseSalarialeActuelle / 12;

  const [tauxAugmentation, setTauxAugmentation] = useState(3);
  const [nbRecrutements, setNbRecrutements] = useState(5);
  const [salaireMoyenNouveaux, setSalaireMoyenNouveaux] = useState(300_000);
  const [tauxDepart, setTauxDepart] = useState(5);
  const [tauxCharges, setTauxCharges] = useState(21);

  const scenarios = useMemo<Scenario[]>(() => {
    const base = { masseMensuelleBase, effectifBase: effectifActuel, tauxCharges };
    return [
      computeScenario("Pessimiste", "#f87171", masseMensuelleBase, effectifActuel, 0, 0, salaireMoyenNouveaux, tauxDepart + 5, tauxCharges),
      computeScenario("Base", "#818cf8", masseMensuelleBase, effectifActuel, tauxAugmentation, nbRecrutements, salaireMoyenNouveaux, tauxDepart, tauxCharges),
      computeScenario("Optimiste", "#34d399", masseMensuelleBase, effectifActuel, tauxAugmentation, nbRecrutements, salaireMoyenNouveaux, tauxDepart, tauxCharges, 2),
      computeScenario("Expansion", "#fb923c", masseMensuelleBase, effectifActuel, tauxAugmentation, nbRecrutements, salaireMoyenNouveaux, Math.max(0, tauxDepart - 2), tauxCharges, 0, Math.round(nbRecrutements * 1.5)),
    ];
  }, [masseMensuelleBase, effectifActuel, tauxAugmentation, nbRecrutements, salaireMoyenNouveaux, tauxDepart, tauxCharges]);

  const chartData = useMemo(() => {
    return MONTHS_FR.map((mois, i) => {
      const progression = (i + 1) / 12;
      const row: Record<string, number | string> = { mois };
      scenarios.forEach((s) => {
        row[s.nom] = Math.round(
          masseMensuelleBase + (s.masseSalarialeMensuelle - masseMensuelleBase) * progression
        );
      });
      return row;
    });
  }, [scenarios, masseMensuelleBase]);

  const anneeSuivante = anneeActuelle + 1;

  return (
    <div className="space-y-6">
      {/* Paramètres */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-5 text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Paramètres de simulation — {anneeSuivante}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Slider label="Taux d'augmentation générale" value={tauxAugmentation} min={0} max={15} step={0.5} unit="%" onChange={setTauxAugmentation} />
          <Slider label="Recrutements prévus" value={nbRecrutements} min={0} max={50} step={1} unit=" pers." onChange={setNbRecrutements} />
          <Slider label="Salaire moyen nouveaux" value={salaireMoyenNouveaux} min={100_000} max={1_500_000} step={50_000} unit="FCFA" onChange={setSalaireMoyenNouveaux} />
          <Slider label="Taux de départ naturel" value={tauxDepart} min={0} max={20} step={1} unit="%" onChange={setTauxDepart} />
          <Slider label="Taux charges patronales" value={tauxCharges} min={15} max={35} step={0.5} unit="%" onChange={setTauxCharges} />
        </div>
      </div>

      {/* Scénarios */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {scenarios.map((s) => (
          <div
            key={s.nom}
            className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900"
            style={{ borderColor: `${s.couleur}44` }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.couleur }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: s.couleur }}>
                {s.nom}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Masse mensuelle</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {fcfa(s.masseSalarialeMensuelle)}
            </p>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Coût annuel total</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              {fcfa(s.coutTotal)}
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span
                className="text-xs font-bold"
                style={{ color: s.delta >= 0 ? "#ef4444" : "#22c55e" }}
              >
                {s.delta >= 0 ? "+" : ""}{s.deltaPct.toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400 ml-1">vs {anneeActuelle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Graphique */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-5 text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Évolution mensuelle — {anneeSuivante}
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
            <defs>
              {scenarios.map((s) => (
                <linearGradient key={s.nom} id={`grad-${s.nom}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.couleur} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={s.couleur} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
            <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}M`}
            />
            <Tooltip
              formatter={(value, name) => [fcfa(Number(value)), String(name)]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {scenarios.map((s) => (
              <Area
                key={s.nom}
                type="monotone"
                dataKey={s.nom}
                stroke={s.couleur}
                strokeWidth={2}
                fill={`url(#grad-${s.nom})`}
                dot={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
