"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Download, ArrowUpRight } from "lucide-react";
import {
  calculerChargesPatronales,
  CHARGES_PATRONALES_TAUX,
  CMU_MENSUEL,
  SMIG_MENSUEL,
} from "@/lib/paie-ci";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface EmployeeSocialData {
  id: string;
  full_name: string;
  departement: string | null;
  categorie?: string | null;
  salaire_brut: number | null;
  sursalaire: number | null;
  prime_transport: number | null;
  prime_fonction: number | null;
  statut?: string | null;
}

interface Props { employees: EmployeeSocialData[] }

const fcfa = (n: number) =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(Math.round(n));

const fcfaCompact = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(0)} k`;
  return n.toString();
};

const TOOLTIP_STYLE = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: 12,
  padding: "8px 10px",
  boxShadow: "0 4px 12px -2px rgba(0,0,0,0.05)",
};

// ── Composants UI sobres ───────────────────────────────────────────────────

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

function KpiCard({
  label, value, sub, accent = "neutral",
}: {
  label: string; value: string; sub?: string;
  accent?: "neutral" | "positive" | "negative" | "warn" | "primary";
}) {
  const accentBar = {
    neutral: "bg-slate-200",
    positive: "bg-emerald-500",
    negative: "bg-rose-500",
    warn: "bg-amber-500",
    primary: "bg-slate-900",
  }[accent];
  return (
    <div className="relative rounded-lg border border-slate-200 bg-white p-3.5 sm:p-5">
      <div className={`absolute left-0 top-3.5 bottom-3.5 sm:top-5 sm:bottom-5 w-0.5 rounded-r ${accentBar}`} />
      <p className="text-[11px] sm:text-xs text-slate-500 font-medium">{label}</p>
      <p className="mt-1 sm:mt-1.5 text-lg sm:text-2xl font-semibold text-slate-900 tabular-nums leading-tight break-words">{value}</p>
      {sub && <p className="mt-1 text-[10px] sm:text-xs text-slate-500 leading-snug">{sub}</p>}
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────

const COLORS = ["#0f172a", "#475569", "#64748b", "#f59e0b", "#10b981", "#6366f1", "#f43f5e", "#8b5cf6"];

export function CompanySocialAnalysis({ employees }: Props) {
  const [departement, setDepartement] = useState("Tous");
  const [exporting, setExporting] = useState(false);

  const departements = useMemo(() => {
    const set = new Set<string>();
    for (const e of employees) set.add(e.departement || "Non défini");
    return ["Tous", ...Array.from(set).sort()];
  }, [employees]);

  const filtered = useMemo(() => {
    if (departement === "Tous") return employees;
    return employees.filter(e => (e.departement || "Non défini") === departement);
  }, [employees, departement]);

  const stats = useMemo(() => {
    let totalBrut = 0;
    let totalPatronal = 0;
    let totalChargeFamiliales = 0;
    let totalChargeMaternite = 0;
    let totalChargeRetraite = 0;
    let totalChargeAtMp = 0;
    let totalChargeCmu = 0;
    let totalChargeFdfp = 0;
    let totalChargeApprentissage = 0;

    const deptStats: Record<string, { count: number; totalBrut: number; totalPatronal: number }> = {};

    filtered.forEach((emp) => {
      const brut = (emp.salaire_brut || 0) + (emp.sursalaire || 0) + (emp.prime_fonction || 0);
      const charges = calculerChargesPatronales(brut);

      totalBrut += brut;
      totalPatronal += charges.total;
      totalChargeFamiliales += charges.familiales;
      totalChargeMaternite += charges.maternite;
      totalChargeRetraite += charges.retraite;
      totalChargeAtMp += charges.at_mp;
      totalChargeCmu += charges.cmu;
      totalChargeFdfp += charges.fdfp;
      totalChargeApprentissage += charges.apprentissage;

      const dept = emp.departement || "Non défini";
      if (!deptStats[dept]) deptStats[dept] = { count: 0, totalBrut: 0, totalPatronal: 0 };
      deptStats[dept].count += 1;
      deptStats[dept].totalBrut += brut;
      deptStats[dept].totalPatronal += charges.total;
    });

    const totalCost = totalBrut + totalPatronal;
    const avgCost = filtered.length > 0 ? totalCost / filtered.length : 0;
    const avgBrut = filtered.length > 0 ? totalBrut / filtered.length : 0;
    const ratioCharges = totalBrut > 0 ? (totalPatronal / totalBrut) * 100 : 0;

    const deptArray = Object.entries(deptStats)
      .map(([name, data]) => ({
        name,
        count: data.count,
        brut: data.totalBrut,
        charges: data.totalPatronal,
        total: data.totalBrut + data.totalPatronal,
        avg: data.count > 0 ? (data.totalBrut + data.totalPatronal) / data.count : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const chargesBreakdown = [
      { label: "Prestations familiales", value: totalChargeFamiliales, rate: CHARGES_PATRONALES_TAUX.familiales * 100, scope: "Sans plafond" },
      { label: "Maternité",              value: totalChargeMaternite,  rate: CHARGES_PATRONALES_TAUX.maternite * 100,  scope: "Sans plafond" },
      { label: "Retraite",               value: totalChargeRetraite,   rate: CHARGES_PATRONALES_TAUX.retraite * 100,   scope: "Plafond 3 375 000 FCFA" },
      { label: "Accidents travail / MP", value: totalChargeAtMp,       rate: CHARGES_PATRONALES_TAUX.at_mp * 100,      scope: "Taux moyen — variable secteur" },
      { label: "CMU patronale",          value: totalChargeCmu,        rate: 0,                                         scope: `Forfait ${fcfa(CMU_MENSUEL)}/sal.` },
      { label: "FDFP — formation",       value: totalChargeFdfp,       rate: CHARGES_PATRONALES_TAUX.fdfp * 100,       scope: "Sans plafond" },
      { label: "Taxe apprentissage",     value: totalChargeApprentissage, rate: CHARGES_PATRONALES_TAUX.apprentissage * 100, scope: "Sans plafond" },
    ];

    return {
      totalBrut, totalPatronal, totalCost, avgCost, avgBrut, ratioCharges,
      count: filtered.length,
      deptArray, chargesBreakdown,
    };
  }, [filtered]);

  async function handleExport() {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const today = new Date().toLocaleDateString("fr-CI");
      doc.setFontSize(14);
      doc.text("Finance & Data RH — Rapport", 14, 16);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Édition du ${today} — Périmètre : ${departement} (${stats.count} salariés)`, 14, 22);

      autoTable(doc, {
        startY: 28,
        head: [["Indicateur", "Valeur"]],
        body: [
          ["Masse salariale brute", fcfa(stats.totalBrut)],
          ["Charges patronales totales", fcfa(stats.totalPatronal)],
          ["Coût total employeur (TCO)", fcfa(stats.totalCost)],
          ["Coût moyen / salarié", fcfa(stats.avgCost)],
          ["Brut moyen / salarié", fcfa(stats.avgBrut)],
          ["Ratio charges / brut", `${stats.ratioCharges.toFixed(1)} %`],
          ["Multiple SMIG (coût moyen)", `${(stats.avgCost / SMIG_MENSUEL).toFixed(1)} ×`],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [15, 23, 42] },
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 8,
        head: [["Charge patronale", "Taux", "Montant", "Périmètre"]],
        body: stats.chargesBreakdown.map(c => [
          c.label,
          c.rate > 0 ? `${c.rate.toFixed(2)} %` : "Forfait",
          fcfa(c.value),
          c.scope,
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [71, 85, 105] },
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 8,
        head: [["Département", "Effectif", "Brut", "Charges", "TCO", "Poids"]],
        body: stats.deptArray.map(d => [
          d.name,
          d.count.toString(),
          fcfa(d.brut),
          fcfa(d.charges),
          fcfa(d.total),
          stats.totalCost > 0 ? `${((d.total / stats.totalCost) * 100).toFixed(1)} %` : "—",
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [71, 85, 105] },
      });

      doc.save(`finance-data-rh-${today.replace(/\//g, "-")}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  if (employees.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-sm font-medium text-slate-700">Aucune donnée disponible</p>
        <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto">
          Ajoutez des employés actifs avec leurs salaires pour générer les analyses Finance & Data.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-4 sm:gap-5 pb-4 border-b border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">Pilotage masse salariale</p>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">Finance &amp; Data RH</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-1.5 leading-snug">
              Décomposition de la masse salariale, charges patronales CI et coût total employeur.
              <span className="text-slate-700 font-medium block sm:inline sm:ml-1">· {stats.count} salarié{stats.count > 1 ? "s" : ""} actif{stats.count > 1 ? "s" : ""}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <select
              value={departement}
              onChange={e => setDepartement(e.target.value)}
              className="h-9 flex-1 sm:flex-none rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            >
              {departements.map(d => <option key={d} value={d}>{d === "Tous" ? "Tous départements" : d}</option>)}
            </select>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="h-9 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{exporting ? "Export…" : "Exporter PDF"}</span>
              <span className="sm:hidden">{exporting ? "…" : "PDF"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── KPI ─────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <KpiCard
          label="Masse salariale brute"
          value={fcfa(stats.totalBrut)}
          sub={`Brut moyen ${fcfa(stats.avgBrut)}`}
          accent="neutral"
        />
        <KpiCard
          label="Charges patronales"
          value={fcfa(stats.totalPatronal)}
          sub={`${stats.ratioCharges.toFixed(1)} % du brut`}
          accent="warn"
        />
        <KpiCard
          label="Coût total employeur"
          value={fcfa(stats.totalCost)}
          sub="Brut + charges patronales"
          accent="primary"
        />
        <KpiCard
          label="Coût moyen / salarié"
          value={fcfa(stats.avgCost)}
          sub={`${(stats.avgCost / SMIG_MENSUEL).toFixed(1)} × SMIG`}
          accent="positive"
        />
      </section>

      {/* ── Décomposition charges patronales ────────────────────────── */}
      <section>
        <Card>
          <CardTitle sub="Détail des cotisations patronales — Code de Sécurité Sociale CI">
            Décomposition des charges patronales
          </CardTitle>
          <div className="px-4 sm:px-5 py-4 sm:py-5">
            {/* Vue desktop : tableau */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 font-medium border-b border-slate-100">
                  <tr>
                    <th className="text-left py-2 pr-3">Cotisation</th>
                    <th className="text-right px-3 py-2">Taux</th>
                    <th className="text-left px-3 py-2">Périmètre</th>
                    <th className="text-right px-3 py-2">Montant</th>
                    <th className="text-right pl-3 py-2 w-[120px]">Part</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.chargesBreakdown.map((c, i) => {
                    const pct = stats.totalPatronal > 0 ? (c.value / stats.totalPatronal) * 100 : 0;
                    return (
                      <tr key={c.label} className="hover:bg-slate-50/60">
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2.5">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-slate-700 font-medium">{c.label}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                          {c.rate > 0 ? `${c.rate.toFixed(2)} %` : <span className="text-slate-400">forfait</span>}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-500">{c.scope}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-medium text-slate-900">{fcfa(c.value)}</td>
                        <td className="pl-3 py-2.5">
                          <div className="flex items-center gap-2 justify-end">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-700 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-slate-500 tabular-nums w-9 text-right">{pct.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t border-slate-100">
                  <tr>
                    <td className="py-2.5 pr-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Total</td>
                    <td colSpan={2}></td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-slate-900">{fcfa(stats.totalPatronal)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Vue mobile : cards */}
            <ul className="md:hidden space-y-2.5">
              {stats.chargesBreakdown.map((c, i) => {
                const pct = stats.totalPatronal > 0 ? (c.value / stats.totalPatronal) * 100 : 0;
                return (
                  <li key={c.label} className="rounded-md border border-slate-100 p-3">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm font-medium text-slate-900 truncate">{c.label}</span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-slate-900 shrink-0">{fcfa(c.value)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="tabular-nums">{c.rate > 0 ? `${c.rate.toFixed(2)} %` : "forfait"}</span>
                      <span>·</span>
                      <span className="truncate">{c.scope}</span>
                      <span className="ml-auto tabular-nums shrink-0">{pct.toFixed(0)}%</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>
      </section>

      {/* ── Visualisations ──────────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <Card className="lg:col-span-1">
          <CardTitle sub="Répartition par département">TCO par département</CardTitle>
          <div className="p-3 sm:p-5">
            <ResponsiveContainer width="100%" height={260} minHeight={220}>
              <PieChart>
                <Pie
                  data={stats.deptArray}
                  dataKey="total"
                  nameKey="name"
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={90}
                  paddingAngle={1}
                >
                  {stats.deptArray.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => fcfa(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle sub="Brut vs charges patronales — par département">Comparatif structurel</CardTitle>
          <div className="p-3 sm:p-5">
            <ResponsiveContainer width="100%" height={260} minHeight={220}>
              <BarChart data={stats.deptArray} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                <YAxis tickFormatter={(v) => fcfaCompact(Number(v))} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => fcfa(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="square" iconSize={10} />
                <Bar dataKey="brut" name="Salaire brut" fill="#0f172a" radius={[3, 3, 0, 0]} />
                <Bar dataKey="charges" name="Charges patronales" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {/* ── Détail par département ──────────────────────────────────── */}
      <section>
        <Card>
          <CardTitle sub={`Effectif consolidé · TCO ${fcfa(stats.totalCost)}`}>Détail par département</CardTitle>

          {/* Vue desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                <tr>
                  <th className="text-left px-5 py-3">Département</th>
                  <th className="text-right px-3 py-3">Effectif</th>
                  <th className="text-right px-3 py-3">Brut</th>
                  <th className="text-right px-3 py-3">Charges</th>
                  <th className="text-right px-3 py-3">TCO</th>
                  <th className="text-right px-3 py-3">Coût moyen</th>
                  <th className="text-right pl-3 pr-5 py-3">Poids</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.deptArray.map(d => {
                  const pct = stats.totalCost > 0 ? (d.total / stats.totalCost) * 100 : 0;
                  return (
                    <tr key={d.name} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3 text-slate-700 font-medium">{d.name}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">{d.count}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">{fcfa(d.brut)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-amber-700">{fcfa(d.charges)}</td>
                      <td className="px-3 py-3 text-right tabular-nums font-semibold text-slate-900">{fcfa(d.total)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-600">{fcfa(d.avg)}</td>
                      <td className="pl-3 pr-5 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-700 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-slate-500 tabular-nums w-10 text-right">{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50/40 border-t border-slate-100">
                <tr>
                  <td className="px-5 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Total</td>
                  <td className="px-3 py-3 text-right tabular-nums font-medium">{stats.count}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-medium">{fcfa(stats.totalBrut)}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-medium text-amber-700">{fcfa(stats.totalPatronal)}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-semibold text-slate-900">{fcfa(stats.totalCost)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{fcfa(stats.avgCost)}</td>
                  <td className="pl-3 pr-5 py-3 text-right text-xs text-slate-500">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Vue mobile */}
          <ul className="md:hidden divide-y divide-slate-100">
            {stats.deptArray.map(d => {
              const pct = stats.totalCost > 0 ? (d.total / stats.totalCost) * 100 : 0;
              return (
                <li key={d.name} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900 truncate">{d.name}</p>
                    <span className="text-xs text-slate-400 tabular-nums shrink-0">{d.count} sal.</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-3 text-xs">
                    <span className="text-slate-500">Brut</span>
                    <span className="tabular-nums text-slate-700">{fcfa(d.brut)}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="text-slate-500">Charges</span>
                    <span className="tabular-nums text-amber-700">{fcfa(d.charges)}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 text-xs mt-1 pt-1 border-t border-slate-100">
                    <span className="font-medium text-slate-700">TCO</span>
                    <span className="tabular-nums font-semibold text-slate-900">{fcfa(d.total)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-700 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500 tabular-nums shrink-0">{pct.toFixed(1)}%</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      {/* ── Lexique + Pistes d'optimisation ─────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <Card>
          <CardTitle sub="Définition des indicateurs">Lexique</CardTitle>
          <div className="p-4 sm:p-5 space-y-3">
            {[
              { term: "Masse salariale brute", def: "Salaires de base + sursalaires + primes soumises (ancienneté, fonction) avant retenues sociales et fiscales." },
              { term: "Charges patronales", def: "Cotisations versées par l'employeur : CNPS (familiales 5 %, maternité 0,75 %, retraite 7,7 %, AT/MP), CMU patronale, FDFP 1,2 %, taxe d'apprentissage 0,4 %." },
              { term: "Coût total employeur (TCO)", def: "Coût réel sortant : masse salariale brute + charges patronales. Indicateur de référence pour le pilotage budgétaire." },
              { term: "Multiple SMIG", def: "Coût moyen / salarié rapporté au SMIG mensuel (75 000 FCFA, Décret n° 2022-986)." },
            ].map(({ term, def }) => (
              <div key={term} className="border-l-2 border-slate-100 pl-3">
                <p className="text-sm font-medium text-slate-900">{term}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{def}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle sub="Cohérence légale et marges d'optimisation">Pistes de pilotage</CardTitle>
          <div className="p-4 sm:p-5 space-y-3">
            <Tip
              kind="positive"
              title="Indemnité de transport non imposable"
              body="Jusqu'au plafond légal, l'indemnité de transport échappe à l'ITS et aux cotisations sociales. Vérifier sa juste affectation pour optimiser le ratio brut / net."
            />
            <Tip
              kind="positive"
              title="Crédits FDFP — formation professionnelle"
              body="Les cotisations FDFP (1,2 %) ouvrent droit à une récupération sous forme de crédits formation. Les solliciter permet de réduire le coût net annuel."
            />
            <Tip
              kind="warn"
              title="Plafond CNPS retraite"
              body="La cotisation retraite est plafonnée à 45 × SMIG (3 375 000 FCFA/mois). Les hauts salaires bénéficient mécaniquement d'un ratio charges / brut plus faible."
            />
            <Tip
              kind="neutral"
              title="Taux AT/MP variable"
              body="Le taux Accidents du travail / Maladies professionnelles dépend du secteur d'activité. Le taux retenu ici (3 %) est un taux moyen indicatif — confirmer auprès de la CNPS."
            />
          </div>
        </Card>
      </section>
    </div>
  );
}

function Tip({ kind, title, body }: { kind: "positive" | "warn" | "neutral" | "negative"; title: string; body: string }) {
  const style = {
    positive: "border-emerald-200 bg-emerald-50/60 text-emerald-900",
    warn: "border-amber-200 bg-amber-50/60 text-amber-900",
    neutral: "border-slate-200 bg-slate-50 text-slate-900",
    negative: "border-rose-200 bg-rose-50/60 text-rose-900",
  }[kind];
  return (
    <div className={`rounded-md border px-3.5 py-3 ${style}`}>
      <div className="flex items-start gap-2">
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-70" />
        <div className="min-w-0">
          <p className="text-xs font-semibold">{title}</p>
          <p className="text-xs mt-1 opacity-80 leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  );
}
