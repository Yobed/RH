"use client";

import { useMemo, useState } from "react";
import { 
  Users, 
  UserMinus, 
  UserCheck, 
  TrendingUp, 
  Presentation, 
  Clock, 
  FileDown, 
  Activity, 
  ChevronRight,
  ShieldCheck,
  Briefcase,
  Calendar,
  Banknote,
  Info,
  ExternalLink,
  Target,
  GraduationCap,
  Trophy,
  Smile,
  Zap,
  HelpCircle,
  MoreHorizontal
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from "recharts";
import { format, differenceInYears, parseISO, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface EmployeesData {
  id: string;
  full_name: string;
  date_embauche: string;
  date_naissance: string | null;
  genre: string | null;
  statut: string | null;
}

interface BulletinsData {
  id: string;
  periode: string;
  salaire_brut: number;
  salaire_net: number;
  its: number;
  cnps_salarie: number;
  prime_transport: number;
  sursalaire: number;
  details?: {
    heures_sup?: {
      h15?: number;
      h50?: number;
      h75?: number;
    };
    nb_jours_absence?: number;
  };
}

interface MedicalData {
  id: string;
  employee_id: string;
  resultat: string;
  prochaine_visite: string | null;
}

interface ContractsData {
  employee_id: string;
  date_debut: string;
  date_fin: string | null;
  statut: string | null;
}

interface CongesData {
  employee_id: string;
  date_debut: string;
  date_fin: string;
  nb_jours: number;
  statut: string | null;
  type: string;
}

interface AnalytiqueDashboardProps {
  employees: EmployeesData[];
  bulletins: BulletinsData[];
  contracts: ContractsData[];
  conges: CongesData[];
  medical: MedicalData[];
}

const COLORS = ["#0ea5e9", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981"];

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(n);

function StatCard({ 
  title, 
  value, 
  icon, 
  subtitle, 
  colorTheme, 
  trend,
  calculationDetails 
}: { 
  title: string, 
  value: string | number, 
  icon: any, 
  subtitle?: string, 
  colorTheme: "sky" | "emerald" | "rose" | "violet" | "amber" | "indigo", 
  trend?: { value: string, isUp: boolean },
  calculationDetails?: { formula: string, utility: string }
}) {
  const themes = {
    sky: "text-sky-700 bg-sky-100 border-sky-200",
    emerald: "text-emerald-700 bg-emerald-100 border-emerald-200",
    rose: "text-rose-700 bg-rose-100 border-rose-200",
    violet: "text-violet-700 bg-violet-100 border-violet-200",
    amber: "text-amber-700 bg-amber-100 border-amber-200",
    indigo: "text-indigo-700 bg-indigo-100 border-indigo-200",
  };
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-500 ${themes[colorTheme].split(" ")[1]}`} />
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl ${themes[colorTheme].split(" ")[1]} ${themes[colorTheme].split(" ")[0]}`}>
              {icon}
            </div>
            {calculationDetails && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-slate-100 text-slate-400">
                    <Info className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black flex items-center gap-2">
                      <HelpCircle className={`h-5 w-5 ${themes[colorTheme].split(" ")[0]}`} />
                      {title}
                    </DialogTitle>
                    <DialogDescription className="font-bold text-slate-500 uppercase tracking-tighter pt-1">
                      Comprendre cet indicateur
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Méthode de Calcul</h4>
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">{calculationDetails.formula}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-primary/5 border-2 border-primary/10">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Utilité Stratégique</h4>
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">{calculationDetails.utility}</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          {trend && (
            <Badge variant={trend.isUp ? "default" : "destructive"} className={`text-[10px] font-black ${trend.isUp ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'} hover:opacity-100`}>
              {trend.isUp ? '↑' : '↓'} {trend.value}
            </Badge>
          )}
        </div>
        <div className="mt-4">
          <p className="text-xs font-black uppercase tracking-widest text-slate-600 mb-1">{title}</p>
          <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
          {subtitle && <p className="text-[10px] text-slate-600 mt-2 font-bold uppercase tracking-tighter">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalytiqueDashboard({ employees, bulletins, contracts, conges, medical }: AnalytiqueDashboardProps) {
  const [isExporting, setIsExporting] = useState(false);

  // --- KPIs ---
  const activeEmployees = useMemo(() => employees.filter(e => e.statut === "actif").length, [employees]);
  const currentYear = new Date().getFullYear();
  
  const entriesThisYear = useMemo(() => {
    return employees.filter(e => {
      const year = new Date(e.date_embauche).getFullYear();
      return year === currentYear;
    }).length;
  }, [employees, currentYear]);

  const departuresThisYear = useMemo(() => {
    return employees.filter(e => {
      if (e.statut !== "inactif") return false;
      const empContracts = contracts.filter(c => c.employee_id === e.id && c.date_fin);
      if (empContracts.length === 0) return false;
      const sorted = empContracts.sort((a, b) => new Date(b.date_fin!).getTime() - new Date(a.date_fin!).getTime());
      return sorted[0].date_fin && new Date(sorted[0].date_fin!).getFullYear() === currentYear;
    }).length;
  }, [employees, contracts, currentYear]);

  const turnoverRate = useMemo(() => {
    if (activeEmployees === 0) return 0;
    const avgEffectif = (activeEmployees + (activeEmployees - entriesThisYear + departuresThisYear)) / 2;
    if (avgEffectif === 0) return 0;
    return ((departuresThisYear / avgEffectif) * 100).toFixed(1);
  }, [activeEmployees, entriesThisYear, departuresThisYear]);

  const averageAge = useMemo(() => {
    const withBirthDate = employees.filter(e => e.date_naissance && e.statut === "actif");
    if (withBirthDate.length === 0) return 0;
    const totalAge = withBirthDate.reduce((sum, e) => {
      return sum + differenceInYears(new Date(), parseISO(e.date_naissance!));
    }, 0);
    return Math.round(totalAge / withBirthDate.length);
  }, [employees]);

  const absenteeismRate = useMemo(() => {
    if (activeEmployees === 0) return "0.0";
    const currentMonth = new Date().getMonth();
    const year = new Date().getFullYear();
    const theoreticalDays = activeEmployees * 22;
    const absenteeismTypes = ['maladie', 'absence', 'sans_solde', 'mise_a_pied', 'absence_non_payee'];
    
    let totalAbsentDays = 0;
    conges.forEach(c => {
      if (c.statut === 'approuve' && absenteeismTypes.includes(c.type.toLowerCase())) {
        const debut = new Date(c.date_debut);
        if (debut.getMonth() === currentMonth && debut.getFullYear() === year) {
          totalAbsentDays += Number(c.nb_jours);
        }
      }
    });
    
    const rate = (totalAbsentDays / theoreticalDays) * 100;
    return rate.toFixed(1);
  }, [conges, activeEmployees]);

  const medicalCompliance = useMemo(() => {
    if (activeEmployees === 0) return 0;
    const now = new Date().toISOString().split('T')[0];
    const compliantCount = employees.filter(e => {
      if (e.statut !== "actif") return false;
      const empMedical = medical.filter(m => m.employee_id === e.id);
      if (empMedical.length === 0) return false;
      const latest = empMedical.sort((a, b) => (b.prochaine_visite || "").localeCompare(a.prochaine_visite || ""))[0];
      return latest.prochaine_visite && latest.prochaine_visite >= now;
    }).length;
    return Math.round((compliantCount / activeEmployees) * 100);
  }, [medical, employees, activeEmployees]);

  // --- Pyramide des âges ---
  const ageData = useMemo(() => {
    const bins = [
      { range: "18-25", min: 18, max: 25, Hommes: 0, Femmes: 0 },
      { range: "26-35", min: 26, max: 35, Hommes: 0, Femmes: 0 },
      { range: "36-45", min: 36, max: 45, Hommes: 0, Femmes: 0 },
      { range: "46-55", min: 46, max: 55, Hommes: 0, Femmes: 0 },
      { range: "56+", min: 56, max: 100, Hommes: 0, Femmes: 0 },
    ];
    employees.forEach(e => {
      if (e.statut !== "actif" || !e.date_naissance) return;
      const age = differenceInYears(new Date(), parseISO(e.date_naissance));
      const genre = e.genre?.toUpperCase() === "F" ? "Femmes" : "Hommes";
      for (const bin of bins) {
        if (age >= bin.min && age <= bin.max) {
          bin[genre]++;
          break;
        }
      }
    });
    return bins;
  }, [employees]);

  // --- Masse Salariale & Coût Entreprise ---
  const payrollData = useMemo(() => {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      months.push(format(d, "yyyy-MM"));
    }
    
    return months.map(m => {
      const monthBulletins = bulletins.filter(b => b.periode === m);
      const totalBrut = monthBulletins.reduce((sum, b) => sum + Number(b.salaire_brut), 0);
      const totalNet = monthBulletins.reduce((sum, b) => sum + Number(b.salaire_net || 0), 0);
      
      const coutPatronal = totalBrut * 0.21;
      const totalCout = totalBrut + coutPatronal;

      const totalHS = monthBulletins.reduce((sum, b) => {
        const hs = b.details?.heures_sup;
        return sum + (Number(hs?.h15 || 0) + Number(hs?.h50 || 0) + Number(hs?.h75 || 0));
      }, 0);
      
      return {
        name: format(parseISO(`${m}-01`), "MMM yy", { locale: fr }),
        Brut: totalBrut,
        Net: totalNet,
        CoutTotal: totalCout,
        HS: totalHS,
        periode: m,
      };
    });
  }, [bulletins]);

  // --- Turnover Historique ---
  const turnoverData = useMemo(() => {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      months.push(format(d, "yyyy-MM"));
    }

    return months.map(m => {
      const entrees = employees.filter(e => e.date_embauche.startsWith(m)).length;
      const sorties = employees.filter(e => {
        if (e.statut !== "inactif") return false;
        const empContracts = contracts.filter(c => c.employee_id === e.id && c.date_fin);
        if (empContracts.length === 0) return false;
        const sorted = empContracts.sort((a, b) => new Date(b.date_fin!).getTime() - new Date(a.date_fin!).getTime());
        return sorted[0].date_fin && sorted[0].date_fin!.startsWith(m);
      }).length;

      return {
        name: format(parseISO(`${m}-01`), "MMM yy", { locale: fr }),
        Entrées: entrees,
        Sorties: sorties,
      };
    });
  }, [employees, contracts]);

  const exportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const date = new Date().toLocaleDateString("fr-CI");
      const companyName = "RH Manager CI";

      // Header
      doc.setFillColor(14, 165, 233);
      doc.rect(0, 0, 210, 40, "F");
      
      doc.setFontSize(22);
      doc.setTextColor(255);
      doc.text("RAPPORT ANALYTIQUE RH", 15, 25);
      
      doc.setFontSize(10);
      doc.text(`Généré le ${date} · ${companyName}`, 15, 33);

      // Section 1: KPIs
      doc.setTextColor(0);
      doc.setFontSize(14);
      doc.text("Indicateurs Clés de Performance", 15, 55);

      autoTable(doc, {
        startY: 60,
        head: [["Indicateur", "Valeur", "Description"]],
        body: [
          ["Effectif Actif", activeEmployees, "Nombre total de contrats en cours"],
          ["Masse Salariale Nette", fmtCurrency(payrollData[payrollData.length-1].Net), "Dernier mois"],
          ["Coût Entreprise Global", fmtCurrency(payrollData[payrollData.length-1].CoutTotal), "Brut + Charges patronales"],
          ["Taux de Turnover", `${turnoverRate}%`, `Annuel (${currentYear})`],
          ["Absentéisme", `${absenteeismRate}%`, "Mois en cours"],
          ["Conformité Médicale", `${medicalCompliance}%`, "Visites à jour"],
        ],
        theme: "striped",
        headStyles: { fillColor: [14, 165, 233] },
      });

      // Section 2: Historique financier
      doc.addPage();
      doc.text("Historique Financier (12 mois)", 15, 25);
      
      autoTable(doc, {
        startY: 30,
        head: [["Période", "Salaire Brut", "Salaire Net", "Coût Employeur"]],
        body: [...payrollData].reverse().map(d => [
          d.name,
          fmtCurrency(d.Brut),
          fmtCurrency(d.Net),
          fmtCurrency(d.CoutTotal)
        ]),
        headStyles: { fillColor: [99, 102, 241] },
      });

      // Section 3: Population
      doc.text("Structure de la Population (Pyramide des âges)", 15, (doc as any).lastAutoTable.finalY + 15);
      
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [["Tranche d'âge", "Hommes", "Femmes", "Total"]],
        body: ageData.map(d => [
          d.range,
          d.Hommes,
          d.Femmes,
          d.Hommes + d.Femmes
        ]),
        headStyles: { fillColor: [139, 92, 246] },
      });

      doc.save(`rapport_analytique_rh_${date.replace(/\//g, "-")}.pdf`);
    } catch (error) {
      console.error("PDF Export failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 p-6 rounded-2xl border-2 border-primary/5 shadow-sm backdrop-blur-md">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Cockpit Décisionnel RH
          </h2>
          <p className="text-sm font-medium text-slate-600">Vision 360° et pilotage de la performance sociale</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={exportPDF} 
            disabled={isExporting}
            className="bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20"
          >
            <FileDown className="mr-2 h-4 w-4" />
            {isExporting ? "Génération..." : "Rapport PDF Professionnel"}
          </Button>
        </div>
      </div>

      {/* KPIs Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Effectif Actif" 
          value={activeEmployees} 
          icon={<Users className="w-5 h-5" />} 
          colorTheme="sky" 
          subtitle="Collaborateurs sous contrat"
          trend={{ value: `${entriesThisYear} entrées`, isUp: true }}
          calculationDetails={{
            formula: "Nombre total de contrats actifs à la date de consultation.",
            utility: "Permet de dimensionner la structure organisationnelle et de piloter les besoins en ressources."
          }}
        />
        <StatCard 
          title="Masse Nette" 
          value={fmtCurrency(payrollData[payrollData.length - 1].Net)} 
          icon={<Banknote className="w-5 h-5" />} 
          colorTheme="emerald" 
          subtitle="Débours mensuel net"
          calculationDetails={{
            formula: "Σ des Salaires Nets à Payer (Bulletins du dernier cycle validé).",
            utility: "Indicateur critique pour la gestion de la trésorerie et le pilotage des coûts directs."
          }}
        />
        <StatCard 
          title="TCO Mensuel" 
          value={fmtCurrency(payrollData[payrollData.length - 1].CoutTotal)} 
          icon={<TrendingUp className="w-5 h-5" />} 
          colorTheme="violet" 
          subtitle="Total Cost of Ownership"
          calculationDetails={{
            formula: "Salaire Brut + Charges Patronales (Simulées à 21% du Brut pour CI).",
            utility: "Indicateur du coût réel d'un employé pour l'entreprise incluant les charges sociales."
          }}
        />
        <StatCard 
          title="H. Sup" 
          value={`${payrollData[payrollData.length - 1].HS}h`} 
          icon={<Clock className="w-5 h-5" />} 
          colorTheme="amber" 
          subtitle="Impact productivité"
          calculationDetails={{
            formula: "Σ des Heures supplémentaires effectuées sur le cycle de paie.",
            utility: "Mesure la flexibilité de l'organisation et identifie les surcharges de travail."
          }}
        />
      </div>

      {/* KPIs Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Absentéisme" 
          value={`${absenteeismRate}%`} 
          icon={<UserMinus className="w-5 h-5" />} 
          colorTheme="rose" 
          subtitle="Perte de capacité"
          calculationDetails={{
            formula: "(Nombre de jours d'absence / Nombre de jours travaillés théoriques) × 100",
            utility: "Alerte sur le climat social et l'engagement. Impacte directement la productivité opérationnelle."
          }}
        />
        <StatCard 
          title="Turnover" 
          value={`${turnoverRate}%`} 
          icon={<TrendingUp className="w-5 h-5" />} 
          colorTheme="amber" 
          subtitle="Stabilité du capital humain"
          calculationDetails={{
            formula: "(Nombre de départs / Effectif moyen) × 100",
            utility: "Évalue la stabilité des effectifs et le risque de fuite des compétences."
          }}
        />
        <StatCard 
          title="Conformité" 
          value={`${medicalCompliance}%`} 
          icon={<ShieldCheck className="w-5 h-5" />} 
          colorTheme="sky" 
          subtitle="Sceaux médicaux validés"
          calculationDetails={{
            formula: "(Nombre d'employés avec examen médical valide / Effectif actif) × 100",
            utility: "Mesure la conformité légale et la gestion de la santé/sécurité au travail."
          }}
        />
        <StatCard 
          title="Âge Moyen" 
          value={`${averageAge} ans`} 
          icon={<Presentation className="w-5 h-5" />} 
          colorTheme="indigo" 
          subtitle="Maturité de l'effectif"
          calculationDetails={{
            formula: "Σ des âges des employés actifs / Effectif actif",
            utility: "Aide à la planification de la relève et à l'équilibre intergénérationnel."
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Évolution Coût vs Net */}
        <Card className="lg:col-span-3 border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Analyse de la Trajectoire Financière (TCO vs Net)
            </CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-tighter">Comparaison sur les 12 derniers cycles de paie</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={payrollData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCout" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} stroke="#94A3B8" axisLine={false} tickLine={false} />
                  <YAxis 
                    tick={{ fontSize: 10, fontWeight: 700 }} 
                    stroke="#94A3B8" 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val}
                  />
                  <Tooltip 
                    formatter={(value: any) => typeof value === 'number' ? fmtCurrency(value) : value} 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    labelStyle={{ fontWeight: 800, marginBottom: '4px', color: '#1e293b' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }} iconType="circle" />
                  <Area 
                    type="monotone" 
                    dataKey="CoutTotal" 
                    stroke="#8B5CF6" 
                    fillOpacity={1} 
                    fill="url(#colorCout)" 
                    strokeWidth={4} 
                    name="Coût Employeur (Total)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Net" 
                    stroke="#10B981" 
                    fillOpacity={1} 
                    fill="url(#colorNet)" 
                    strokeWidth={2} 
                    name="Salaire Net à Payer"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pyramide des Âges */}
        <Card className="lg:col-span-1 border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-800 text-center">
              Démographie (Âge/Genre)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="range" type="category" tick={{ fontSize: 10, fontWeight: 800 }} stroke="#94A3B8" axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 800 }} />
                  <Bar dataKey="Hommes" stackId="a" fill="#0EA5E9" radius={[0, 4, 4, 0]} barSize={20} />
                  <Bar dataKey="Femmes" stackId="a" fill="#F43F5E" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Flux RH */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Mouvement du Personnel (Flux RH)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={turnoverData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 800 }} stroke="#94A3B8" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 800 }} stroke="#94A3B8" axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 800 }} />
                  <Bar dataKey="Entrées" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey="Sorties" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Business Intelligence Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-primary/10 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-sm font-black text-primary flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Analyses de Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-4 font-bold text-slate-600">
            <div className="flex gap-4">
              <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">1</div>
              <p>Votre TCO actuel est de <span className="text-primary">{((payrollData[payrollData.length-1].CoutTotal / payrollData[payrollData.length-1].Net - 1)*100).toFixed(1)}%</span> supérieur au salaire net. C&apos;est la marge de contribution sociale obligatoire en Côte d&apos;Ivoire.</p>
            </div>
            <div className="flex gap-4">
              <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">2</div>
              <p>Le taux d&apos;absentéisme de {absenteeismRate}% est {Number(absenteeismRate) > 5 ? 'élevé' : 'dans la moyenne'}. {Number(absenteeismRate) > 5 ? 'Envisagez un audit des conditions de travail.' : 'Continuez vos actions de bien-être.'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-100 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-sm font-black text-amber-700 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Conformité & Risques
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-4 font-bold text-slate-600">
            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-amber-200">
              <span>Visites médicales à jour</span>
              <Badge className="bg-emerald-500">{medicalCompliance}%</Badge>
            </div>
            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-amber-200">
              <span>Turnover annuel {currentYear}</span>
              <Badge className={Number(turnoverRate) > 15 ? "bg-rose-500" : "bg-sky-500"}>{turnoverRate}%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* HR Analytics Reference Guide */}
      <Card className="border-none shadow-2xl overflow-hidden bg-slate-900 text-white rounded-[2rem]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32" />
        <CardHeader className="relative p-8 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">Référentiel des Indicateurs RH</CardTitle>
              <CardDescription className="text-white/60 font-bold uppercase tracking-widest text-[10px]">Méthodologies de calcul & Utilité stratégique</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-primary font-black flex items-center gap-2 uppercase tracking-widest text-xs">
                <Target className="h-4 w-4" /> Recrutement & Effectifs
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 transition-colors">
                  <p className="font-black text-sm mb-1">Taux de recrutement</p>
                  <p className="text-[10px] text-white/40 mb-2 font-mono uppercase">(Recrutements / Postes ouverts) × 100</p>
                  <p className="text-xs text-white/70 leading-relaxed">Mesure l&apos;efficacité du processus de recrutement et la capacité à pourvoir les postes.</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 transition-colors">
                  <p className="font-black text-sm mb-1">Coût par recrutement</p>
                  <p className="text-[10px] text-white/40 mb-2 font-mono uppercase">Coût total / Nombre de recrutements</p>
                  <p className="text-xs text-white/70 leading-relaxed">Mesure l&apos;efficacité financière des canaux d&apos;acquisition de talents.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-rose-400 font-black flex items-center gap-2 uppercase tracking-widest text-xs">
                <Zap className="h-4 w-4" /> Performance & Formation
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 transition-colors">
                  <p className="font-black text-sm mb-1">Taux de formation</p>
                  <p className="text-[10px] text-white/40 mb-2 font-mono uppercase">(Salariés formés / Effectif total) × 100</p>
                  <p className="text-xs text-white/70 leading-relaxed">Indicateur d&apos;investissement dans le capital humain et l&apos;évolution des compétences.</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 transition-colors">
                  <p className="font-black text-sm mb-1">ROI de la formation</p>
                  <p className="text-[10px] text-white/40 mb-2 font-mono uppercase">(Gain de productivité - Coût) / Coût</p>
                  <p className="text-xs text-white/70 leading-relaxed">Évalue la rentabilité économique des actions de montée en compétences.</p>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-emerald-400 font-black flex items-center gap-2 uppercase tracking-widest text-xs">
                <Smile className="h-4 w-4" /> Fidélisation & Climat
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 transition-colors">
                  <p className="font-black text-sm mb-1">Taux de Turnover</p>
                  <p className="text-[10px] text-white/40 mb-2 font-mono uppercase">(Départs N / Effectif moyen) × 100</p>
                  <p className="text-xs text-white/70 leading-relaxed">Indice de stabilité du capital humain et d&apos;attractivité de la marque employeur.</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 transition-colors">
                  <p className="font-black text-sm mb-1">Taux d&apos;Ancienneté Moyenne</p>
                  <p className="text-[10px] text-white/40 mb-2 font-mono uppercase">Σ Ancienneté / Effectif total</p>
                  <p className="text-xs text-white/70 leading-relaxed">Reflète l&apos;expérience accumulée et la loyauté des collaborateurs envers l&apos;entreprise.</p>
                </div>
              </div>
            </section>

            <div className="p-6 bg-primary/10 rounded-3xl border border-primary/20 backdrop-blur-md">
              <div className="flex items-start gap-4">
                <Trophy className="h-10 w-10 text-primary shrink-0" />
                <div>
                  <h4 className="font-black text-lg mb-2 italic">Optimisation Stratégique</h4>
                  <p className="text-xs text-white/60 leading-relaxed font-bold uppercase tracking-tighter">
                    L&apos;utilisation systématique de ces indicateurs permet de passer d&apos;une gestion administrative des RH à un pilotage stratégique basé sur la donnée (Data-Driven HR).
                  </p>
                  <Button variant="link" className="text-primary p-0 h-auto mt-4 font-black">
                    Consulter la documentation complète <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
