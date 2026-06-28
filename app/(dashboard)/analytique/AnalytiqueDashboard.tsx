"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, ArrowDownRight, Download,
  Users, Wallet, TrendingUp, HeartPulse, Briefcase, Calendar,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, LineChart, Line, Legend,
} from "recharts";
import {
  applyFilters, computeEffectif, computeAgePyramid, computePayroll,
  computeTurnover, computeAbsenteeism, computeMedical, computeRecruitment,
  computeSafety, listDepartments, listCategories, listYears, getReferenceDate,
  MONTH_LABELS, FMT,
  type RhEmployee, type RhBulletin, type RhContract, type RhConge, type RhMedical,
  type RhJob, type RhCandidate, type RhEvaluation, type RhAccident,
} from "@/lib/analytics-rh";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

// ── Composants UI sobres ───────────────────────────────────────────────────

function SectionHeader({ kicker, title, action }: {
  kicker?: string; title: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-4 mb-4 sm:mb-5">
      <div>
        {kicker && <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium mb-1">{kicker}</p>}
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function Kpi({
  label, value, sub, icon, trend, accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  trend?: { delta: number; suffix?: string };
  accent?: "neutral" | "positive" | "negative" | "warn";
}) {
  const trendColor = !trend ? "" :
    trend.delta > 0 ? "text-emerald-600" :
    trend.delta < 0 ? "text-rose-600" : "text-slate-400";
  const TrendIcon = trend && trend.delta > 0 ? ArrowUpRight : trend && trend.delta < 0 ? ArrowDownRight : null;

  const accentBar = {
    neutral: "bg-slate-200",
    positive: "bg-emerald-500",
    negative: "bg-rose-500",
    warn: "bg-amber-500",
  }[accent || "neutral"];

  return (
    <div className="relative rounded-lg border border-slate-200 bg-white p-3.5 sm:p-5 hover:border-slate-300 transition-colors">
      <div className={`absolute left-0 top-3.5 bottom-3.5 sm:top-5 sm:bottom-5 w-0.5 rounded-r ${accentBar}`} />
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-tight">{label}</p>
          <p className="mt-1 sm:mt-1.5 text-lg sm:text-2xl font-semibold text-slate-900 tabular-nums leading-tight break-words">{value}</p>
          {sub && <p className="mt-1 text-[10px] sm:text-xs text-slate-500 leading-snug line-clamp-2">{sub}</p>}
        </div>
        {icon && <div className="text-slate-300 hidden sm:block shrink-0">{icon}</div>}
      </div>
      {trend && TrendIcon && (
        <div className={`mt-2 sm:mt-3 inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium ${trendColor}`}>
          <TrendIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span className="tabular-nums">{Math.abs(trend.delta).toFixed(1)}%{trend.suffix || ""}</span>
          <span className="text-slate-400 font-normal">vs M-1</span>
        </div>
      )}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white ${className}`}>
      {children}
    </div>
  );
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

function SegmentedYear({ value, onChange, years }: {
  value: number | null; onChange: (v: number | null) => void; years: number[];
}) {
  // On limite à 4 années récentes + bouton "Toutes". Si plus, dropdown.
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

function SegmentBtn({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
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

const TOOLTIP_STYLE = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: 12,
  padding: "8px 10px",
  boxShadow: "0 4px 12px -2px rgba(0,0,0,0.05)",
};

// ── Composant principal ────────────────────────────────────────────────────

export function AnalytiqueDashboard(props: Props) {
  const [departement, setDepartement] = useState("Tous");
  const [categorie, setCategorie] = useState("Tous");
  const [annee, setAnnee] = useState<number | null>(null);  // null = toutes
  const [mois, setMois] = useState<number | null>(null);    // null = tous
  const [exporting, setExporting] = useState(false);

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

  const effectif = useMemo(() => computeEffectif(filtered, refDate), [filtered, refDate]);
  const ageData = useMemo(() => computeAgePyramid(filtered, refDate), [filtered, refDate]);
  const payroll = useMemo(() => computePayroll(filtered, refDate), [filtered, refDate]);
  const turnover = useMemo(() => computeTurnover(filtered, refDate), [filtered, refDate]);
  const absenteeism = useMemo(() => computeAbsenteeism(filtered, refDate), [filtered, refDate]);
  const medicalKpi = useMemo(() => computeMedical(filtered, refDate), [filtered, refDate]);
  const recruitment = useMemo(() => computeRecruitment(filtered), [filtered]);
  const safety = useMemo(() => computeSafety(filtered, refDate), [filtered, refDate]);

  const periodLabel = useMemo(() => {
    if (annee && mois) return `${MONTH_LABELS[mois - 1]} ${annee}`;
    if (annee) return `Année ${annee}`;
    return "12 mois glissants";
  }, [annee, mois]);

  const isFiltered = departement !== "Tous" || categorie !== "Tous" || annee !== null || mois !== null;
  const resetFilters = () => {
    setDepartement("Tous"); setCategorie("Tous"); setAnnee(null); setMois(null);
  };

  // Pyramide : Hommes en valeurs négatives pour affichage symétrique
  const pyramidData = useMemo(
    () => ageData.pyramid.map(b => ({ ...b, Hommes: -b.Hommes })),
    [ageData.pyramid]
  );

  async function handleExportPdf() {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const today = new Date().toLocaleDateString("fr-CI");
      doc.setFontSize(14);
      doc.text("Rapport Analytique RH", 14, 16);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Édition du ${today} — Filtre département : ${departement} / catégorie : ${categorie}`, 14, 22);

      autoTable(doc, {
        startY: 28,
        head: [["Indicateur", "Valeur"]],
        body: [
          ["Effectif actif", String(effectif.actifs)],
          ["Entrées (année)", String(effectif.entriesYear)],
          ["Départs (année)", String(effectif.departuresYear)],
          ["Turnover annuel", `${turnover.rateYear}%`],
          ["Masse salariale (mois)", FMT.currency(payroll.current?.brut || 0)],
          ["Coût total employeur (mois)", FMT.currency(payroll.current?.coutTotal || 0)],
          ["Absentéisme (mois)", `${absenteeism.rateMonth}%`],
          ["Conformité médicale", `${medicalKpi.complianceRate}%`],
          ["Postes ouverts", String(recruitment.jobsOpen)],
          ["Accidents (cumul)", String(safety.count)],
          ["Jours d'arrêt", String(safety.joursPerdus)],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [15, 23, 42] },
      });

      doc.save(`analytique-rh-${today.replace(/\//g, "-")}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1400px] mx-auto">
      {/* ── Header + filtres ─────────────────────────────────────────── */}
      <header className="flex flex-col gap-4 sm:gap-5 pb-4 border-b border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">Vue d'ensemble</p>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">Analytique RH</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-1.5 leading-snug">
              <span className="hidden sm:inline">Synthèse consolidée des indicateurs sociaux, financiers et de performance.</span>
              <span className="sm:hidden">Indicateurs RH consolidés.</span>
              <span className="text-slate-700 font-medium block sm:inline sm:ml-1">· {periodLabel}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="h-9 flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? "Export..." : "Exporter"}
            </button>
            <Link
              href="/analytique/focus"
              className="h-9 flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800"
            >
              <span className="sm:hidden">Focus</span>
              <span className="hidden sm:inline">Focus stratégique</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Barre de filtres */}
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

      {/* ── KPI cards (6) ───────────────────────────────────────────── */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <Kpi
          label="Effectif actif"
          value={effectif.actifs.toString()}
          sub={`${effectif.entriesYear} entrées · ${effectif.departuresYear} départs (année)`}
          icon={<Users className="h-5 w-5" />}
          accent="neutral"
        />
        <Kpi
          label="Masse salariale"
          value={FMT.currency(payroll.current?.brut || 0)}
          sub={`Coût total ${FMT.currency(payroll.current?.coutTotal || 0)}`}
          icon={<Wallet className="h-5 w-5" />}
          trend={{ delta: payroll.deltaPct }}
          accent="positive"
        />
        <Kpi
          label="Turnover (annuel)"
          value={`${turnover.rateYear}%`}
          sub={`${turnover.departuresYear} départs / effectif moyen`}
          icon={<TrendingUp className="h-5 w-5" />}
          accent={turnover.rateYear > 15 ? "negative" : turnover.rateYear > 8 ? "warn" : "positive"}
        />
        <Kpi
          label="Absentéisme (mois)"
          value={`${absenteeism.rateMonth}%`}
          sub={`${absenteeism.totalDaysMonth}j sur 22j théoriques`}
          icon={<Calendar className="h-5 w-5" />}
          accent={absenteeism.rateMonth > 8 ? "negative" : absenteeism.rateMonth > 4 ? "warn" : "positive"}
        />
        <Kpi
          label="Conformité médicale"
          value={`${medicalKpi.complianceRate}%`}
          sub={`${medicalKpi.overdue} en retard · ${medicalKpi.expiringSoon} <60j`}
          icon={<HeartPulse className="h-5 w-5" />}
          accent={medicalKpi.complianceRate < 70 ? "negative" : medicalKpi.complianceRate < 90 ? "warn" : "positive"}
        />
        <Kpi
          label="Postes ouverts"
          value={recruitment.jobsOpen.toString()}
          sub={`${recruitment.candidatesTotal} candidats · ${recruitment.candidatesHired} recrutés`}
          icon={<Briefcase className="h-5 w-5" />}
          accent="neutral"
        />
      </section>

      {/* ── Masse salariale 12 mois ─────────────────────────────────── */}
      <section>
        <SectionHeader kicker="Trésorerie sociale" title="Évolution de la masse salariale" />
        <Card>
          <CardTitle sub="Brut, net et coût total employeur (charges patronales 21 %) sur 12 mois">
            Masse salariale — 12 derniers mois
          </CardTitle>
          <div className="px-3 sm:px-5 py-4 sm:py-5">
            <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-5 pb-4 sm:pb-5 border-b border-slate-100">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-slate-500 truncate">Mois — brut</p>
                <p className="text-sm sm:text-lg font-semibold text-slate-900 tabular-nums mt-0.5 break-words">
                  {FMT.currency(payroll.current?.brut || 0)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-slate-500 truncate">YTD cumulé</p>
                <p className="text-sm sm:text-lg font-semibold text-slate-900 tabular-nums mt-0.5 break-words">
                  {FMT.currency(payroll.ytdBrut)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-slate-500 truncate">Moyen / sal.</p>
                <p className="text-sm sm:text-lg font-semibold text-slate-900 tabular-nums mt-0.5 break-words">
                  {FMT.currency(payroll.averageBrutPerEmployee)}
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220} minHeight={180}>
              <AreaChart data={payroll.series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-brut" x1="0" y1="0" x2="0" y2="1">
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
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v) => FMT.currency(Number(v))}
                />
                <Area type="monotone" dataKey="coutTotal" name="Coût total" stroke="#94a3b8" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="brut" name="Salaire brut" stroke="#0f172a" strokeWidth={2} fill="url(#grad-brut)" />
                <Area type="monotone" dataKey="net" name="Salaire net" stroke="#10b981" strokeWidth={1.5} fill="none" />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="line" iconSize={14} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {/* ── 2 col : Turnover + Pyramide ─────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <Card>
          <CardTitle sub="Entrées vs sorties mensuelles">Mouvements d'effectif</CardTitle>
          <div className="p-3 sm:p-5">
            <div className="flex gap-3 sm:gap-6 mb-4 pb-4 border-b border-slate-100">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-slate-500">Entrées</p>
                <p className="text-base sm:text-xl font-semibold text-emerald-600 tabular-nums mt-0.5">{turnover.entriesYear}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-slate-500">Sorties</p>
                <p className="text-base sm:text-xl font-semibold text-rose-600 tabular-nums mt-0.5">{turnover.departuresYear}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-slate-500">Turnover</p>
                <p className="text-base sm:text-xl font-semibold text-slate-900 tabular-nums mt-0.5">{turnover.rateYear}%</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200} minHeight={160}>
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

        <Card>
          <CardTitle sub={`Âge moyen ${ageData.averageAge} ans · parité F ${effectif.parityRate}%`}>
            Pyramide des âges
          </CardTitle>
          <div className="p-3 sm:p-5">
            <ResponsiveContainer width="100%" height={240} minHeight={200}>
              <BarChart data={pyramidData} layout="vertical" stackOffset="sign" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => Math.abs(v).toString()}
                  tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false}
                />
                <YAxis dataKey="range" type="category" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={50} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v, name) => [`${Math.abs(Number(v))} pers.`, String(name)]}
                />
                <Bar dataKey="Hommes" stackId="x" fill="#475569" radius={[0, 0, 0, 3]} />
                <Bar dataKey="Femmes" stackId="x" fill="#0d9488" radius={[0, 3, 3, 0]} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="square" iconSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {/* ── Composition organisationnelle ───────────────────────────── */}
      <section>
        <SectionHeader kicker="Organisation" title="Répartition de l'effectif" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <Card>
            <CardTitle sub="Top départements (effectif actif)">Par département</CardTitle>
            <div className="px-3 sm:px-5 pb-4 sm:pb-5">
              {effectif.byDepartment.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">Aucune donnée</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {effectif.byDepartment.slice(0, 8).map((d) => {
                    const pct = effectif.actifs === 0 ? 0 : Math.round((d.count / effectif.actifs) * 100);
                    return (
                      <li key={d.name} className="py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
                        <span className="flex-1 text-xs sm:text-sm text-slate-700 truncate min-w-0">{d.name}</span>
                        <div className="hidden sm:block flex-1 max-w-[180px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-700 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 tabular-nums w-8 sm:w-10 text-right shrink-0">{d.count}</span>
                        <span className="text-[10px] sm:text-xs text-slate-400 tabular-nums w-9 sm:w-12 text-right shrink-0">{pct}%</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>

          <Card>
            <CardTitle sub="Catégories socio-professionnelles">Par catégorie</CardTitle>
            <div className="px-3 sm:px-5 pb-4 sm:pb-5">
              {effectif.byCategory.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">Aucune donnée</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {effectif.byCategory.map((c) => {
                    const pct = effectif.actifs === 0 ? 0 : Math.round((c.count / effectif.actifs) * 100);
                    return (
                      <li key={c.name} className="py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
                        <span className="flex-1 text-xs sm:text-sm text-slate-700 truncate min-w-0">{c.name}</span>
                        <div className="hidden sm:block flex-1 max-w-[180px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-700 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 tabular-nums w-8 sm:w-10 text-right shrink-0">{c.count}</span>
                        <span className="text-[10px] sm:text-xs text-slate-400 tabular-nums w-9 sm:w-12 text-right shrink-0">{pct}%</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* ── Risques & conformité ────────────────────────────────────── */}
      <section>
        <SectionHeader kicker="Risques & conformité" title="Indicateurs sociaux et sécurité" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          <Card>
            <CardTitle sub="Mois en cours">Absentéisme</CardTitle>
            <div className="p-4 sm:p-5">
              <p className="text-2xl sm:text-3xl font-semibold text-slate-900 tabular-nums">{absenteeism.rateMonth}%</p>
              <p className="text-xs text-slate-500 mt-1">{absenteeism.totalDaysMonth} jours non travaillés</p>
              <div className="mt-4 space-y-2">
                {absenteeism.byType.length === 0 ? (
                  <p className="text-xs text-slate-400">Aucune absence ce mois</p>
                ) : absenteeism.byType.map(t => (
                  <div key={t.type} className="flex justify-between text-xs">
                    <span className="text-slate-600 capitalize">{t.type.replace(/_/g, " ")}</span>
                    <span className="text-slate-900 font-medium tabular-nums">{t.days}j</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle sub="Visites médicales">Conformité médicale</CardTitle>
            <div className="p-4 sm:p-5">
              <p className="text-2xl sm:text-3xl font-semibold text-slate-900 tabular-nums">{medicalKpi.complianceRate}%</p>
              <p className="text-xs text-slate-500 mt-1">salariés actifs à jour</p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-amber-600">Expirent &lt; 60 jours</span>
                  <span className="font-medium tabular-nums">{medicalKpi.expiringSoon}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-rose-600">En retard</span>
                  <span className="font-medium tabular-nums">{medicalKpi.overdue}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle sub="Cumul historique">Sécurité au travail</CardTitle>
            <div className="p-4 sm:p-5">
              <p className="text-2xl sm:text-3xl font-semibold text-slate-900 tabular-nums">{safety.count}</p>
              <p className="text-xs text-slate-500 mt-1">accidents · {safety.joursPerdus} jours d'arrêt</p>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Taux fréquence (/M h)</span>
                  <span className="font-medium tabular-nums">{safety.freqRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Taux gravité (/k h)</span>
                  <span className="font-medium tabular-nums">{safety.severityRate}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ── Footer link ─────────────────────────────────────────────── */}
      <section className="pt-2 pb-8">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Pilotage stratégique par axe</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">
              Talent · Recrutement · Rémunération · Climat · Formation — vues détaillées par axe.
            </p>
          </div>
          <Link
            href="/analytique/focus"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 h-9 text-sm font-medium text-white hover:bg-slate-800 transition-colors w-full md:w-auto"
          >
            Ouvrir Focus stratégique <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
