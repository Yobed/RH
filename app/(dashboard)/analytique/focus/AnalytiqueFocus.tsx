"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, LineChart, Line, Legend, RadialBarChart, RadialBar,
  PieChart, Pie, Cell,
} from "recharts";
import {
  applyFilters, computeEffectif, computeAgePyramid, computePayroll,
  computeTurnover, computeAbsenteeism, computeMedical, computeRecruitment,
  computePerformance, computeSafety, listDepartments, listCategories,
  listYears, getReferenceDate, MONTH_LABELS, FMT,
  type RhEmployee, type RhBulletin, type RhContract, type RhConge, type RhMedical,
  type RhJob, type RhCandidate, type RhEvaluation, type RhAccident,
} from "@/lib/analytics-rh";

interface Props {
  employees: RhEmployee[];
  bulletins: RhBulletin[];
  contracts: RhContract[];
  conges: RhConge[];
  medical: RhMedical[];
  jobPostings: RhJob[];
  candidates: RhCandidate[];
  evaluations: RhEvaluation[];
  accidents: RhAccident[];
}

type AxeId = "talent" | "remuneration" | "recrutement" | "climat" | "performance";

const AXES: { id: AxeId; label: string; subtitle: string }[] = [
  { id: "talent",       label: "Talent",       subtitle: "Effectif, parité, démographie, rétention" },
  { id: "remuneration", label: "Rémunération", subtitle: "Masse salariale, coût total, équité" },
  { id: "recrutement",  label: "Recrutement",  subtitle: "Pipeline, fill rate, délai, qualité" },
  { id: "climat",       label: "Climat",       subtitle: "Absentéisme, médical, sécurité" },
  { id: "performance",  label: "Performance",  subtitle: "Évaluations, scoring, potentiel" },
];

// ── UI sobre ───────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-slate-200 bg-white ${className}`}>{children}</div>;
}

function CardTitle({ children, sub, action }: { children: React.ReactNode; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 sm:gap-3 px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-slate-100">
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-slate-900">{children}</h3>
        {sub && <p className="text-xs text-slate-500 mt-0.5 leading-snug">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function StatRow({ label, value, sub, accent }: {
  label: string; value: string; sub?: string;
  accent?: "neutral" | "positive" | "negative" | "warn";
}) {
  const dot = {
    neutral: "bg-slate-300",
    positive: "bg-emerald-500",
    negative: "bg-rose-500",
    warn: "bg-amber-500",
  }[accent || "neutral"];
  return (
    <div className="flex items-baseline justify-between py-2.5 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <span className="text-sm text-slate-700">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-sm font-semibold text-slate-900 tabular-nums">{value}</span>
        {sub && <span className="text-xs text-slate-400 ml-2">{sub}</span>}
      </div>
    </div>
  );
}

function HeroKpi({
  kicker, value, sub, signal,
}: {
  kicker: string; value: string; sub?: string;
  signal?: { delta: number; label: string };
}) {
  const sigColor = !signal ? "" :
    signal.delta > 0 ? "text-emerald-600" : signal.delta < 0 ? "text-rose-600" : "text-slate-400";
  const Icon = signal && signal.delta > 0 ? ArrowUpRight : signal && signal.delta < 0 ? ArrowDownRight : null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
      <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">{kicker}</p>
      <p className="mt-1.5 sm:mt-2 text-2xl sm:text-4xl font-semibold text-slate-900 tabular-nums tracking-tight break-words">{value}</p>
      <div className="mt-1.5 sm:mt-2 flex flex-col sm:flex-row sm:items-center sm:gap-3 gap-1 text-[11px] sm:text-xs">
        {sub && <span className="text-slate-500 leading-snug">{sub}</span>}
        {signal && Icon && (
          <span className={`inline-flex items-center gap-1 ${sigColor} font-medium`}>
            <Icon className="h-3 w-3" /> {Math.abs(signal.delta).toFixed(1)}% <span className="text-slate-400 font-normal">{signal.label}</span>
          </span>
        )}
      </div>
    </div>
  );
}

const TOOLTIP_STYLE = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: 12,
  padding: "8px 10px",
  boxShadow: "0 4px 12px -2px rgba(0,0,0,0.05)",
};

function Insight({ kind, title, body }: { kind: "positive" | "negative" | "warn" | "neutral"; title: string; body: string }) {
  const style = {
    positive: "border-emerald-200 bg-emerald-50/60 text-emerald-900",
    negative: "border-rose-200 bg-rose-50/60 text-rose-900",
    warn: "border-amber-200 bg-amber-50/60 text-amber-900",
    neutral: "border-slate-200 bg-slate-50 text-slate-900",
  }[kind];
  return (
    <div className={`rounded-md border px-4 py-3 ${style}`}>
      <p className="text-xs font-semibold">{title}</p>
      <p className="text-xs mt-1 opacity-80 leading-relaxed">{body}</p>
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────

// ── Composants segments ────────────────────────────────────────────────────

function FilterField({ label, children, fullOnMobile }: {
  label: string; children: React.ReactNode; fullOnMobile?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${fullOnMobile ? "w-full sm:w-auto" : ""}`}>
      <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-medium whitespace-nowrap">{label}</span>
      <div className={fullOnMobile ? "flex-1 sm:flex-none min-w-0" : ""}>{children}</div>
    </div>
  );
}

function SegmentBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        "h-7 px-3 rounded text-xs font-medium tabular-nums transition-colors whitespace-nowrap",
        active ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SegmentedYear({ value, onChange, years }: {
  value: number | null; onChange: (v: number | null) => void; years: number[];
}) {
  const visible = years.slice(0, 4);
  const hidden = years.slice(4);
  return (
    <div className="inline-flex items-center rounded-md border border-slate-200 bg-white p-0.5 max-w-full overflow-x-auto no-scrollbar">
      <SegmentBtn active={value === null} onClick={() => onChange(null)}>Toutes</SegmentBtn>
      {visible.map(y => (
        <SegmentBtn key={y} active={value === y} onClick={() => onChange(y)}>{y}</SegmentBtn>
      ))}
      {hidden.length > 0 && (
        <select
          value={hidden.includes(value || 0) ? String(value) : ""}
          onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
          className="h-7 rounded border-0 bg-transparent text-xs text-slate-700 px-1 focus:outline-none focus:ring-1 focus:ring-slate-300"
        >
          <option value="">…</option>
          {hidden.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      )}
    </div>
  );
}

function SegmentedMonth({ value, onChange, disabled }: {
  value: number | null; onChange: (v: number | null) => void; disabled?: boolean;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
      disabled={disabled}
      className="h-9 w-full sm:w-auto rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option value="">Tous</option>
      <option value="1">Janv.</option>
      <option value="2">Févr.</option>
      <option value="3">Mars</option>
      <option value="4">Avril</option>
      <option value="5">Mai</option>
      <option value="6">Juin</option>
      <option value="7">Juil.</option>
      <option value="8">Août</option>
      <option value="9">Sept.</option>
      <option value="10">Oct.</option>
      <option value="11">Nov.</option>
      <option value="12">Déc.</option>
    </select>
  );
}

// ── Composant principal ────────────────────────────────────────────────────

export function AnalytiqueFocus(props: Props) {
  const [departement, setDepartement] = useState("Tous");
  const [categorie, setCategorie] = useState("Tous");
  const [annee, setAnnee] = useState<number | null>(null);
  const [mois, setMois] = useState<number | null>(null);
  const [axe, setAxe] = useState<AxeId>("talent");

  const dataset = useMemo(() => ({
    employees: props.employees,
    bulletins: props.bulletins,
    contracts: props.contracts,
    conges: props.conges,
    medical: props.medical,
    jobPostings: props.jobPostings,
    candidates: props.candidates,
    evaluations: props.evaluations,
    accidents: props.accidents,
  }), [props]);

  const departements = useMemo(() => listDepartments(props.employees), [props.employees]);
  const categories = useMemo(() => listCategories(props.employees), [props.employees]);
  const annees = useMemo(() => listYears(dataset), [dataset]);
  const filtered = useMemo(
    () => applyFilters(dataset, { departement, categorie, annee, mois }),
    [dataset, departement, categorie, annee, mois]
  );
  const refDate = useMemo(() => getReferenceDate(annee, mois), [annee, mois]);

  const periodLabel = useMemo(() => {
    if (annee && mois) return `${MONTH_LABELS[mois - 1]} ${annee}`;
    if (annee) return `Année ${annee}`;
    return "12 mois glissants";
  }, [annee, mois]);

  const isFiltered = departement !== "Tous" || categorie !== "Tous" || annee !== null || mois !== null;
  const resetFilters = () => {
    setDepartement("Tous"); setCategorie("Tous"); setAnnee(null); setMois(null);
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-[1400px] mx-auto">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="flex flex-col gap-4 sm:gap-5 pb-4 border-b border-slate-200">
        <div>
          <Link href="/analytique" className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5">
            <ArrowLeft className="h-3 w-3" /> Retour à l'analytique
          </Link>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1.5 sm:mt-2">Focus stratégique</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-1.5 leading-snug">
            Lecture détaillée par axe — données synchronisées.
            <span className="text-slate-700 font-medium block sm:inline sm:ml-1">· {periodLabel}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-x-5 gap-y-3">
          <FilterField label="Département" fullOnMobile>
            <select
              value={departement}
              onChange={e => setDepartement(e.target.value)}
              className="h-9 w-full sm:w-auto rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            >
              {departements.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </FilterField>
          <FilterField label="Catégorie" fullOnMobile>
            <select
              value={categorie}
              onChange={e => setCategorie(e.target.value)}
              className="h-9 w-full sm:w-auto rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FilterField>

          <div className="hidden sm:block h-8 w-px bg-slate-200" />
          <div className="sm:hidden h-px w-full bg-slate-100" />

          <FilterField label="Année" fullOnMobile>
            <SegmentedYear value={annee} onChange={setAnnee} years={annees} />
          </FilterField>
          <FilterField label="Mois" fullOnMobile>
            <SegmentedMonth value={mois} onChange={setMois} disabled={annee === null} />
          </FilterField>

          {isFiltered && (
            <button
              onClick={resetFilters}
              className="text-xs text-slate-500 hover:text-slate-900 underline underline-offset-2 self-start sm:self-auto sm:ml-auto"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </header>

      {/* ── Tabs axes ─────────────────────────────────────── */}
      <nav className="border-b border-slate-200">
        <div className="flex gap-1 overflow-x-auto -mb-px">
          {AXES.map(a => {
            const active = axe === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setAxe(a.id)}
                className={[
                  "px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors",
                  active
                    ? "border-slate-900 text-slate-900 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300",
                ].join(" ")}
              >
                {a.label}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-slate-500">{AXES.find(a => a.id === axe)?.subtitle}</p>
      </nav>

      {/* ── Contenu par axe ─────────────────────────────── */}
      {axe === "talent" && <AxeTalent dataset={filtered} refDate={refDate} />}
      {axe === "remuneration" && <AxeRemuneration dataset={filtered} refDate={refDate} />}
      {axe === "recrutement" && <AxeRecrutement dataset={filtered} />}
      {axe === "climat" && <AxeClimat dataset={filtered} refDate={refDate} />}
      {axe === "performance" && <AxePerformance dataset={filtered} />}
    </div>
  );
}

// ── Axe Talent ─────────────────────────────────────────────────────────────

function AxeTalent({ dataset, refDate }: { dataset: ReturnType<typeof applyFilters>; refDate: Date }) {
  const eff = useMemo(() => computeEffectif(dataset, refDate), [dataset, refDate]);
  const age = useMemo(() => computeAgePyramid(dataset, refDate), [dataset, refDate]);
  const turnover = useMemo(() => computeTurnover(dataset, refDate), [dataset, refDate]);
  const pyramidData = age.pyramid.map(b => ({ ...b, Hommes: -b.Hommes }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <HeroKpi
          kicker="Effectif actif"
          value={eff.actifs.toString()}
          sub={`Total ${eff.total} · ${eff.suspendus} suspendus`}
        />
        <HeroKpi
          kicker="Parité femmes"
          value={`${eff.parityRate}%`}
          sub={`${eff.femmes} F / ${eff.hommes} H`}
        />
        <HeroKpi
          kicker="Turnover annuel"
          value={`${turnover.rateYear}%`}
          sub={`${turnover.entriesYear} entrées · ${turnover.departuresYear} sorties`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <Card className="lg:col-span-2">
          <CardTitle sub={`Âge moyen ${age.averageAge} ans`}>Pyramide des âges</CardTitle>
          <div className="p-3 sm:p-5">
            <ResponsiveContainer width="100%" height={260} minHeight={220}>
              <BarChart data={pyramidData} layout="vertical" stackOffset="sign" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tickFormatter={(v: number) => Math.abs(v).toString()} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                <YAxis dataKey="range" type="category" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={50} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, name) => [`${Math.abs(Number(v))} pers.`, String(name)]} />
                <Bar dataKey="Hommes" stackId="x" fill="#475569" radius={[0, 0, 0, 3]} />
                <Bar dataKey="Femmes" stackId="x" fill="#059669" radius={[0, 3, 3, 0]} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="square" iconSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle sub="Répartition statutaire">Statut</CardTitle>
          <div className="p-3 sm:p-5">
            <StatRow label="Actifs" value={eff.actifs.toString()} accent="positive" />
            <StatRow label="Suspendus" value={eff.suspendus.toString()} accent="warn" />
            <StatRow label="Inactifs" value={eff.inactifs.toString()} accent="neutral" />
            <StatRow label="Total" value={eff.total.toString()} accent="neutral" />
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle sub="Mouvements mensuels — 12 derniers mois">Évolution effectif</CardTitle>
        <div className="p-3 sm:p-5">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={turnover.series} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="entrees" name="Entrées" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="sorties" name="Sorties" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="square" iconSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {turnover.rateYear > 15 && (
        <Insight
          kind="negative"
          title="Turnover élevé"
          body={`Le taux de rotation atteint ${turnover.rateYear}% (seuil critique > 15%). Investiguer les causes de départ et l'engagement managérial sur les 12 derniers mois.`}
        />
      )}
      {eff.parityRate < 30 && eff.actifs > 5 && (
        <Insight
          kind="warn"
          title="Sous-représentation féminine"
          body={`Avec ${eff.parityRate}% de femmes, la mixité reste éloignée de l'équilibre attendu. Examiner le pipeline de recrutement et la rétention par genre.`}
        />
      )}
    </div>
  );
}

// ── Axe Rémunération ───────────────────────────────────────────────────────

function AxeRemuneration({ dataset, refDate }: { dataset: ReturnType<typeof applyFilters>; refDate: Date }) {
  const payroll = useMemo(() => computePayroll(dataset, refDate), [dataset, refDate]);
  const eff = useMemo(() => computeEffectif(dataset, refDate), [dataset, refDate]);

  const ratioNetBrut = !payroll.current || payroll.current.brut === 0
    ? 0
    : Math.round((payroll.current.net / payroll.current.brut) * 1000) / 10;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <HeroKpi
          kicker="Masse salariale (mois)"
          value={FMT.currency(payroll.current?.brut || 0)}
          sub={`Coût total ${FMT.currency(payroll.current?.coutTotal || 0)}`}
          signal={{ delta: payroll.deltaPct, label: "vs M-1" }}
        />
        <HeroKpi
          kicker="Brut moyen / salarié"
          value={FMT.currency(payroll.averageBrutPerEmployee)}
          sub={`Sur ${eff.actifs} actifs`}
        />
        <HeroKpi
          kicker="YTD cumulé"
          value={FMT.currency(payroll.ytdBrut)}
          sub={`Coût total ${FMT.currency(payroll.ytdCoutTotal)}`}
        />
      </div>

      <Card>
        <CardTitle sub="Brut, net et coût total employeur — 12 derniers mois">Trajectoire de la masse salariale</CardTitle>
        <div className="p-3 sm:p-5">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={payroll.series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-brut-focus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f172a" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
              <YAxis
                tickFormatter={(v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => FMT.currency(Number(v))} />
              <Area type="monotone" dataKey="coutTotal" name="Coût total employeur" stroke="#94a3b8" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="brut" name="Salaire brut" stroke="#0f172a" strokeWidth={2} fill="url(#grad-brut-focus)" />
              <Area type="monotone" dataKey="net" name="Salaire net" stroke="#10b981" strokeWidth={1.5} fill="none" />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="line" iconSize={14} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <Card>
          <CardTitle sub="Décomposition brut / charges / net">Structure du coût</CardTitle>
          <div className="p-3 sm:p-5">
            <StatRow label="Salaire brut (mois)" value={FMT.currency(payroll.current?.brut || 0)} />
            <StatRow label="Charges patronales (≈ 21 %)" value={FMT.currency((payroll.current?.coutTotal || 0) - (payroll.current?.brut || 0))} />
            <StatRow label="Coût total employeur" value={FMT.currency(payroll.current?.coutTotal || 0)} accent="warn" />
            <StatRow label="Salaire net versé" value={FMT.currency(payroll.current?.net || 0)} accent="positive" />
            <StatRow label="Ratio net / brut" value={`${ratioNetBrut}%`} />
          </div>
        </Card>

        <Card>
          <CardTitle sub="Heures supplémentaires consommées (mois)">Heures sup.</CardTitle>
          <div className="p-3 sm:p-5">
            <ResponsiveContainer width="100%" height={200} minHeight={180}>
              <LineChart data={payroll.series} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="hsHeures" name="Heures sup." stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {Math.abs(payroll.deltaPct) > 5 && (
        <Insight
          kind={payroll.deltaPct > 0 ? "warn" : "neutral"}
          title={`Variation mensuelle ${payroll.deltaPct > 0 ? "à la hausse" : "à la baisse"}`}
          body={`La masse salariale brute a évolué de ${payroll.deltaPct > 0 ? "+" : ""}${payroll.deltaPct}% par rapport au mois précédent. Vérifier les recrutements, départs et primes exceptionnelles.`}
        />
      )}
    </div>
  );
}

// ── Axe Recrutement ────────────────────────────────────────────────────────

function AxeRecrutement({ dataset }: { dataset: ReturnType<typeof applyFilters> }) {
  const r = useMemo(() => computeRecruitment(dataset), [dataset]);

  const pipelineData = [
    { stage: "Postes", count: r.jobsTotal, fill: "#0f172a" },
    { stage: "Candidats", count: r.candidatesTotal, fill: "#475569" },
    { stage: "Recrutés", count: r.candidatesHired, fill: "#10b981" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <HeroKpi kicker="Postes ouverts" value={r.jobsOpen.toString()} sub={`${r.jobsTotal} au total`} />
        <HeroKpi kicker="Candidats" value={r.candidatesTotal.toString()} sub={`${r.candidatesHired} recrutés`} />
        <HeroKpi kicker="Fill rate" value={`${r.fillRate}%`} sub="Recrutements / postes" />
        <HeroKpi kicker="Délai moyen" value={`${r.avgHiringDays}j`} sub="Création du poste → recrutement" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <Card className="lg:col-span-2">
          <CardTitle sub="De l'ouverture du poste au recrutement effectif">Pipeline de recrutement</CardTitle>
          <div className="p-3 sm:p-5">
            <ResponsiveContainer width="100%" height={210} minHeight={180}>
              <BarChart data={pipelineData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" name="Volume" radius={[4, 4, 0, 0]}>
                  {pipelineData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle sub="Indicateurs qualitatifs">Qualité du sourcing</CardTitle>
          <div className="p-3 sm:p-5">
            <StatRow label="Score IA moyen" value={`${r.avgScoreIa}/100`} accent={r.avgScoreIa >= 70 ? "positive" : r.avgScoreIa >= 50 ? "warn" : "negative"} />
            <StatRow label="Taux de transformation" value={`${r.candidatesTotal === 0 ? 0 : Math.round((r.candidatesHired / r.candidatesTotal) * 1000) / 10}%`} />
            <StatRow label="Postes restants à pourvoir" value={(r.jobsTotal - r.candidatesHired).toString()} accent="warn" />
          </div>
        </Card>
      </div>

      {r.avgHiringDays > 60 && (
        <Insight
          kind="warn"
          title="Délai de recrutement élevé"
          body={`${r.avgHiringDays} jours en moyenne pour pourvoir un poste — au-delà de 60 jours, vérifier la définition du besoin, le canal de sourcing et la disponibilité des décisionnaires.`}
        />
      )}
      {r.fillRate < 40 && r.jobsTotal > 0 && (
        <Insight
          kind="negative"
          title="Faible taux de couverture"
          body={`Seulement ${r.fillRate}% des postes ont été pourvus. Repenser l'attractivité de l'offre et la qualité du pipeline candidats.`}
        />
      )}
    </div>
  );
}

// ── Axe Climat ─────────────────────────────────────────────────────────────

function AxeClimat({ dataset, refDate }: { dataset: ReturnType<typeof applyFilters>; refDate: Date }) {
  const abs = useMemo(() => computeAbsenteeism(dataset, refDate), [dataset, refDate]);
  const med = useMemo(() => computeMedical(dataset, refDate), [dataset, refDate]);
  const safety = useMemo(() => computeSafety(dataset, refDate), [dataset, refDate]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <HeroKpi
          kicker="Absentéisme (mois)"
          value={`${abs.rateMonth}%`}
          sub={`${abs.totalDaysMonth} jours non travaillés`}
        />
        <HeroKpi
          kicker="Conformité médicale"
          value={`${med.complianceRate}%`}
          sub={`${med.overdue} en retard · ${med.expiringSoon} sous 60j`}
        />
        <HeroKpi
          kicker="Accidents (cumul)"
          value={safety.count.toString()}
          sub={`${safety.joursPerdus}j d'arrêt cumulés`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <Card>
          <CardTitle sub="Causes d'absence — mois courant">Absentéisme par type</CardTitle>
          <div className="p-3 sm:p-5">
            {abs.byType.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">Aucune absence enregistrée ce mois</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={abs.byType} dataKey="days" nameKey="type" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={1}>
                    {abs.byType.map((_, i) => (
                      <Cell key={i} fill={["#0f172a", "#475569", "#f59e0b", "#f43f5e", "#10b981"][i % 5]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => `${Number(v)} j`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardTitle sub="Indicateurs sécurité">Détail sécurité</CardTitle>
          <div className="p-3 sm:p-5">
            <StatRow label="Accidents recensés" value={safety.count.toString()} accent={safety.count === 0 ? "positive" : "warn"} />
            <StatRow label="Jours d'arrêt" value={safety.joursPerdus.toString()} />
            <StatRow label="Taux de fréquence" value={safety.freqRate.toString()} sub="/M h" />
            <StatRow label="Taux de gravité" value={safety.severityRate.toString()} sub="/k h" />
            {safety.byGravity.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Par gravité</p>
                {safety.byGravity.map(g => (
                  <div key={g.gravite} className="flex justify-between text-xs py-1">
                    <span className="text-slate-600 capitalize">{g.gravite}</span>
                    <span className="text-slate-900 font-medium tabular-nums">{g.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {abs.rateMonth > 8 && (
        <Insight
          kind="negative"
          title="Absentéisme critique"
          body={`Le taux d'absentéisme est de ${abs.rateMonth}% ce mois — au-delà de 8%, prioriser une analyse RH (charge de travail, climat, encadrement).`}
        />
      )}
      {med.overdue > 0 && (
        <Insight
          kind="warn"
          title="Visites médicales à régulariser"
          body={`${med.overdue} visite(s) périodique(s) sont déjà échues. Risque de contestation prud'homale et obligation de moyens (Art. 41 CT-CI).`}
        />
      )}
    </div>
  );
}

// ── Axe Performance ────────────────────────────────────────────────────────

function AxePerformance({ dataset }: { dataset: ReturnType<typeof applyFilters> }) {
  const perf = useMemo(() => computePerformance(dataset), [dataset]);

  // Distribution simple : performance vs potentiel pour chaque catégorie (matrice 9-box simplifiée)
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <HeroKpi
          kicker="Évaluations validées"
          value={perf.validated.toString()}
          sub={`${perf.total - perf.validated} en cours / brouillon`}
        />
        <HeroKpi
          kicker="Score moyen"
          value={`${perf.avgScore}/5`}
          sub="Performance globale"
        />
        <HeroKpi
          kicker="Potentiel moyen"
          value={`${perf.avgPotential}/5`}
          sub="Capacité d'évolution"
        />
      </div>

      <Card>
        <CardTitle sub="Score moyen par catégorie professionnelle">Performance par catégorie</CardTitle>
        <div className="p-3 sm:p-5">
          {perf.byCategory.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">
              Aucune évaluation validée pour ce périmètre.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {perf.byCategory.map(c => {
                const pct = Math.round((c.avgScore / 5) * 100);
                const color = c.avgScore >= 4 ? "bg-emerald-500" : c.avgScore >= 3 ? "bg-slate-700" : c.avgScore >= 2 ? "bg-amber-500" : "bg-rose-500";
                return (
                  <li key={c.category} className="py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
                    <span className="flex-1 text-xs sm:text-sm text-slate-700 truncate min-w-0">{c.category}</span>
                    <span className="text-[10px] sm:text-xs text-slate-400 tabular-nums w-10 sm:w-14 text-right shrink-0">{c.count} év.</span>
                    <div className="hidden md:block flex-1 max-w-[200px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 tabular-nums w-10 sm:w-12 text-right shrink-0">{c.avgScore}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>

      {perf.validated === 0 && (
        <Insight
          kind="warn"
          title="Aucune évaluation validée"
          body="Lancer la campagne d'évaluation pour disposer d'un référentiel performance/potentiel exploitable."
        />
      )}
      {perf.validated > 0 && perf.avgScore < 3 && (
        <Insight
          kind="negative"
          title="Performance moyenne en alerte"
          body={`Le score global moyen (${perf.avgScore}/5) est en dessous du palier attendu. Examiner les plans d'amélioration et l'alignement objectifs/moyens.`}
        />
      )}
      {perf.avgPotential > perf.avgScore + 0.7 && perf.validated > 0 && (
        <Insight
          kind="positive"
          title="Potentiel sous-exploité"
          body={`Le potentiel moyen (${perf.avgPotential}/5) dépasse la performance actuelle (${perf.avgScore}/5). Opportunité d'accélérer la mobilité interne et la formation.`}
        />
      )}
    </div>
  );
}
