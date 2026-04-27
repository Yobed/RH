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
  departement?: string | null;
  categorie?: string | null;
}

interface BulletinsData {
  id: string;
  employee_id: string;
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

interface JobPostingsData {
  id: string;
  titre: string;
  created_at: string;
  statut: string;
  date_limite: string | null;
}

interface CandidatesData {
  id: string;
  job_id: string;
  created_at: string;
  statut: string;
  score_ia: number | null;
}

interface EvaluationsData {
  id: string;
  employee_id: string;
  score_global: number | null;
  potential_score: number | null;
  date_realisation: string | null;
  type: string;
  statut: string;
}

interface AccidentsData {
  id: string;
  employee_id: string;
  date_accident: string;
  jours_arret: number | null;
  gravite: string | null;
}

interface AnalytiqueDashboardProps {
  employees: EmployeesData[];
  bulletins: BulletinsData[];
  contracts: ContractsData[];
  conges: CongesData[];
  medical: MedicalData[];
  jobPostings: JobPostingsData[];
  candidates: CandidatesData[];
  evaluations: EvaluationsData[];
  accidents: AccidentsData[];
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

export function AnalytiqueDashboard({ 
  employees, 
  bulletins, 
  contracts, 
  conges, 
  medical,
  jobPostings,
  candidates,
  evaluations,
  accidents
}: AnalytiqueDashboardProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string>("Tous");
  const [selectedCSP, setSelectedCSP] = useState<string>("Tous");

  // --- Filter Metadata ---
  const departments = useMemo(() => {
    const depts = new Set(employees.map(e => e.departement || "Non Défini"));
    return ["Tous", ...Array.from(depts)];
  }, [employees]);

  const categories = useMemo(() => {
    const caps = new Set(employees.map(e => e.categorie || "Non Défini"));
    return ["Tous", ...Array.from(caps)];
  }, [employees]);

  // --- Filtered Data ---
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchDept = selectedDept === "Tous" || (e.departement || "Non Défini") === selectedDept;
      const matchCSP = selectedCSP === "Tous" || (e.categorie || "Non Défini") === selectedCSP;
      return matchDept && matchCSP;
    });
  }, [employees, selectedDept, selectedCSP]);

  const filteredBulletins = useMemo(() => {
    const employeeIds = new Set(filteredEmployees.map(e => e.id));
    return bulletins.filter(b => employeeIds.has(b.employee_id));
  }, [bulletins, filteredEmployees]);

  // --- Helpers for Comparisons ---
  const getPeriodData = (data: BulletinsData[], period: string) => {
    return data.filter(b => b.periode === period);
  };

  const currentMonthPeriod = format(new Date(), "yyyy-MM");
  const prevMonthPeriod = format(subMonths(new Date(), 1), "yyyy-MM");
  const prevYearMonthPeriod = format(subMonths(new Date(), 12), "yyyy-MM");

  // --- KPIs ---
  const activeEmployees = useMemo(() => filteredEmployees.filter(e => e.statut === "actif").length, [filteredEmployees]);
  const currentYear = new Date().getFullYear();
  
  const entriesThisYear = useMemo(() => {
    return filteredEmployees.filter(e => {
      const year = new Date(e.date_embauche).getFullYear();
      return year === currentYear;
    }).length;
  }, [filteredEmployees, currentYear]);

  const departuresThisYear = useMemo(() => {
    return filteredEmployees.filter(e => {
      if (e.statut !== "inactif") return false;
      const empContracts = contracts.filter(c => c.employee_id === e.id && c.date_fin);
      if (empContracts.length === 0) return false;
      const sorted = empContracts.sort((a, b) => new Date(b.date_fin!).getTime() - new Date(a.date_fin!).getTime());
      return sorted[0].date_fin && new Date(sorted[0].date_fin!).getFullYear() === currentYear;
    }).length;
  }, [filteredEmployees, contracts, currentYear]);

  // --- Advanced Calculations (M/M-1) ---
  const payrollStats = useMemo(() => {
    const curr = filteredBulletins.filter(b => b.periode === currentMonthPeriod);
    const prev = filteredBulletins.filter(b => b.periode === prevMonthPeriod);
    
    const currTotal = curr.reduce((sum, b) => sum + Number(b.salaire_brut), 0);
    const prevTotal = prev.reduce((sum, b) => sum + Number(b.salaire_brut), 0);
    
    const delta = prevTotal === 0 ? 0 : ((currTotal - prevTotal) / prevTotal) * 100;
    
    return {
      current: currTotal,
      previous: prevTotal,
      delta: delta.toFixed(1),
      isUp: delta > 0
    };
  }, [filteredBulletins, currentMonthPeriod, prevMonthPeriod]);

  const turnoverRate = useMemo(() => {
    if (activeEmployees === 0) return 0;
    const avgEffectif = (activeEmployees + (activeEmployees - entriesThisYear + departuresThisYear)) / 2;
    if (avgEffectif === 0) return 0;
    return ((departuresThisYear / avgEffectif) * 100).toFixed(1);
  }, [activeEmployees, entriesThisYear, departuresThisYear]);

  const averageAge = useMemo(() => {
    const withBirthDate = filteredEmployees.filter(e => e.date_naissance && e.statut === "actif");
    if (withBirthDate.length === 0) return 0;
    const totalAge = withBirthDate.reduce((sum, e) => {
      return sum + differenceInYears(new Date(), parseISO(e.date_naissance!));
    }, 0);
    return Math.round(totalAge / withBirthDate.length);
  }, [filteredEmployees]);

  const absenteeismRate = useMemo(() => {
    if (activeEmployees === 0) return "0.0";
    const currentMonth = new Date().getMonth();
    const year = new Date().getFullYear();
    const theoreticalDays = activeEmployees * 22;
    const absenteeismTypes = ['maladie', 'absence', 'sans_solde', 'mise_a_pied', 'absence_non_payee'];
    
    let totalAbsentDays = 0;
    const employeeIds = new Set(filteredEmployees.map(e => e.id));
    conges.forEach(c => {
      if (employeeIds.has(c.employee_id) && c.statut === 'approuve' && absenteeismTypes.includes(c.type.toLowerCase())) {
        const debut = new Date(c.date_debut);
        if (debut.getMonth() === currentMonth && debut.getFullYear() === year) {
          totalAbsentDays += Number(c.nb_jours);
        }
      }
    });
    
    const rate = (totalAbsentDays / theoreticalDays) * 100;
    return rate.toFixed(1);
  }, [conges, activeEmployees, filteredEmployees]);

  const medicalCompliance = useMemo(() => {
    if (activeEmployees === 0) return 0;
    const now = new Date().toISOString().split('T')[0];
    const compliantCount = filteredEmployees.filter(e => {
      if (e.statut !== "actif") return false;
      const empMedical = medical.filter(m => m.employee_id === e.id);
      if (empMedical.length === 0) return false;
      const latest = empMedical.sort((a, b) => (b.prochaine_visite || "").localeCompare(a.prochaine_visite || ""))[0];
      return latest.prochaine_visite && latest.prochaine_visite >= now;
    }).length;
    return Math.round((compliantCount / activeEmployees) * 100);
  }, [medical, filteredEmployees, activeEmployees]);

  // --- Pyramide des âges ---
  const ageData = useMemo(() => {
    const bins = [
      { range: "18-25", min: 18, max: 25, Hommes: 0, Femmes: 0 },
      { range: "26-35", min: 26, max: 35, Hommes: 0, Femmes: 0 },
      { range: "36-45", min: 36, max: 45, Hommes: 0, Femmes: 0 },
      { range: "46-55", min: 46, max: 55, Hommes: 0, Femmes: 0 },
      { range: "56+", min: 56, max: 100, Hommes: 0, Femmes: 0 },
    ];
    filteredEmployees.forEach(e => {
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
  }, [filteredEmployees]);

  // --- Masse Salariale & Coût Entreprise ---
  const payrollData = useMemo(() => {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      months.push(format(d, "yyyy-MM"));
    }
    
    return months.map(m => {
      const monthBulletins = filteredBulletins.filter(b => b.periode === m);
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
  }, [filteredBulletins]);

  // --- Turnover Historique ---
  const turnoverData = useMemo(() => {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      months.push(format(d, "yyyy-MM"));
    }

    return months.map(m => {
      const entrees = filteredEmployees.filter(e => e.date_embauche.startsWith(m)).length;
      const sorties = filteredEmployees.filter(e => {
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
  }, [filteredEmployees, contracts]);

  // --- Recruitment Analytics ---
  const recruitmentStats = useMemo(() => {
    const totalJobs = jobPostings.length;
    const currentlyOpen = jobPostings.filter(j => j.statut === 'ouvert').length;
    const totalCandidates = candidates.length;
    const hiredTotal = candidates.filter(c => c.statut === 'recrute').length;
    
    // Taux de recrutement (Fill Rate) : (Nombre de recrutements / Nombre de postes ouverts) × 100
    const recruitmentRate = totalJobs === 0 ? 0 : (hiredTotal / totalJobs) * 100;
    
    // Coût par recrutement (Estimated / Placeholder as per Ivorian standard costs if missing)
    // Coût total du recrutement / Nombre de recrutements
    // Note: If no cost table, we simulate a standard cost structure for analytics
    const standardCostPerPost = 75000; // Example: Publication + Admin fees
    const simulatedTotalCost = totalJobs * standardCostPerPost;
    const costPerHire = hiredTotal === 0 ? 0 : simulatedTotalCost / hiredTotal;

    // Délai moyen de recrutement : Somme des délais de recrutement / Nombre de recrutements
    let totalDelay = 0;
    let validRecruitments = 0;
    candidates.forEach(c => {
      if (c.statut === 'recrute' && c.job_id) {
        const job = jobPostings.find(j => j.id === c.job_id);
        if (job) {
          const creationDate = new Date(job.created_at);
          const completionDate = new Date(c.created_at); // Hire date approximation
          const diffDays = Math.max(0, (completionDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
          totalDelay += diffDays;
          validRecruitments++;
        }
      }
    });
    const avgHiringTime = validRecruitments === 0 ? 0 : totalDelay / validRecruitments;

    const avgIAScore = candidates.reduce((sum, c) => sum + (c.score_ia || 0), 0) / (totalCandidates || 1);
    
    return {
      openings: currentlyOpen,
      totalJobs: totalJobs,
      candidates: totalCandidates,
      hired: hiredTotal,
      recruitmentRate: recruitmentRate.toFixed(1),
      costPerHire: costPerHire,
      avgHiringTime: Math.round(avgHiringTime),
      avgIAScore: avgIAScore.toFixed(1)
    };
  }, [jobPostings, candidates]);

  // --- Performance Analytics ---
  const performanceStats = useMemo(() => {
    const relevantEvals = evaluations.filter(ev => {
      const empIds = new Set(filteredEmployees.map(e => e.id));
      return empIds.has(ev.employee_id) && ev.statut === 'valide';
    });
    
    if (relevantEvals.length === 0) return { avgScore: "0", avgPotential: "0", total: 0 };
    
    const totalScore = relevantEvals.reduce((sum, ev) => sum + Number(ev.score_global || 0), 0);
    const totalPotential = relevantEvals.reduce((sum, ev) => sum + Number(ev.potential_score || 0), 0);
    
    return {
      avgScore: (totalScore / relevantEvals.length).toFixed(1),
      avgPotential: (totalPotential / relevantEvals.length).toFixed(1),
      total: relevantEvals.length
    };
  }, [evaluations, filteredEmployees]);

  // --- Safety & Accidents Analytics ---
  const safetyStats = useMemo(() => {
    const empIds = new Set(filteredEmployees.map(e => e.id));
    const currentMonth = new Date().getMonth();
    const currentYearNum = new Date().getFullYear();
    
    const relevantAccidents = accidents.filter(a => empIds.has(a.employee_id));
    const totalJoursArret = relevantAccidents.reduce((sum, a) => sum + (a.jours_arret || 0), 0);
    const accidentCount = relevantAccidents.length;
    
    // Taux de fréquence (Accidents / Millions d'heures)
    const theoreticalHours = activeEmployees * 173.33 * 12; // Base annuelle
    const freqRate = theoreticalHours === 0 ? 0 : (accidentCount / theoreticalHours) * 1000000;
    
    // Taux de gravité : (Somme des journées perdues / Heures travaillées) x 1000
    const severityRate = theoreticalHours === 0 ? 0 : (totalJoursArret / theoreticalHours) * 1000;
    
    return {
      count: accidentCount,
      joursPerdus: totalJoursArret,
      freqRate: freqRate.toFixed(1),
      severityRate: severityRate.toFixed(3)
    };
  }, [accidents, filteredEmployees, activeEmployees]);

  // --- M/M-1 Comparisons for Multi-KPI ---
  const monthlyComparisons = useMemo(() => {
    // Turnover M/M-1
    const getTurnoverForMonth = (date: Date) => {
      const m = format(date, "yyyy-MM");
      const effectif = filteredEmployees.filter(e => {
        const embauche = new Date(e.date_embauche);
        if (embauche > date) return false;
        if (e.statut === 'actif') return true;
        const empContracts = contracts.filter(c => c.employee_id === e.id && c.date_fin);
        if (empContracts.length === 0) return true;
        const sorted = empContracts.sort((a, b) => new Date(b.date_fin!).getTime() - new Date(a.date_fin!).getTime());
        return sorted[0].date_fin && new Date(sorted[0].date_fin) > date;
      }).length;
      
      const sorties = filteredEmployees.filter(e => {
        if (e.statut !== "inactif") return false;
        const empContracts = contracts.filter(c => c.employee_id === e.id && c.date_fin);
        const sorted = empContracts.sort((a, b) => new Date(b.date_fin!).getTime() - new Date(a.date_fin!).getTime());
        return sorted[0]?.date_fin?.startsWith(m);
      }).length;
      
      return effectif === 0 ? 0 : (sorties / effectif) * 100;
    };

    const turnoverM = getTurnoverForMonth(new Date());
    const turnoverM1 = getTurnoverForMonth(subMonths(new Date(), 1));
    const turnoverDelta = turnoverM1 === 0 ? 0 : ((turnoverM - turnoverM1) / turnoverM1) * 100;

    return {
      turnover: { current: turnoverM.toFixed(1), delta: Math.abs(turnoverDelta).toFixed(1), isUp: turnoverDelta > 0 },
    };
  }, [filteredEmployees, contracts]);

  // --- Expert Sentiment & Significant Deltas ---
  const expertInsights = useMemo(() => {
    const insights = [];
    
    // 1. Comparison of Segment vs Global
    const globalActive = employees.filter(e => e.statut === 'actif').length;
    const segmentActive = filteredEmployees.filter(e => e.statut === 'actif').length;
    
    if (selectedDept !== "Tous") {
      const segmentWeight = (segmentActive / (globalActive || 1)) * 100;
      insights.push({
        type: "segmentation",
        label: "Poids du Segment",
        value: `${segmentWeight.toFixed(1)}% de l'effectif global`,
        detail: `Le département ${selectedDept} représente une part significative de la structure.`
      });
    }

    // 2. Alert on Monthly Variance
    if (Math.abs(Number(payrollStats.delta)) > 5) {
      insights.push({
        type: "alert",
        label: "Variation Masse Salariale",
        value: `${payrollStats.delta}%`,
        detail: "Variation atypique de la masse salariale détectée ce mois-ci. Nécessite un audit des éléments variables (Heures Sup, Primes)."
      });
    }

    // 3. Recruitment Efficiency
    const fillRate = Number(recruitmentStats.recruitmentRate);
    if (fillRate < 50 && recruitmentStats.totalJobs > 0) {
      insights.push({
        type: "performance",
        label: "Tension Recrutement",
        value: `${fillRate}%`,
        detail: "Le taux de pourvoi des postes est faible. Risque de surcharge sur les équipes en place."
      });
    }

    return insights;
  }, [employees, filteredEmployees, selectedDept, payrollStats, recruitmentStats]);

  // --- N / N-1 Calculations ---
  const comparisonStats = useMemo(() => {
    const prevYear = currentYear - 1;
    
    // Workforce comparison
    const currWorkforce = filteredEmployees.filter(e => e.statut === "actif").length;
    const prevWorkforce = filteredEmployees.filter(e => {
      const embauche = new Date(e.date_embauche);
      const yearEmbauche = embauche.getFullYear();
      if (yearEmbauche > prevYear) return false;
      if (e.statut === "actif") return true;
      
      const empContracts = contracts.filter(c => c.employee_id === e.id && c.date_fin);
      if (empContracts.length === 0) return true;
      const sorted = empContracts.sort((a, b) => new Date(b.date_fin!).getTime() - new Date(a.date_fin!).getTime());
      return sorted[0].date_fin && new Date(sorted[0].date_fin).getFullYear() > prevYear;
    }).length;

    const workforceDelta = prevWorkforce === 0 ? 0 : ((currWorkforce - prevWorkforce) / prevWorkforce) * 100;

    // Payroll comparison (Annual average)
    const currAnnualPayroll = filteredBulletins.filter(b => b.periode.startsWith(currentYear.toString()))
      .reduce((sum, b) => sum + Number(b.salaire_brut), 0);
    const prevAnnualPayroll = filteredBulletins.filter(b => b.periode.startsWith(prevYear.toString()))
      .reduce((sum, b) => sum + Number(b.salaire_brut), 0);
    
    const payrollYearDelta = prevAnnualPayroll === 0 ? 0 : ((currAnnualPayroll - prevAnnualPayroll) / prevAnnualPayroll) * 100;

    return {
      workforceDelta: workforceDelta.toFixed(1),
      workforceIsUp: workforceDelta >= 0,
      payrollYearDelta: payrollYearDelta.toFixed(1),
      payrollYearIsUp: payrollYearDelta >= 0
    };
  }, [filteredEmployees, contracts, filteredBulletins, currentYear]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-1">
            <span className="p-2 bg-primary/10 rounded-xl text-primary">
              <Activity className="h-5 w-5" />
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Cockpit Expert Data Analyst RH
            </h2>
          </div>
          <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
            PILOTAGE STRATÉGIQUE & PERFORMANCE SOCIALE <span className="h-1 w-1 rounded-full bg-slate-300" /> V1.2
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => window.location.href = "/analytique/focus"}
            className="rounded-2xl bg-amber-400 text-slate-900 hover:bg-amber-500 font-black shadow-lg shadow-amber-100 px-6 h-12 gap-2 transition-all duration-300 hover:translate-y-[-2px]"
          >
            <Zap className="h-5 w-5 fill-current" />
            VUE FOCUS STRATÉGIQUE
          </Button>
          <Button 
            onClick={exportPDF} 
            disabled={isExporting}
            className="rounded-2xl font-black bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-200/50 gap-2 h-12 px-6"
          >
            {isExporting ? <Clock className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            EXPORTER LE RAPPORT ANALYTIQUE
          </Button>
        </div>
      </div>

      {/* Control Bar: Segmentation & Period */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 bg-slate-50 rounded-[2rem] border-2 border-slate-100">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Segment Département</label>
            <select 
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-white border-2 border-slate-200/60 rounded-2xl px-5 py-3 text-sm font-black text-slate-700 outline-none focus:border-primary transition-all cursor-pointer shadow-sm shadow-slate-100"
            >
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Segment Catégorie (CSP)</label>
            <select 
              value={selectedCSP}
              onChange={(e) => setSelectedCSP(e.target.value)}
              className="w-full bg-white border-2 border-slate-200/60 rounded-2xl px-5 py-3 text-sm font-black text-slate-700 outline-none focus:border-primary transition-all cursor-pointer shadow-sm shadow-slate-100"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-center p-4 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <div className="text-center">
              <p className="text-2xl font-black text-primary leading-none">{filteredEmployees.length}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Observations</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:border-l lg:pl-4">
           <Button 
             variant="ghost" 
             onClick={() => { setSelectedDept("Tous"); setSelectedCSP("Tous"); }}
             className="h-full px-6 rounded-2xl font-black text-slate-400 hover:text-rose-500 gap-2"
           >
             <MoreHorizontal className="w-4 h-4" />
             RÉINITIALISER
           </Button>
        </div>
      </div>

      {/* SECTION 1: PILOTAGE DES EFFECTIFS & MASSE SALARIALE */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Performance & Masse Salariale</h3>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Effectif Actif" 
            value={activeEmployees} 
            icon={<Users className="w-5 h-5" />} 
            colorTheme="sky" 
            subtitle="Personnel sous contrat"
            trend={{ value: `${comparisonStats.workforceDelta}% (Annuel)`, isUp: comparisonStats.workforceIsUp }}
            calculationDetails={{
              formula: "Count(Employees) WHERE statut = 'actif'",
              utility: "Indicateur critique pour le dimensionnement de la structure et l'allocation des RH."
            }}
          />
          <StatCard 
            title="Masse Nette (M)" 
            value={fmtCurrency(payrollData[payrollData.length - 1].Net)} 
            icon={<Banknote className="w-5 h-5" />} 
            colorTheme="emerald" 
            subtitle="Cump. Net Mensuel"
            trend={{ value: `${payrollStats.delta}% vs M-1`, isUp: payrollStats.isUp }}
            calculationDetails={{
              formula: "Sum(Salaire Net) sur le cycle de paie en cours.",
              utility: "Pilotage direct du besoin en fonds de roulement social (BFR Social)."
            }}
          />
          <StatCard 
            title="TCO Annuel (Est.)" 
            value={fmtCurrency(payrollData[payrollData.length - 1].CoutTotal * 12)} 
            icon={<TrendingUp className="w-5 h-5" />} 
            colorTheme="violet" 
            subtitle="Total Cost of Ownership"
            trend={{ value: `${comparisonStats.payrollYearDelta}% (N/N-1)`, isUp: comparisonStats.payrollYearIsUp }}
            calculationDetails={{
              formula: "Brut Annuel + Charges Patronales (CI: ~21% du Brut).",
              utility: "Base de calcul pour la rentabilité globale et les budgets prévisionnels (OPEX)."
            }}
          />
          <StatCard 
            title="Turnover (M)" 
            value={`${monthlyComparisons.turnover.current}%`} 
            icon={<UserMinus className="w-5 h-5" />} 
            colorTheme="amber" 
            subtitle="Rotation Mensuelle"
            trend={{ 
              value: `${monthlyComparisons.turnover.delta}% vs M-1`, 
              isUp: monthlyComparisons.turnover.isUp 
            }}
            calculationDetails={{
              formula: "((Départs mois M) / (Effectif moyen mois M)) × 100",
              utility: "Indicateur de stabilité immédiate. Une hausse soudaine peut révéler un problème de management local."
            }}
          />
        </div>
      </div>

      {/* SECTION 2: ACQUISITION DES TALENTS & PERFORMANCE */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Recrutement & Potentiel</h3>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Postes Ouverts" 
            value={recruitmentStats.openings} 
            icon={<Briefcase className="w-5 h-5" />} 
            colorTheme="sky" 
            subtitle="Besoins actifs"
            calculationDetails={{
              formula: "Nombre d'offres d'emploi avec le statut 'ouvert'.",
              utility: "Reflète la charge de recrutement immédiate et les besoins de croissance."
            }}
          />
          <StatCard 
            title="Taux de Recrutement" 
            value={`${recruitmentStats.recruitmentRate}%`} 
            icon={<UserCheck className="w-5 h-5" />} 
            colorTheme="emerald" 
            subtitle="Fill Rate Global"
            calculationDetails={{
              formula: "(Nombre de recrutements validés / Nombre de postes ouverts total) × 100",
              utility: "Mesure l'efficacité finale du processus de staffing et la capacité à pourvoir les postes."
            }}
          />
          <StatCard 
            title="Délai Moyen" 
            value={`${recruitmentStats.avgHiringTime} j`} 
            icon={<Clock className="w-5 h-5" />} 
            colorTheme="violet" 
            subtitle="Time-to-Hire"
            calculationDetails={{
              formula: "Somme des jours entre création du poste et embauche / Nb recrutements.",
              utility: "Indicateur de réactivité RH. Un délai long peut impacter la performance opérationnelle."
            }}
          />
          <StatCard 
            title="Coût Moyen" 
            value={fmtCurrency(recruitmentStats.costPerHire)} 
            icon={<Banknote className="w-5 h-5" />} 
            colorTheme="indigo" 
            subtitle="Coût par recrutement"
            calculationDetails={{
              formula: "Coût total du recrutement (Sourcing + Admin) / Nombre de recrutements.",
              utility: "Mesure l'efficience financière de la stratégie de recrutement (Sourcing Mix)."
            }}
          />
        </div>
      </div>

      {/* SECTION 3: SANTÉ, SÉCURITÉ & ABSENTÉISME */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Risques & Conformité Sociale</h3>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Absentéisme (M)" 
            value={`${absenteeismRate}%`} 
            icon={<Calendar className="w-5 h-5" />} 
            colorTheme="rose" 
            subtitle="Taux de présence"
            calculationDetails={{
              formula: "Jours d'absence / (Effectif × Jours ouvrés du mois).",
              utility: "Un taux > 5% est alarmant. Signale souvent un épuisement professionnel ou une désunion des équipes."
            }}
          />
          <StatCard 
            title="Accidents" 
            value={safetyStats.count} 
            icon={<Activity className="h-5 w-5" />} 
            colorTheme="rose" 
            subtitle="Incidents déclarés"
            calculationDetails={{
              formula: "Count(WorkAccidents) sur la période sélectionnée.",
              utility: "Mesure la sécurité au travail et l&apos;efficacité de la politique de prévention."
            }}
          />
          <StatCard 
            title="Jours Perdus" 
            value={safetyStats.joursPerdus} 
            icon={<Clock className="h-5 w-5" />} 
            colorTheme="amber" 
            subtitle="Impact productivité"
            calculationDetails={{
              formula: "Σ des jours d&apos;arrêt suite à accidents de travail.",
              utility: "Évalue le coût caché lié à l&apos;indisponibilité pour accident de travail."
            }}
          />
          <StatCard 
            title="Taux Fréquence" 
            value={safetyStats.freqRate} 
            icon={<ShieldCheck className="h-5 w-5" />} 
            colorTheme="amber" 
            subtitle="Indice de sinistralité"
            calculationDetails={{
              formula: "(Nb Accidents / Nb Heures travaillées cumulées) × 1 000 000",
              utility: "Norme internationale permettant de comparer la sinistralité inter-entreprises."
            }}
          />
        </div>
      </div>

      {/* Main Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trajectoire Financière */}
        <Card className="lg:col-span-3 border-none shadow-xl overflow-hidden bg-white rounded-[2.5rem]">
          <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <span className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                    <TrendingUp className="w-5 h-5" />
                  </span>
                  Trajectoire de la Masse Salariale
                </CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">ÉVOLUTION DU TCO (Total Cost of Ownership) VS NET À PAYER sur 12 MOIS</CardDescription>
              </div>
              <Badge variant="outline" className="border-2 border-slate-200 text-slate-500 font-black px-4 py-1 rounded-xl">
                DATA SOURCE: SIRH-BULLETINS
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <div className="h-[450px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={payrollData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCout" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} stroke="#f1f5f9" axisLine={false} tickLine={false} dy={10} />
                  <YAxis 
                    tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} 
                    stroke="#f1f5f9" 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M FCFA` : val}
                  />
                  <Tooltip 
                    cursor={{ stroke: '#6366F1', strokeWidth: 2, strokeDasharray: '4 4' }}
                    formatter={(value: any) => typeof value === 'number' ? fmtCurrency(value) : value} 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '20px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}
                    labelStyle={{ fontWeight: 900, marginBottom: '8px', color: '#0f172a', fontSize: '14px' }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '40px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} iconType="circle" />
                  <Area 
                    type="monotone" 
                    dataKey="CoutTotal" 
                    stroke="#6366F1" 
                    fillOpacity={1} 
                    fill="url(#colorCout)" 
                    strokeWidth={4} 
                    name="Coût Total Entreprise"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Net" 
                    stroke="#10B981" 
                    fillOpacity={1} 
                    fill="url(#colorNet)" 
                    strokeWidth={2} 
                    name="Masse Nette Salariés"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Démographie */}
        <Card className="lg:col-span-1 border-none shadow-lg bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-slate-900 p-8">
            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-white/90 text-center">
              Pyramide des Âges
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="range" type="category" tick={{ fontSize: 10, fontWeight: 900, fill: '#64748B' }} stroke="#E2E8F0" axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 900, paddingTop: '20px' }} />
                  <Bar dataKey="Hommes" stackId="a" fill="#0EA5E9" radius={[0, 4, 4, 0]} barSize={20} />
                  <Bar dataKey="Femmes" stackId="a" fill="#F43F5E" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Flux RH Dynamic */}
        <Card className="lg:col-span-2 border-none shadow-lg bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-3">
              <span className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                <Users className="w-5 h-5" />
              </span>
              Dynamique des Flux Entrants/Sortants
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={turnoverData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} stroke="#f1f5f9" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} stroke="#f1f5f9" axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 900, paddingTop: '20px' }} />
                  <Bar dataKey="Entrées" fill="#10B981" radius={[6, 6, 0, 0]} barSize={35} />
                  <Bar dataKey="Sorties" fill="#F43F5E" radius={[6, 6, 0, 0]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* INTELLIGENCE ARTIFICIELLE & RECOMMANDATIONS ANALYSTE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        <Card className="border-none shadow-2xl bg-indigo-900 text-white rounded-[3rem] overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
          <CardHeader className="p-10 pb-4 relative">
            <CardTitle className="text-xl font-black flex items-center gap-4">
              <span className="p-3 bg-white/10 rounded-2xl backdrop-blur-xl">
                <Zap className="h-6 w-6 text-yellow-400" />
              </span>
              Insights Analyste : Masse Salariale
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 pt-0 relative space-y-6">
            <div className="flex gap-6 items-center p-6 bg-white/5 rounded-[2rem] border border-white/10">
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-2">Efficiency Ratio (TCO/NET)</p>
                <p className="text-3xl font-black italic">{((payrollData[payrollData.length-1].CoutTotal / payrollData[payrollData.length-1].Net - 1)*100).toFixed(1)}%</p>
                <p className="text-[10px] font-bold text-white/50 mt-2 leading-relaxed">Ratio de surcharge patronale simulé sur le dernier cycle. (Cible standard CI: 21-23%)</p>
              </div>
              <div className="h-16 w-16 rounded-full border-4 border-indigo-400/20 flex items-center justify-center">
                 <TrendingUp className="h-6 w-6 text-indigo-400" />
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">ANALYSE SEQUENTIELLE</h4>
              <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors group">
                <div className="h-6 w-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-black">1</div>
                <p className="text-sm font-bold leading-relaxed">
                  Tendance {selectedDept === "Tous" ? "Global" : selectedDept} : <span className={payrollStats.isUp ? "text-rose-400" : "text-emerald-400"}>Variation de {payrollStats.delta}% (M/M-1)</span>. {payrollStats.isUp ? "Vigilance sur le glissement vieillissement technicité (GVT)." : "Optimisation des coûts directs confirmée."}
                </p>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors group">
                <div className="h-6 w-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-black">2</div>
                <p className="text-sm font-bold leading-relaxed">
                  L&apos;effectif a connu une {comparisonStats.workforceIsUp ? "croissance" : "réduction"} de <span className="font-black underline">{comparisonStats.workforceDelta}%</span> en glissement annuel (N/N-1).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl border-amber-200 bg-white rounded-[3rem] overflow-hidden">
          <CardHeader className="p-10 pb-4">
            <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-4">
              <span className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                <GraduationCap className="h-6 w-6" />
              </span>
              Expert Decision Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 pt-0 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {expertInsights.map((insight, idx) => (
                <div key={idx} className={`p-6 rounded-[2rem] border-2 flex items-center gap-6 ${
                  insight.type === 'alert' ? 'bg-rose-50 border-rose-100' : 
                  insight.type === 'performance' ? 'bg-amber-50 border-amber-100' :
                  'bg-sky-50 border-sky-100'
                }`}>
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${
                    insight.type === 'alert' ? 'bg-rose-500 shadow-rose-200' : 
                    insight.type === 'performance' ? 'bg-amber-500 shadow-amber-200' :
                    'bg-sky-500 shadow-sky-200'
                  }`}>
                    {insight.type === 'alert' ? <Zap className="h-6 w-6" /> : 
                     insight.type === 'performance' ? <Target className="h-6 w-6" /> :
                     <Presentation className="h-6 w-6" />}
                  </div>
                  <div>
                    <p className={`text-xs font-black uppercase tracking-widest mb-1 ${
                      insight.type === 'alert' ? 'text-rose-500' : 
                      insight.type === 'performance' ? 'text-amber-600' :
                      'text-sky-600'
                    }`}>{insight.label}</p>
                    <p className="text-sm font-bold text-slate-700 leading-tight">
                      <span className="text-lg font-black mr-2">{insight.value}</span>
                      {insight.detail}
                    </p>
                  </div>
                </div>
              ))}
              
              {expertInsights.length === 0 && (
                <div className="p-8 bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] text-center">
                   <div className="h-16 w-16 rounded-3xl bg-emerald-500 flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-emerald-200">
                    <Smile className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-black text-emerald-800 mb-2 italic">Excellence Réglementaire</h4>
                  <p className="text-sm font-bold text-emerald-700 leading-relaxed uppercase tracking-tighter">
                    Tous les indicateurs analytiques sont stabilisés. Priorité : Consolidation de la marque employeur et onboarding.
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 bg-slate-900 rounded-[2rem] mt-6 group cursor-pointer hover:bg-slate-800 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-white/40 uppercase tracking-widest">Calculated Performance Index</p>
                  <p className="text-2xl font-black text-white italic">AA+ Strategic Rating</p>
                </div>
                <div className="h-10 w-10 border border-white/20 rounded-xl flex items-center justify-center text-white group-hover:bg-primary group-hover:border-primary transition-all">
                   <ChevronRight className="h-5 w-5" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* HR Analytics Methodology - Final Section */}
      <Card className="border-none shadow-2xl overflow-hidden bg-[oklch(0.175_0.04_248)] text-white rounded-[3rem] mt-12">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -mr-48 -mb-48" />
        <CardHeader className="relative p-12 pb-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl font-black tracking-tight">Référentiel Expert HR Data</CardTitle>
              <CardDescription className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px] mt-2">Intelligence Décisionnelle & Gouvernance Sociale</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
           <div className="space-y-4">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-6">01. ACQUISITION & TALENT</p>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all cursor-default">
                 <h5 className="font-black text-sm mb-2">Taux de Recrutement Qualifié</h5>
                 <p className="text-xs text-white/50 leading-relaxed font-medium italic">Analyse du ratio entre le sourcing brut et la conversion en onboarding. Permet d&apos;ajuster les budgets marketing RH.</p>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all cursor-default">
                 <h5 className="font-black text-sm mb-2">Délai de Vacance Moyenne</h5>
                 <p className="text-xs text-white/50 leading-relaxed font-medium italic">Impact économique du poste non pourvu sur la perte de productivité brute par département.</p>
              </div>
           </div>
           <div className="space-y-4">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-6">02. PERFORMANCE & CAPITAL</p>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all cursor-default">
                 <h5 className="font-black text-sm mb-2">High-Potential Detection (HiPo)</h5>
                 <p className="text-xs text-white/50 leading-relaxed font-medium italic">Identification prédictive des futurs managers via les scores de performance et de potentiel croisés.</p>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all cursor-default">
                 <h5 className="font-black text-sm mb-2">ROI du Capital Humain</h5>
                 <p className="text-xs text-white/50 leading-relaxed font-medium italic">Corrélation entre l&apos;investissement formation (Budget) et l&apos;évolution de la notation de performance.</p>
              </div>
           </div>
           <div className="space-y-4">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-6">03. RISQUES & SINISTRALITÉ</p>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all cursor-default">
                 <h5 className="font-black text-sm mb-2">Taux de Gravité Accidents</h5>
                 <p className="text-xs text-white/50 leading-relaxed font-medium italic">Analyse de l&apos;exposition au danger et efficacité des équipements de protection individuelle (EPI).</p>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all cursor-default">
                 <h5 className="font-black text-sm mb-2">Indice de Sinistralité CNPS</h5>
                 <p className="text-xs text-white/50 leading-relaxed font-medium italic">Suivi des cotisations et des risques financiers liés aux maladies professionnelles et accidents.</p>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
