"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  calculerChargesPatronales,
  CHARGES_PATRONALES_TAUX,
  SMIG_MENSUEL,
} from "@/lib/paie-ci";
import {
  TrendingUp,
  Users,
  DollarSign,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  FileDown,
  ChevronRight,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface EmployeeSocialData {
  id: string;
  full_name: string;
  departement: string | null;
  salaire_brut: number | null;
  sursalaire: number | null;
  prime_transport: number | null;
  prime_fonction: number | null;
}

interface CompanySocialAnalysisProps {
  employees: EmployeeSocialData[];
}

const COLORS = ["#0ea5e9", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981"];

const fcfa = (n: number) =>
  new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(Math.round(n));

export function CompanySocialAnalysis({ employees }: CompanySocialAnalysisProps) {
  const [isExporting, setIsExporting] = useState(false);

  const stats = useMemo(() => {
    let totalBrut = 0;
    let totalPatronal = 0;
    const deptStats: Record<string, { count: number; totalBrut: number; totalPatronal: number }> = {};

    employees.forEach((emp) => {
      const brut = (emp.salaire_brut || 0) + (emp.sursalaire || 0) + (emp.prime_fonction || 0);
      const charges = calculerChargesPatronales(brut);
      
      totalBrut += brut;
      totalPatronal += charges.total;

      const dept = emp.departement || "Non défini";
      if (!deptStats[dept]) {
        deptStats[dept] = { count: 0, totalBrut: 0, totalPatronal: 0 };
      }
      deptStats[dept].count += 1;
      deptStats[dept].totalBrut += brut;
      deptStats[dept].totalPatronal += charges.total;
    });

    const totalCost = totalBrut + totalPatronal;
    const avgCost = employees.length > 0 ? totalCost / employees.length : 0;

    const chartData = Object.entries(deptStats).map(([name, data]) => ({
      name,
      value: data.totalBrut + data.totalPatronal,
      brut: data.totalBrut,
      charges: data.totalPatronal,
    })).sort((a, b) => b.value - a.value);

    return {
      totalBrut,
      totalPatronal,
      totalCost,
      avgCost,
      deptStats: Object.entries(deptStats).sort((a, b) => b[1].totalBrut - a[1].totalBrut),
      chartData,
    };
  }, [employees]);

  const exportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const date = new Date().toLocaleDateString("fr-CI");

      // Add header
      doc.setFontSize(20);
      doc.setTextColor(14, 165, 233); // Primary color
      doc.text("RAPPORT D'ANALYSE SOCIALE", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Généré le ${date}`, 14, 30);
      doc.text(`RH Manager CI - Audit Social`, 14, 35);

      // Summary
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Résumé Financier", 14, 50);

      autoTable(doc, {
        startY: 55,
        head: [["Indicateur", "Valeur"]],
        body: [
          ["Masse Salariale Totale (Brut)", fcfa(stats.totalBrut)],
          ["Charges Patronales Totales", fcfa(stats.totalPatronal)],
          ["Coût Total Employeur (TCO)", fcfa(stats.totalCost)],
          ["Coût Moyen par Salarié", fcfa(stats.avgCost)],
          ["Nombre d'Employés", employees.length.toString()],
        ],
        theme: "striped",
        headStyles: { fillColor: [14, 165, 233] },
      });

      // Dept details
      doc.text("Répartition par Département", 14, (doc as any).lastAutoTable.finalY + 15);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [["Département", "Effectif", "Brut", "Charges", "TCO"]],
        body: stats.deptStats.map(([name, data]) => [
          name,
          data.count,
          fcfa(data.totalBrut),
          fcfa(data.totalPatronal),
          fcfa(data.totalBrut + data.totalPatronal),
        ]),
        headStyles: { fillColor: [100, 116, 139] },
      });

      doc.save(`analyse_sociale_${date.replace(/\//g, "-")}.pdf`);
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border-2 border-primary/5 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Tableau de Bord Financier RH
          </h2>
          <p className="text-sm text-muted-foreground">Données basées sur {employees.length} employés actifs</p>
        </div>
        <Button 
          onClick={exportPDF} 
          disabled={isExporting}
          className="bg-primary hover:bg-primary/90 text-white font-bold"
        >
          <FileDown className="mr-2 h-4 w-4" />
          {isExporting ? "Génération..." : "Exporter le Rapport PDF"}
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-primary/10 shadow-sm hover:shadow-md transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Brut Total
            </CardTitle>
            <div className="rounded-xl bg-primary/10 p-2 group-hover:scale-110 transition-transform">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight">{fcfa(stats.totalBrut)}</div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              Salaires + Primes soumises
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/10 shadow-sm hover:shadow-md transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Charges Patronales
            </CardTitle>
            <div className="rounded-xl bg-amber-100 p-2 group-hover:scale-110 transition-transform">
              <Activity className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight">{fcfa(stats.totalPatronal)}</div>
            <p className="text-[10px] text-amber-600 mt-1 uppercase font-bold">
              {stats.totalBrut > 0 ? ((stats.totalPatronal / stats.totalBrut) * 100).toFixed(1) : 0}% du brut total
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-800 bg-slate-900 text-white shadow-xl group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <TrendingUp className="h-24 w-24" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-600">
              Coût Total (TCO)
            </CardTitle>
            <div className="rounded-xl bg-white/10 p-2 group-hover:rotate-12 transition-transform">
              <TrendingUp className="h-4 w-4 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-amber-400">{fcfa(stats.totalCost)}</div>
            <p className="text-[10px] text-slate-600 mt-1 uppercase font-bold tracking-tighter">
              Budget RH Mensuel Estimé
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/10 shadow-sm hover:shadow-md transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Coût / Salarié
            </CardTitle>
            <div className="rounded-xl bg-emerald-100 p-2 group-hover:scale-110 transition-transform">
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight">{fcfa(stats.avgCost)}</div>
            <div className="mt-1">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-black py-0">
                {(stats.avgCost / SMIG_MENSUEL).toFixed(1)}x SMIG
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analysis Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart 1: Donut Breakdown */}
        <Card className="lg:col-span-1 shadow-sm border-2">
          <CardHeader>
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              Répartition TCO
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold">Par Département</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip 
                  formatter={(value: any) => fcfa(Number(value))}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 2: Bar Comparison */}
        <Card className="lg:col-span-2 shadow-sm border-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Comparatif Brut vs Charges
              </CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold">Impact fiscal par unité</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700 }}
                />
                <YAxis hide />
                <ChartTooltip 
                  formatter={(value: any) => fcfa(Number(value))}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="brut" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Salaire Brut" />
                <Bar dataKey="charges" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Charges Patronales" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Dept List Table */}
      <Card className="shadow-sm border-2 overflow-hidden">
        <CardHeader className="border-b bg-slate-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-tight">Détails Analytiques par Pôle</CardTitle>
            <Badge variant="secondary" className="font-bold">Total {fcfa(stats.totalCost)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 text-[10px] uppercase font-black text-slate-600 tracking-widest border-b">
                  <th className="px-6 py-3">Département</th>
                  <th className="px-6 py-3 text-center">Effectif</th>
                  <th className="px-6 py-3">Brut (XOF)</th>
                  <th className="px-6 py-3">Charges (XOF)</th>
                  <th className="px-6 py-3">Total Coût (XOF)</th>
                  <th className="px-6 py-3 text-right">Poids</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.deptStats.map(([dept, data]) => (
                  <tr key={dept} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-700">{dept}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-slate-200 rounded-md text-[10px] font-black">{data.count}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{fcfa(data.totalBrut)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-amber-600">{fcfa(data.totalPatronal)}</td>
                    <td className="px-6 py-4 text-sm font-black text-primary">{fcfa(data.totalBrut + data.totalPatronal)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden md:block">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${((data.totalBrut + data.totalPatronal) / stats.totalCost) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-primary">
                          {(( (data.totalBrut + data.totalPatronal) / stats.totalCost) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Compliance & Optimization Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 border-emerald-100 bg-emerald-50/30">
          <CardHeader>
            <CardTitle className="text-sm font-black text-emerald-800 flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Leviérs d&apos;Optimisation
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-4">
            <p className="leading-relaxed text-slate-600">
              Les charges patronales en Côte d&apos;Ivoire atteignent <span className="font-bold">16.7% + Accident du travail</span>. 
              Pour optimiser votre TCO :
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 font-bold text-emerald-700">
                <ChevronRight className="h-3 w-3" /> Convertir certains avantages en primes non soumises (Transport max 30k)
              </li>
              <li className="flex items-center gap-2 font-bold text-emerald-700">
                <ChevronRight className="h-3 w-3" /> Utiliser les crédits formation FDFP (Récupération des cotisations)
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-100 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="text-sm font-black text-amber-800 flex items-center gap-2">
              <Badge className="bg-amber-500 h-2 w-2 rounded-full p-0" />
              Notes de Conformité
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-3">
            <div className="flex justify-between">
              <span>Sceau CNPS (Planchers/Plafonds)</span>
              <Badge variant="outline" className="text-[10px] font-black border-amber-500 text-amber-700">Audit Passé</Badge>
            </div>
            <div className="flex justify-between">
              <span>Taux FDFP (0.6% + 0.4%)</span>
              <Badge variant="outline" className="text-[10px] font-black border-amber-500 text-amber-700">Calculé</Badge>
            </div>
            <p className="text-[10px] text-amber-700/70 italic pt-2">
              * Basé sur le décret de revalorisation du SMIG 2023.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
