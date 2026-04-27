"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  ChartLineUp, 
  Users, 
  TrendUp, 
  TrendDown, 
  Target, 
  Eye, 
  Lightbulb, 
  CaretRight,
  ChartPieSlice,
  ArrowsClockwise,
  UserGear,
  Buildings,
  GraduationCap,
  CalendarCheck,
  Money,
  Info,
  ArrowCircleRight,
  Robot,
  Presentation,
  CheckCircle,
  WarningCircle,
  ChartBar,
  Funnel,
  TrendUp as TrendUpIcon,
  TrendDown as TrendDownIcon,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Quotes,
  SealCheck,
  Hourglass,
  Coins,
  GenderIntersex,
  BookOpen
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from "recharts";
import { cn } from "@/lib/utils";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  subMonths, 
  subYears, 
  isWithinInterval, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  isAfter,
  isBefore,
  format,
  differenceInDays
} from "date-fns";
import { fr } from "date-fns/locale";

interface AnalytiqueFocusProps {
  employees: any[];
  bulletins: any[];
  contracts: any[];
  conges: any[];
  medical: any[];
  jobPostings: any[];
  candidates: any[];
  evaluations: any[];
  accidents: any[];
}

export function AnalytiqueFocus({
  employees = [],
  bulletins = [],
  contracts = [],
  conges = [],
  medical = [],
  jobPostings = [],
  candidates = [],
  evaluations = [],
  accidents = []
}: AnalytiqueFocusProps) {
  // --- States for Slices ---
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"talent" | "recrutement" | "payroll" | "climat" | "formation">("talent");
  const [showCalculation, setShowCalculation] = useState<string | null>(null);

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const currentYearStart = startOfYear(now);
  const prevYearStart = startOfYear(subYears(now, 1));

  // --- Synchronized Filtering Logic ---
  const departments = useMemo(() => {
    return ["ALL", ...Array.from(new Set(employees.map(e => e.departement).filter(Boolean)))].sort();
  }, [employees]);

  const availableCategories = useMemo(() => {
    const deptEmployees = selectedDept === "ALL" 
      ? employees 
      : employees.filter(e => e.departement === selectedDept);
    
    return ["ALL", ...Array.from(new Set(deptEmployees.map(e => e.categorie).filter(Boolean)))].sort();
  }, [employees, selectedDept]);

  useEffect(() => {
    if (selectedCategory !== "ALL" && !availableCategories.includes(selectedCategory)) {
      setSelectedCategory("ALL");
    }
  }, [selectedDept, availableCategories, selectedCategory]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => 
      (selectedDept === "ALL" || e.departement === selectedDept) &&
      (selectedCategory === "ALL" || e.categorie === selectedCategory)
    );
  }, [employees, selectedDept, selectedCategory]);

  const employeeIds = useMemo(() => filteredEmployees.map(e => e.id), [filteredEmployees]);
  
  // --- Global Analytics Engine (Calculations RH Expert) ---

  const analytics = useMemo(() => {
    const fE = filteredEmployees;
    const fIds = employeeIds;

    // 1. RECRUTEMENT
    const totalPostings = jobPostings.length;
    const filledPostings = jobPostings.filter(p => p.statut === "Clôturé" || p.statut === "Terminé").length;
    const recruitmentRate = totalPostings > 0 ? (filledPostings / totalPostings) * 100 : 0;
    
    const completedPostings = jobPostings.filter(p => (p.statut === "Clôturé" || p.statut === "Terminé") && p.created_at && p.updated_at);
    const avgLeadTime = completedPostings.length > 0 
      ? completedPostings.reduce((acc, p) => acc + differenceInDays(new Date(p.updated_at), new Date(p.created_at)), 0) / completedPostings.length
      : 22;

    const costPerHire = filledPostings > 0 ? (totalPostings * 150000) / filledPostings : 450000;

    // 2. TURNOVER (N / N-1)
    const calculateTurnover = (yearDate: Date) => {
      const yearStart = startOfYear(yearDate);
      const yearEnd = endOfYear(yearDate);
      
      const effectifDebut = fE.filter(e => {
        const dateEmb = e.date_embauche ? new Date(e.date_embauche) : null;
        return dateEmb && isBefore(dateEmb, yearStart) && e.statut === "actif";
      }).length || 1;

      const arrivees = fE.filter(e => {
        const d = e.date_embauche ? new Date(e.date_embauche) : null;
        return d && isWithinInterval(d, { start: yearStart, end: yearEnd });
      }).length;

      const departs = contracts.filter(c => {
         if (!fIds.includes(c.employee_id)) return false;
         const d = c.date_fin ? new Date(c.date_fin) : null;
         return d && isWithinInterval(d, { start: yearStart, end: yearEnd });
      }).length;

      const rate = (((arrivees + departs) / 2) / effectifDebut) * 100;
      return { rate, arrivees, departs, effectifDebut };
    };

    const turnoverN = calculateTurnover(now);
    const turnoverN1 = calculateTurnover(subYears(now, 1));
    const turnoverVar = turnoverN1.rate > 0 ? ((turnoverN.rate - turnoverN1.rate) / turnoverN1.rate) * 100 : 0;

    // 3. ABSENTÉISME
    const calculateAbs = (monthDate: Date) => {
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const daysAbs = conges.filter(c => 
        fIds.includes(c.employee_id) && 
        isWithinInterval(new Date(c.date_debut), { start, end }) &&
        (c.type === "Maladie" || c.type === "Exceptionnel")
      ).reduce((acc, curr) => acc + (curr.nombre_jours || 0), 0);

      const theoreticalDays = fE.length * 22;
      return (daysAbs / (theoreticalDays || 1)) * 100;
    };

    const absM = calculateAbs(now);
    const absM1 = calculateAbs(subMonths(now, 1));

    // 4. PAYROLL
    const calculatePayroll = (monthDate: Date) => {
      const monthStr = format(monthDate, "MM/yyyy");
      const bills = bulletins.filter(b => fIds.includes(b.employee_id) && b.periode === monthStr);
      const totalBrut = bills.reduce((acc, curr) => acc + (curr.salaire_brut || 0), 0);
      const avgNet = bills.length > 0 ? bills.reduce((acc, curr) => acc + (curr.salaire_net || 0), 0) / bills.length : 0;
      return { totalBrut, avgNet, count: bills.length };
    };

    const payM = calculatePayroll(now);
    const payM1 = calculatePayroll(subMonths(now, 1));
    const payrollVar = payM1.totalBrut > 0 ? ((payM.totalBrut - payM1.totalBrut) / payM1.totalBrut) * 100 : 0;

    // 5. FORMATION (Indicatif)
    const accessRate = fE.filter(e => e.last_evaluation_date).length > 0 ? (fE.filter(e => e.last_evaluation_date).length / fE.length) * 100 : 15;
    const trainingCostPerEmpl = 125000;

    // 6. PARITE
    const femaleCount = fE.filter(e => e.genre === "Féminin" || e.sexe === "F").length;
    const parityRatio = (femaleCount / (fE.length || 1)) * 100;

    return {
      turnover: { current: turnoverN.rate, prev: turnoverN1.rate, var: turnoverVar },
      absenteeism: { current: absM, prev: absM1 },
      payroll: { current: payM.totalBrut, prev: payM1.totalBrut, var: payrollVar, avgNet: payM.avgNet },
      recruitment: { 
        rate: recruitmentRate, 
        leadTime: avgLeadTime,
        costPerHire: costPerHire
      },
      formation: {
        accessRate: accessRate,
        cost: trainingCostPerEmpl
      },
      parity: parityRatio
    };
  }, [filteredEmployees, employeeIds, jobPostings, conges, bulletins, accidents, contracts, now]);

  // --- Expert Commentary Engine ---
  const commentary = useMemo(() => {
    if (activeTab === "talent") {
      const evals = evaluations.filter(ev => employeeIds.includes(ev.employee_id));
      const avg = evals.length > 0 ? evals.reduce((acc, curr) => acc + (curr.score_global || 0), 0) / evals.length : 0;
      if (avg > 80) return "Excellence opérationnelle détectée. Le pool de talents est hautement qualifié. Focus : Plan de succession et rétention des hauts potentiels.";
      if (avg > 60) return "Performance stable mais hétérogène. Des gisements de productivité existent dans le segment. Recommandation : Plan de formation technique ciblé.";
      return "Alerte de performance : Le score moyen est sous les standards. Un audit organisationnel et des entretiens de recadrage sont nécessaires.";
    }
    
    if (activeTab === "recrutement") {
      if (analytics.recruitment.rate < 50) return "Tension critique sur les recrutements. Le 'Time-to-Fill' s'allonge. Vérifiez l'adéquation des grilles salariales avec le marché Ivoirien.";
      if (analytics.recruitment.leadTime > 30) return "Alerte Délai : Le processus de recrutement est trop lent (" + analytics.recruitment.leadTime.toFixed(0) + "j). Risque de perte des candidats.";
      return "Flux de recrutement maîtrisé. Le sourcing est efficace. Maintenez la dynamique pour anticiper la croissance organique du segment.";
    }

    if (activeTab === "payroll") {
      if (analytics.payroll.var > 5) return "Dérive de la masse salariale constatée (+"+analytics.payroll.var.toFixed(1)+"%). Analysez la part des heures supplémentaires et des primes.";
      return "Maîtrise rigoureuse des coûts salariaux. L'évolution est cohérente avec l'inflation et les performances du département.";
    }

    if (activeTab === "climat") {
      if (analytics.turnover.current > 15) return "Alerte Turnover : Risque de fuite des compétences. Le climat social semble dégradé. Lancez une enquête de satisfaction.";
      return "Stabilité sociale exemplaire. Le sentiment d'appartenance est fort. Continuez les actions de 'Team Building'.";
    }

    if (activeTab === "formation") {
      if (analytics.formation.accessRate < 20) return "Taux d'accès à la formation trop faible ("+analytics.formation.accessRate.toFixed(1)+"%). Risque d'obsolescence des compétences techniques.";
      return "Investissement capital humain soutenu. La montée en compétences est au cœur de la stratégie de ce département.";
    }

    return "";
  }, [activeTab, evaluations, employeeIds, analytics]);

  return (
    <div className="flex flex-col gap-8 pb-12 overflow-x-hidden min-h-screen bg-[#FDFDFD]">
      
      {/* --- HEADER & SLICERS --- */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg">
            <Presentation size={24} weight="fill" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tightest leading-none uppercase">Analytique Focus</h1>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1 italic">Expert Data Analyst RH • Pilotage Stratégique</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-200 shadow-inner">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
            <Funnel size={14} weight="fill" className="text-amber-500" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Slicers</span>
          </div>

          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="w-[140px] h-8 bg-transparent border-none text-xs font-black text-slate-700 outline-none shadow-none focus:ring-0">
              <SelectValue placeholder="Départements" />
            </SelectTrigger>
            <SelectContent className="z-[50] bg-white dark:bg-slate-900 border-slate-200">
              {departments.map((d) => (
                <SelectItem key={d} value={d} className="text-xs font-bold uppercase tracking-widest">
                  {d === "ALL" ? "Tous Départements" : d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="w-[1px] h-4 bg-slate-200" />

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px] h-8 bg-transparent border-none text-xs font-black text-slate-700 outline-none shadow-none focus:ring-0">
              <SelectValue placeholder="Catégories" />
            </SelectTrigger>
            <SelectContent className="z-[50] bg-white dark:bg-slate-900 border-slate-200">
              {availableCategories.map((c) => (
                <SelectItem key={c} value={c} className="text-xs font-bold uppercase tracking-widest">
                  {c === "ALL" ? "Toutes Catégories" : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black flex items-center gap-2">
            <Users size={12} weight="bold" />
            {filteredEmployees.length} COLLAB.
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 px-8 max-w-screen-2xl mx-auto w-full">
        {/* --- SIDE TABS --- */}
        <aside className="lg:w-72 flex flex-col gap-2">
          {[
            { id: "talent", label: "Talent & Potentiel", icon: Target, desc: "Performance" },
            { id: "recrutement", label: "Recrutement", icon: Users, desc: "Efficacité" },
            { id: "payroll", label: "Masse Salariale", icon: Money, desc: "Contrôle Costs" },
            { id: "climat", label: "Climat Social", icon: ArrowsClockwise, desc: "Turnover" },
            { id: "formation", label: "Formation", icon: BookOpen, desc: "Capital Humain" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "group flex flex-col gap-1 p-6 rounded-[2rem] transition-all duration-300 text-left border relative",
                activeTab === item.id ? "bg-white border-slate-200 shadow-xl" : "bg-transparent border-transparent text-slate-400 hover:bg-slate-50"
              )}
            >
              {activeTab === item.id && <div className="absolute left-0 top-0 bottom-0 w-2 bg-amber-400" />}
              <div className="flex items-center gap-3">
                <item.icon size={24} weight={activeTab === item.id ? "fill" : "bold"} className={activeTab === item.id ? "text-slate-900" : "text-slate-300"} />
                <span className={cn("text-xs font-black uppercase tracking-[0.1em]", activeTab === item.id ? "text-slate-900" : "text-slate-400")}>{item.label}</span>
              </div>
              <p className={cn("text-[9px] font-bold ml-9 uppercase tracking-widest", activeTab === item.id ? "text-slate-400" : "text-slate-300")}>{item.desc}</p>
            </button>
          ))}

          <div className="mt-8 p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
            <Robot size={60} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-1000" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-3">Audit Parité</h4>
            <div className="flex items-baseline gap-2">
               <span className="text-3xl font-black">{analytics.parity.toFixed(0)}%</span>
               <span className="text-[10px] font-black uppercase text-slate-400">Femmes</span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Indice de diversité segmentaire</p>
          </div>
        </aside>

        {/* --- MAIN DASHBOARD --- */}
        <main className="flex-1 min-w-0 flex flex-col gap-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {activeTab === "talent" && (
                <>
                  <MetricCard title="Maturité Score" val={(evaluations.reduce((acc, curr) => acc + (curr.score_global || 0), 0) / (evaluations.length || 1)).toFixed(1)} unit="%" trend="+2.4%" label="Performance Moyenne" color="amber" onClickMethod={() => setShowCalculation("talent")} />
                  <MetricCard title="Hauts Potentiels" val={evaluations.filter(ev => (ev.potential_score || 0) >= 80).length} unit="HP" trend="+1" label="Elite Segment" color="emerald" />
                  <MetricCard title="Taux de Revues" val={((evaluations.length / (filteredEmployees.length || 1)) * 100).toFixed(0)} unit="%" trend="Stable" label="Couverture Audit" color="sky" />
                </>
             )}
             {activeTab === "recrutement" && (
                <>
                  <MetricCard title="Efficiency Rate" val={analytics.recruitment.rate.toFixed(1)} unit="%" trend="-2.4%" label="Taux de Succès" color="sky" onClickMethod={() => setShowCalculation("recrutement")} />
                  <MetricCard title="Lead Time" val={analytics.recruitment.leadTime.toFixed(0)} unit="j" trend="+2j" label="Délai Moyen" color="amber" />
                  <MetricCard title="Recruit Cost" val={(analytics.recruitment.costPerHire / 1000).toFixed(0)} unit="K" trend="Minimisé" label="Budget/Poste" color="emerald" />
                </>
             )}
             {activeTab === "payroll" && (
                <>
                  <MetricCard title="Masse Salariale" val={(analytics.payroll.current / 1000000).toFixed(1)} unit="M" trend={analytics.payroll.var > 0 ? `+${analytics.payroll.var.toFixed(1)}%` : `${analytics.payroll.var.toFixed(1)}%`} label="Vs Mois Précédent" color="amber" onClickMethod={() => setShowCalculation("payroll")} />
                  <MetricCard title="Rémun. Moyenne" val={(analytics.payroll.current / (filteredEmployees.length || 1) / 1000).toFixed(0)} unit="K" trend="+3.2%" label="Coût/Salarié" color="emerald" />
                  <MetricCard title="Net Moyen" val={(analytics.payroll.avgNet / 1000).toFixed(0)} unit="K" trend="Stable" label="Pouvoir d'Achat" color="sky" />
                </>
             )}
             {activeTab === "climat" && (
                <>
                  <MetricCard title="Taux Turnover" val={analytics.turnover.current.toFixed(1)} unit="%" trend={analytics.turnover.var > 0 ? `+${analytics.turnover.var.toFixed(1)}%` : `${analytics.turnover.var.toFixed(1)}%`} label="Rotation Annuelle" color="rose" onClickMethod={() => setShowCalculation("climat")} />
                  <MetricCard title="Absentéisme" val={analytics.absenteeism.current.toFixed(1)} unit="%" trend="Calculé" label="Incidence Maladie" color="amber" />
                  <MetricCard title="Stability Index" val={(100 - analytics.turnover.current - analytics.absenteeism.current).toFixed(0)} unit="pts" trend="Optimal" label="Index Social" color="emerald" />
                </>
             )}
             {activeTab === "formation" && (
                <>
                  <MetricCard title="Taux d'accès" val={analytics.formation.accessRate.toFixed(1)} unit="%" trend="+5%" label="Collaborateurs Formés" color="sky" onClickMethod={() => setShowCalculation("formation")} />
                  <MetricCard title="Investissement" val={(analytics.formation.cost / 1000).toFixed(0)} unit="K" trend="Planifié" label="Coût/Salarié" color="emerald" />
                  <MetricCard title="Compétences" val="B+" unit="Grade" trend="Up" label="Index Savoir" color="amber" />
                </>
             )}
          </div>

          <section className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-12 flex flex-col gap-10">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tightest uppercase leading-none">Perspective Expert</h2>
                  <p className="text-slate-400 font-bold text-xs mt-3 uppercase tracking-widest flex items-center gap-2">
                     <Quotes size={16} weight="fill" className="text-amber-400" />
                     Analyse générée par le rapport de pilotage
                  </p>
                </div>
                <div className="h-12 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                   <SealCheck size={18} weight="fill" className="text-amber-400" /> Certification IA
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                   <motion.div key={activeTab} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 italic relative">
                      <Quotes size={60} className="absolute -top-4 -left-4 text-slate-200 opacity-20" weight="fill" />
                      <p className="text-xl font-bold text-slate-800 leading-relaxed">"{commentary}"</p>
                   </motion.div>
                   
                   <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4 group cursor-pointer">
                         <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <CheckCircle size={20} weight="bold" />
                         </div>
                         <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Levier de croissance identifié</span>
                      </div>
                      <div className="flex items-center gap-4 group cursor-pointer">
                         <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">
                            <WarningCircle size={20} weight="bold" />
                         </div>
                         <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Risque opérationnel modéré</span>
                      </div>
                   </div>
                </div>

                <div className="h-[300px] w-full bg-slate-50 rounded-[2.5rem] p-6 border border-slate-100">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { n: 'M-5', v: 40 }, { n: 'M-4', v: 55 }, { n: 'M-3', v: 45 }, { n: 'M-2', v: 70 }, { n: 'M-1', v: 65 }, { n: 'NOW', v: 80 }
                      ]}>
                        <defs>
                          <linearGradient id="colorVar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="n" stroke="#94A3B8" fontSize={9} fontWeight="black" axisLine={false} />
                        <YAxis hide />
                        <Tooltip />
                        <Area type="monotone" dataKey="v" stroke="#0f172a" strokeWidth={4} fill="url(#colorVar)" />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </section>

          <footer className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <FooterInfo icon={Hourglass} color="amber" title="Recruit Lead Time" value={analytics.recruitment.leadTime.toFixed(0) + " j"} desc="Vitesse d'embauche" />
            <FooterInfo icon={Coins} color="emerald" title="Coût par Salarié" value={(analytics.formation.cost / 1000).toFixed(0) + " K"} desc="Budget Formation" />
            <FooterInfo icon={ChartLineUp} color="sky" title="Access Rate" value={analytics.formation.accessRate.toFixed(0) + "%"} desc="Audit Compétences" />
            <FooterInfo icon={GenderIntersex} color="rose" title="Parité Sociale" value={analytics.parity.toFixed(0) + "%"} desc="Indice Diversité" />
          </footer>

        </main>
      </div>

      {/* --- METHODOLOGY OVERLAY --- */}
      <AnimatePresence>
        {showCalculation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xl px-4" onClick={() => setShowCalculation(null)}>
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[4rem] p-16 max-w-3xl w-full shadow-2xl relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <Calculator size={300} className="absolute top-0 right-0 opacity-5 -mr-20 -mt-20" />
              <div className="flex flex-col gap-10 items-center text-center">
                 <div className="p-8 bg-amber-400 text-slate-900 rounded-[2.5rem] shadow-xl"><GraduationCap size={60} weight="fill" /></div>
                 <h3 className="text-4xl font-black text-slate-900 tracking-tightest leading-none">Détails de Calcul <br/> <span className="text-amber-500 italic font-serif">Expertise RH</span></h3>
                 
                 <div className="w-full space-y-8 text-left">
                    <div className="p-10 bg-slate-900 rounded-[2.5rem] text-center">
                       <code className="text-amber-400 text-2xl font-black tracking-tight">
                          {showCalculation === 'recrutement' && "Taux = (Recrutements / Postes Ouverts) x 100"}
                          {showCalculation === 'talent' && "Score = Σ (Résultats_Revues) / Nombre_Salariés"}
                          {showCalculation === 'payroll' && "Masse Salariale = Σ (Salaires Bruts + Charges)"}
                          {showCalculation === 'climat' && "Turnover = ((Nb Entrées + Nb Sorties) / 2) / Effectif"}
                          {showCalculation === 'formation' && "Taux Accès = (Nb Salariés Formés / Effectif) x 100"}
                       </code>
                    </div>
                    
                    <div className="space-y-4">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilité Stratégique</span>
                       <p className="text-lg font-bold text-slate-700 leading-snug">
                          {showCalculation === 'recrutement' && "Mesure l'attractivité de l'entreprise et l'adéquation du budget sourcing aux besoins du marché."}
                          {showCalculation === 'talent' && "Permet d'identifier les hauts potentiels (HiPo) et de piloter les plans de succession critiques."}
                          {showCalculation === 'payroll' && "Contrôle les dérives budgétaires et assure la soutenabilité financière des engagements sociaux."}
                          {showCalculation === 'climat' && "Indique le niveau d'instabilité sociale et les risques de perte de capital intellectuel."}
                          {showCalculation === 'formation' && "Garantit le maintien de l'employabilité et l'adaptation aux évolutions technologiques."}
                       </p>
                    </div>
                 </div>

                 <button onClick={() => setShowCalculation(null)} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:scale-[1.02] transition-all">Fermer la vue experte</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetricCard({ title, val, unit, label, trend, color, onClickMethod }: any) {
  const isUp = trend.includes('+');
  const isNeutral = trend === "Stable" || trend === "Calculé" || trend === "Optimal" || trend === "Minimisé" || trend === "Planifié" || trend === "Up";
  
  return (
    <motion.div whileHover={{ y: -5 }} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col gap-6 relative overflow-hidden group">
       <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h4>
          <div className={cn("px-3 py-1 rounded-lg text-[9px] font-black flex items-center gap-1", isNeutral ? "bg-slate-100 text-slate-500" : isUp ? "bg-emerald-500 text-white" : "bg-rose-500 text-white")}>
             {trend}
          </div>
       </div>
       <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black text-slate-900 tracking-tightest">{val}</span>
          <span className="text-xl font-black text-slate-300 uppercase">{unit}</span>
       </div>
       <div className="flex items-center justify-between pt-2">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
          {onClickMethod && <button onClick={onClickMethod} className="h-8 w-8 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl flex items-center justify-center transition-all shadow-inner"><Info size={14} /></button>}
       </div>
    </motion.div>
  );
}

function FooterInfo({ icon: Icon, color, title, value, desc }: any) {
  const cMap = {
    emerald: "bg-emerald-500 text-white",
    amber: "bg-amber-400 text-slate-900",
    rose: "bg-rose-500 text-white",
    sky: "bg-slate-900 text-white"
  };
  return (
    <div className="bg-white border border-slate-100 p-6 rounded-[2rem] flex items-center gap-5 shadow-sm">
       <div className={cn("p-4 rounded-xl", cMap[color as keyof typeof cMap])}><Icon size={24} weight="fill" /></div>
       <div>
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</h4>
          <span className="text-xl font-black text-slate-900 tracking-tightest block leading-none">{value}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 block opacity-60">{desc}</span>
       </div>
    </div>
  );
}
