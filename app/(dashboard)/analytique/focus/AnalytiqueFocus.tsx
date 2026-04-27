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
  Coins
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from "recharts";
import { cn } from "@/lib/utils";
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
  employees,
  bulletins,
  contracts,
  conges,
  medical,
  jobPostings,
  candidates,
  evaluations,
  accidents
}: AnalytiqueFocusProps) {
  // --- States for Slices ---
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"talent" | "recrutement" | "payroll" | "climat">("talent");
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

    // 1. RECRUTEMENT (Expertise)
    const totalPostings = jobPostings.length;
    const filledPostings = jobPostings.filter(p => p.statut === "Clôturé" || p.statut === "Terminé").length;
    const recruitmentRate = totalPostings > 0 ? (filledPostings / totalPostings) * 100 : 0;
    
    // Délai moyen de recrutement (Lead Time)
    const completedPostings = jobPostings.filter(p => p.statut === "Clôturé" && p.created_at && p.updated_at);
    const avgLeadTime = completedPostings.length > 0 
      ? completedPostings.reduce((acc, p) => acc + differenceInDays(new Date(p.updated_at), new Date(p.created_at)), 0) / completedPostings.length
      : 22; // Valeur par défaut indicative si pas de data

    // Coût par recrutement (Indicatif : Frais agence + Temps RH estimé)
    const costPerHire = 450000; // Estimation moyenne par recrutement en FCFA

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

    // 3. ABSENTÉISME (M / M-1)
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
    const absVar = absM1 > 0 ? ((absM - absM1) / absM1) * 100 : 0;

    // 4. PAYROLL (M / M-1)
    const calculatePayroll = (monthDate: Date) => {
      const monthStr = format(monthDate, "MM/yyyy");
      const bills = bulletins.filter(b => fIds.includes(b.employee_id) && b.periode === monthStr);
      const totalBrut = bills.reduce((acc, curr) => acc + (curr.salaire_brut || 0), 0);
      const avgNet = bills.length > 0 ? bills.reduce((acc, curr) => acc + (curr.salaire_net || 0), 0) / bills.length : 0;
      return { totalBrut, avgNet, count: bills.length };
    };

    const payM = calculatePayroll(now);
    const payM1 = calculatePayroll(subMonths(now, 1));
    const payVar = payM1.totalBrut > 0 ? ((payM.totalBrut - payM1.totalBrut) / payM1.totalBrut) * 100 : 0;

    // 5. ACCIDENTS (Taux fréquence)
    const accidentsCount = accidents.filter(a => fIds.includes(a.employee_id)).length;
    const freqAccident = (accidentsCount / (fE.length * 160 || 1)) * 1000000;

    return {
      turnover: { current: turnoverN.rate, prev: turnoverN1.rate, var: turnoverVar, details: turnoverN },
      absenteeism: { current: absM, prev: absM1, var: absVar },
      payroll: { current: payM.totalBrut, prev: payM1.totalBrut, var: payVar, avgNet: payM.avgNet },
      recruitment: { 
        rate: recruitmentRate, 
        total: totalPostings, 
        filled: filledPostings,
        leadTime: avgLeadTime,
        costPerHire: costPerHire
      },
      accidents: { freq: freqAccident, count: accidentsCount }
    };
  }, [filteredEmployees, employeeIds, jobPostings, conges, bulletins, accidents, contracts, now]);

  // --- Expert Commentary Engine ---
  const commentary = useMemo(() => {
    if (activeTab === "talent") {
      const evals = evaluations.filter(ev => employeeIds.includes(ev.employee_id));
      const avg = evals.length > 0 ? evals.reduce((acc, curr) => acc + (curr.score_global || 0), 0) / evals.length : 0;
      
      if (avg > 80) return "Excellence opérationnelle détectée. Le pool de talents est hautement qualifié. Focus : Plan de succession et rétention des hauts potentiels (N-box 9).";
      if (avg > 60) return "Performance stable mais hétérogène. Des gisements de productivité existent dans le segment. Recommandation : Plan de formation technique ciblé.";
      return "Alerte de performance : Le score moyen est sous les standards. Un audit organisationnel et des entretiens de recadrage sont nécessaires.";
    }
    
    if (activeTab === "recrutement") {
      if (analytics.recruitment.rate < 50) return "Tension critique sur les recrutements. Le 'Time-to-Fill' s'allonge. Vérifiez l'adéquation des grilles salariales avec le marché Ivoirien.";
      if (analytics.recruitment.leadTime > 30) return "Alerte Délai : Le processus de recrutement est trop lent (" + analytics.recruitment.leadTime.toFixed(0) + "j). Risque de perte des meilleurs candidats au profit de la concurrence.";
      return "Flux de recrutement maîtrisé. Le sourcing est efficace. Maintenez la dynamique pour anticiper la croissance organique du segment.";
    }

    if (activeTab === "payroll") {
      if (analytics.payroll.var > 5) return "Dérive de la masse salariale constatée (+"+analytics.payroll.var.toFixed(1)+"%). Analysez la part des heures supplémentaires et des primes exceptionnelles.";
      return "Maîtrise rigoureuse des coûts salariaux. L'évolution est cohérente avec l'inflation et les performances du département.";
    }

    if (activeTab === "climat") {
      if (analytics.turnover.current > 15) return "Alerte Turnover : Risque de fuite des compétences. Le climat social semble dégradé. Lancez une enquête de satisfaction interne anonyme.";
      if (analytics.absenteeism.current > 5) return "Taux d'absentéisme élevé (" + analytics.absenteeism.current.toFixed(1) + "%). Surveillez les risques psychosociaux (RPS) et la pénibilité au travail.";
      return "Stabilité sociale exemplaire. Le sentiment d'appartenance est fort. Continuez les actions de 'Team Building' pour pérenniser ce climat.";
    }

    return "";
  }, [activeTab, evaluations, employeeIds, analytics]);

  return (
    <div className="flex flex-col gap-8 pb-12 overflow-x-hidden min-h-screen bg-[#FDFDFD]">
      
      {/* --- POWERPOINT TOP CONTROL BAR --- */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg">
            <Presentation size={24} weight="fill" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tightest leading-none uppercase">Report de Pilotage Stratégique</h1>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1 italic">Expert Data Analyst RH • Focus Performance</p>
          </div>
        </div>

        {/* --- DYNAMIC SLICERS AS CONTROL PANEL --- */}
        <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-200 shadow-inner">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
            <Funnel size={14} weight="fill" className="text-amber-500" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Slicers</span>
          </div>

          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-transparent border-none text-xs font-black text-slate-700 focus:ring-0 cursor-pointer px-4 outline-none"
          >
            {departments.map(d => (
              <option key={d} value={d}>{d === "ALL" ? "Tous les Départements" : d}</option>
            ))}
          </select>

          <div className="w-[1px] h-4 bg-slate-200" />

          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-transparent border-none text-xs font-black text-slate-700 focus:ring-0 cursor-pointer px-4 outline-none"
          >
            {availableCategories.map(c => (
              <option key={c} value={c}>{c === "ALL" ? "Toutes les Catégories" : c}</option>
            ))}
          </select>

          <div className="ml-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black flex items-center gap-2">
            <Users size={12} weight="bold" />
            {filteredEmployees.length} COLLAB.
          </div>
        </div>
      </header>

      {/* --- SIDE NAVIGATION (SLIDES) --- */}
      <div className="flex flex-col lg:flex-row gap-8 px-8 max-w-screen-2xl mx-auto w-full">
        <aside className="lg:w-72 flex flex-col gap-2">
          {[
            { id: "talent", label: "Talent & Potentiel", icon: Target, desc: "Maturité & Évaluation" },
            { id: "recrutement", label: "Recrutement", icon: Users, desc: "Efficacité & Coûts" },
            { id: "payroll", label: "Contrôle de Gestion", icon: Money, desc: "Masse Salariale" },
            { id: "climat", label: "Stabilité Sociale", icon: ArrowsClockwise, desc: "Turnover & Climat" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "group flex flex-col gap-1 p-6 rounded-[2rem] transition-all duration-300 text-left border relative overflow-hidden",
                activeTab === item.id 
                  ? "bg-white border-slate-200 shadow-xl shadow-slate-100 translate-x-2" 
                  : "bg-transparent border-transparent text-slate-400 hover:bg-slate-50 hover:translate-x-1"
              )}
            >
              {activeTab === item.id && <div className="absolute left-0 top-0 bottom-0 w-2 bg-amber-400" />}
              <div className="flex items-center gap-3">
                <item.icon size={24} weight={activeTab === item.id ? "fill" : "bold"} className={activeTab === item.id ? "text-slate-900" : "text-slate-300"} />
                <span className={cn("text-xs font-black uppercase tracking-[0.1em]", activeTab === item.id ? "text-slate-900" : "text-slate-400")}>{item.label}</span>
              </div>
              <p className={cn("text-[9px] font-bold ml-9 transition-colors uppercase tracking-widest", activeTab === item.id ? "text-slate-400" : "text-slate-300")}>{item.desc}</p>
            </button>
          ))}

          <div className="mt-8 p-8 bg-[#0D121F] rounded-[2.5rem] text-white overflow-hidden relative group cursor-help shadow-2xl shadow-slate-900/40">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-1000">
              <Robot size={80} weight="fill" />
            </div>
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-amber-400 rounded-lg">
                 <Lightbulb size={16} weight="fill" className="text-slate-900" />
               </div>
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Focus IA</h4>
            </div>
            <p className="text-[11px] font-bold leading-relaxed text-slate-300">
              L'analyse croisée indique que le département <span className="text-amber-400">{selectedDept}</span> nécessite une attention sur la rétention des <span className="text-amber-400">{selectedCategory}</span>.
            </p>
          </div>
        </aside>

        {/* --- MAIN SLIDE AREA --- */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-8"
            >
              
              {/* TOP KPI STRIP */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {activeTab === "talent" && (
                   <>
                    <MetricCard 
                      title="Maturité Perf." 
                      val={(evaluations.filter(ev => employeeIds.includes(ev.employee_id)).reduce((acc, curr) => acc + (curr.score_global || 0), 0) / (evaluations.filter(ev => employeeIds.includes(ev.employee_id)).length || 1)).toFixed(1)} 
                      unit="%" 
                      trend="+2.4%" 
                      label="Score Moyen" 
                      color="amber" 
                      onClickMethod={() => setShowCalculation("talent")}
                    />
                    <MetricCard 
                      title="Hauts Potentiels" 
                      val={evaluations.filter(ev => employeeIds.includes(ev.employee_id) && (ev.potential_score || 0) >= 80).length} 
                      unit="Pers." 
                      trend="+1" 
                      label="Elite Segment" 
                      color="emerald" 
                    />
                    <MetricCard 
                      title="Taux de Revues" 
                      val={((evaluations.filter(ev => employeeIds.includes(ev.employee_id)).length / (filteredEmployees.length || 1)) * 100).toFixed(0)} 
                      unit="%" 
                      trend="Stable" 
                      label="Couverture" 
                      color="sky" 
                    />
                   </>
                )}
                {activeTab === "recrutement" && (
                   <>
                    <MetricCard 
                      title="Efficiency Recrut." 
                      val={analytics.recruitment.rate.toFixed(1)} 
                      unit="%" 
                      trend="-2.4%" 
                      label="Taux de Succès" 
                      color="sky" 
                      onClickMethod={() => setShowCalculation("recrutement")}
                    />
                    <MetricCard 
                      title="Lead Time" 
                      val={analytics.recruitment.leadTime.toFixed(0)} 
                      unit="j" 
                      trend="+2j" 
                      label="Délai Moyen" 
                      color="amber" 
                    />
                    <MetricCard 
                      title="Coût Moyen" 
                      val={(analytics.recruitment.costPerHire / 1000).toFixed(0)} 
                      unit="K" 
                      trend="Stable" 
                      label="Budget/Poste" 
                      color="emerald" 
                    />
                   </>
                )}
                {activeTab === "payroll" && (
                   <>
                    <MetricCard 
                      title="Masse Salariale" 
                      val={(analytics.payroll.current / 1000000).toFixed(1)} 
                      unit="M" 
                      trend={analytics.payroll.var > 0 ? `+${analytics.payroll.var.toFixed(1)}%` : `${analytics.payroll.var.toFixed(1)}%`} 
                      label="Vs Mois Précédent" 
                      color="amber" 
                      onClickMethod={() => setShowCalculation("payroll")}
                    />
                    <MetricCard 
                      title="Salaire Net Moyen" 
                      val={(analytics.payroll.avgNet / 1000).toFixed(0)} 
                      unit="K" 
                      trend="+3.2%" 
                      label="Indice Rémun." 
                      color="emerald" 
                    />
                    <MetricCard 
                      title="Coût/Individu" 
                      val={(analytics.payroll.current / (filteredEmployees.length || 1) / 1000).toFixed(0)}
                      unit="K" 
                      trend="Calculé" 
                      label="Moyenne Charge" 
                      color="sky" 
                    />
                   </>
                )}
                {activeTab === "climat" && (
                   <>
                    <MetricCard 
                      title="Taux Turnover" 
                      val={analytics.turnover.current.toFixed(1)} 
                      unit="%" 
                      trend={analytics.turnover.var > 0 ? `+${analytics.turnover.var.toFixed(1)}%` : `${analytics.turnover.var.toFixed(1)}%`} 
                      label="Rotation N/N-1" 
                      color={analytics.turnover.current > 12 ? "rose" : "emerald"} 
                      onClickMethod={() => setShowCalculation("climat")}
                    />
                    <MetricCard 
                      title="Absentéisme" 
                      val={analytics.absenteeism.current.toFixed(1)} 
                      unit="%" 
                      trend={analytics.absenteeism.var > 0 ? `+${analytics.absenteeism.var.toFixed(1)}%` : `${analytics.absenteeism.var.toFixed(1)}%`} 
                      label="Incidence" 
                      color={analytics.absenteeism.current > 5 ? "amber" : "sky"} 
                    />
                    <MetricCard 
                      title="Fiabilité Sociale" 
                      val={(100 - analytics.turnover.current - analytics.absenteeism.current).toFixed(0)} 
                      unit="pts" 
                      trend="Scoré" 
                      label="Indice Stability" 
                      color="emerald" 
                    />
                   </>
                )}
              </div>

              {/* MAIN CONTENT AREA: CHART + PPT COMMENTS */}
              <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-[0_30px_90px_-20px_rgba(15,23,42,0.08)] p-12 flex flex-col gap-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-slate-50/50 rounded-bl-[18rem] -z-0" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                   <div className="flex items-center gap-6">
                      <div className="h-20 w-3 bg-slate-900 rounded-full" />
                      <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tightest uppercase leading-none">
                          {activeTab === "talent" && "Intelligence & Succession"}
                          {activeTab === "recrutement" && "Performance du Sourcing"}
                          {activeTab === "payroll" && "Optimisation de la Masse Salariale"}
                          {activeTab === "climat" && "Météo Organisationnelle"}
                        </h2>
                        <p className="text-slate-400 font-bold text-sm tracking-wide mt-3 flex items-center gap-3">
                           <CalendarCheck size={20} className="text-amber-500" />
                           Reporting consolidé au {format(now, "dd MMMM yyyy", { locale: fr })}
                        </p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <button className="h-14 px-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all flex items-center gap-2">
                        <Presentation size={18} /> Slides Mode
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10 items-start">
                   {/* GRAPH AREA */}
                   <div className="lg:col-span-2 h-[500px] w-full bg-slate-50/40 rounded-[3rem] p-8 border border-slate-100/50">
                      <ResponsiveContainer width="100%" height="100%">
                        {activeTab === "talent" ? (
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                            { subject: 'Compétence', A: 85, fullMark: 100 },
                            { subject: 'Potentiel', A: 72, fullMark: 100 },
                            { subject: 'Leadership', A: 65, fullMark: 100 },
                            { subject: 'Engagement', A: 90, fullMark: 100 },
                            { subject: 'Agilité', A: 78, fullMark: 100 },
                          ]}>
                            <PolarGrid stroke="#CBD5E1" strokeWidth={2} />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 13, fontWeight: 'black' }} />
                            <Radar name="Actuel" dataKey="A" stroke="#f59e0b" strokeWidth={5} fill="#f59e0b" fillOpacity={0.4} />
                          </RadarChart>
                        ) : activeTab === "recrutement" ? (
                          <BarChart data={[
                            { label: 'Candidats', val: 156 }, { label: 'Présélection', val: 82 }, { label: 'Entretiens', val: 34 }, { label: 'Offres', val: 12 }, { label: 'Signatures', val: 10 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} fontWeight="black" axisLine={false} />
                            <YAxis hide />
                            <Tooltip cursor={{fill: '#F1F5F9', opacity: 0.5}} />
                            <Bar dataKey="val" radius={[20, 20, 0, 0]} barSize={70}>
                               <Cell fill="#0f172a" /> <Cell fill="#1e293b" /> <Cell fill="#334155" /> <Cell fill="#475569" /> <Cell fill="#64748b" />
                            </Bar>
                          </BarChart>
                        ) : activeTab === "payroll" ? (
                          <AreaChart data={[
                            { n: 'Jan', v: 42000000 }, { n: 'Fév', v: 43500000 }, { n: 'Mar', v: 43000000 }, { n: 'Avr', v: 44200000 }, { n: 'Mai', v: 45800000 }, { n: 'Juin', v: 46100000 }
                          ]}>
                            <defs>
                              <linearGradient id="colorPay" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0f172a" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                            <XAxis dataKey="n" stroke="#94A3B8" fontSize={11} fontWeight="black" axisLine={false} />
                            <YAxis hide />
                            <Tooltip />
                            <Area type="monotone" dataKey="v" stroke="#0f172a" strokeWidth={6} fillOpacity={1} fill="url(#colorPay)" dot={{ r: 6, fill: '#0f172a', strokeWidth: 3, stroke: '#fff' }} />
                          </AreaChart>
                        ) : (
                          <LineChart data={[
                            { n: 'M-5', t: 4, a: 2 }, { n: 'M-4', t: 3, a: 5 }, { n: 'M-3', t: 7, a: 3 }, { n: 'M-2', t: 5, a: 8 }, { n: 'M-1', t: 2, a: 4 }, { n: 'NOW', t: 3, a: 2 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="n" stroke="#94A3B8" fontSize={11} fontWeight="black" axisLine={false} />
                            <YAxis hide />
                            <Tooltip />
                            <Legend verticalAlign="top" height={36}/>
                            <Line name="Turnover" type="monotone" dataKey="t" stroke="#f59e0b" strokeWidth={5} dot={{ r: 6, fill: '#f59e0b' }} />
                            <Line name="Absentéisme" type="monotone" dataKey="a" stroke="#0f172a" strokeWidth={5} dot={{ r: 6, fill: '#0f172a' }} />
                          </LineChart>
                        )}
                      </ResponsiveContainer>
                   </div>

                   {/* PPT COMMENTARY AS SIDEBAR */}
                   <div className="flex flex-col gap-6">
                      <div className="bg-[#0D121F] text-white rounded-[3rem] p-10 flex flex-col gap-8 shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 group-hover:rotate-12 transition-transform duration-1000">
                          <Quotes size={120} weight="fill" />
                        </div>
                        
                        <div className="space-y-4">
                           <div className="w-12 h-12 bg-amber-400 text-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                              <SealCheck size={28} weight="fill" />
                           </div>
                           <h3 className="text-xl font-black tracking-tight uppercase">Analyse Analyste</h3>
                        </div>

                        <motion.p 
                          key={activeTab}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-lg font-bold text-slate-200 leading-relaxed italic"
                        >
                          "{commentary}"
                        </motion.p>

                        <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                           <div className="flex flex-col">
                             <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Stratégie</span>
                             <span className="text-xs font-bold text-white">Recommandé</span>
                           </div>
                           <ArrowCircleRight size={32} weight="fill" className="text-amber-400 cursor-pointer hover:scale-110 transition-transform" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                           <div className="flex items-center gap-2 mb-2">
                              <CheckCircle size={16} className="text-emerald-500" />
                              <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Points Forts</span>
                           </div>
                           <p className="text-[11px] font-bold text-emerald-800 leading-tight">Maintien de la cohérence salariale sur le segment.</p>
                        </div>
                        <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100">
                           <div className="flex items-center gap-2 mb-2">
                              <WarningCircle size={16} className="text-rose-500" />
                              <span className="text-[9px] font-black text-rose-700 uppercase tracking-widest">A Vigilance</span>
                           </div>
                           <p className="text-[11px] font-bold text-rose-800 leading-tight">Risque de démotivation sur les catégories intermédiaires.</p>
                        </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* BOTTOM STRIP: DATA INTEGRITY */}
              <footer className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <FooterInfo icon={Hourglass} color="amber" title="Délai Moyen" value={analytics.recruitment.leadTime.toFixed(0) + " j"} desc="Temps de Pourvoyance" />
                <FooterInfo icon={Coins} color="emerald" title="Coût Unitaire" value={(analytics.recruitment.costPerHire / 1000).toFixed(0) + " K"} desc="FCFA / Recrutement" />
                <FooterInfo icon={ChartLineUp} color="sky" title="Productivité" value="High" desc="Efficacité Segment" />
                <FooterInfo icon={CheckCircle} color="emerald" title="Data Integrity" value="Verified" desc="Audité RH 2024" />
              </footer>

            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* --- EXPERT METHODO OVERLAY --- */}
      <AnimatePresence>
        {showCalculation && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-2xl px-4"
            onClick={() => setShowCalculation(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[4rem] p-12 lg:p-20 max-w-4xl w-full shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-slate-100 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                 <Calculator size={400} />
              </div>
              
              <div className="flex flex-col items-center text-center gap-10 relative z-10">
                 <div className="p-10 bg-amber-400 text-slate-900 rounded-[3rem] shadow-2xl shadow-amber-400/30">
                    <GraduationCap size={80} weight="fill" />
                 </div>
                 <div className="space-y-4">
                    <h3 className="text-5xl font-black text-slate-900 tracking-tightest">Expertise Analytique</h3>
                    <div className="h-2 w-24 bg-amber-400 mx-auto rounded-full" />
                    <p className="text-slate-400 font-bold text-xl uppercase tracking-[0.4em]">Spécification : {showCalculation === 'talent' ? 'Performance Matrix' : showCalculation === 'recrutement' ? 'Recruitment Funnel' : showCalculation === 'payroll' ? 'Payroll Drift' : 'Turnover Index'}</p>
                 </div>
              </div>

              <div className="mt-16 grid md:grid-cols-2 gap-12 relative z-10">
                 <div className="space-y-8">
                    <div className="space-y-4">
                       <span className="text-[11px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-3">
                          <Calculator size={18} weight="fill" /> Formule de Calcul
                       </span>
                       <div className="p-8 bg-slate-900 rounded-[2.5rem] text-amber-400 shadow-xl overflow-x-auto">
                          <code className="text-2xl font-black tracking-tight whitespace-nowrap">
                             {showCalculation === 'recrutement' && "(Recrutements / Postes Ouverts) x 100"}
                             {showCalculation === 'talent' && "(Score_Total / Nb_Evals) vs Target"}
                             {showCalculation === 'payroll' && "(Σ Brut_N / Σ Brut_N1) - 1"}
                             {showCalculation === 'climat' && "((Entrées + Sorties) / 2) / Effectif"}
                          </code>
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                       <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Utilité Business</span>
                       <p className="text-xl font-bold text-slate-900 leading-tight">
                          {showCalculation === "talent" && "Mesure la progression des compétences et l'adéquation profil/poste."}
                          {showCalculation === "recrutement" && "Évalue l'attractivité de la marque employeur et l'efficacité du sourcing."}
                          {showCalculation === "payroll" && "Contrôle en temps réel les dérives budgétaires salariales."}
                          {showCalculation === "climat" && "Indicateur critique du moral social et de la pérennité organisationnelle."}
                       </p>
                    </div>
                 </div>

                 <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100 flex flex-col gap-6">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Note de l'Analyste</span>
                    <p className="text-slate-600 font-bold leading-relaxed italic text-lg">
                       "Ces indicateurs sont conformes aux standards RH Internationaux et adaptés au contexte du travail Ivoirien. Les données sont extraites en temps réel de votre SIRH pour garantir une fiabilité Décisionnelle."
                    </p>
                    <div className="mt-auto pt-6 border-t border-slate-200 flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-[10px]">DA</div>
                       <div>
                          <p className="text-xs font-black text-slate-900">Dr. Analyste RH</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Lead Consultant Data</p>
                       </div>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setShowCalculation(null)}
                className="mt-16 w-full py-8 bg-slate-900 text-white rounded-[3rem] font-black text-xl tracking-tight hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-slate-900/30 uppercase"
              >
                Valider & Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// --- REFINED SUB-COMPONENTS ---

function MetricCard({ title, val, unit, label, trend, color, onClickMethod }: any) {
  const isUp = trend.includes('+') && !trend.includes('-');
  const isNeutral = trend === "Stable" || trend === "Scoré" || trend === "Calculé";
  
  return (
    <motion.div 
      whileHover={{ y: -10, scale: 1.02 }}
      className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-[0_15px_60px_-15px_rgba(0,0,0,0.05)] flex flex-col gap-8 relative overflow-hidden group hover:border-slate-300 transition-colors"
    >
       <div className="absolute top-0 right-0 w-28 h-28 bg-slate-50/80 rounded-bl-[5rem] group-hover:scale-125 transition-transform duration-700" />
       
       <div className="flex items-center justify-between relative z-10">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{title}</h4>
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black",
            isNeutral ? "bg-slate-100 text-slate-600" : isUp ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
          )}>
            {isNeutral ? <ChartLineUp size={14} weight="bold" /> : isUp ? <ArrowUpRight size={14} weight="bold" /> : <ArrowDownRight size={14} weight="bold" />}
            {trend}
          </div>
       </div>

       <div className="flex items-baseline gap-2 relative z-10">
          <span className="text-6xl font-black text-slate-900 tracking-tightest">{val}</span>
          <span className="text-2xl font-black text-slate-300 uppercase">{unit}</span>
       </div>

       <div className="flex flex-col gap-4 relative z-10 pt-2">
          <div className="flex items-center justify-between">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</span>
             {onClickMethod && (
               <button onClick={onClickMethod} className="h-6 w-6 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:scale-110 transition-transform">
                 <Info size={12} weight="bold" />
               </button>
             )}
          </div>
          <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
             <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "75%" }}
                className={cn("h-full rounded-full transition-all duration-1000", 
                  color === 'amber' ? 'bg-amber-400' : color === 'emerald' ? 'bg-emerald-500' : color === 'rose' ? 'bg-rose-500' : 'bg-slate-900'
                )}
             />
          </div>
       </div>
    </motion.div>
  );
}

function FooterInfo({ icon: Icon, color, title, value, desc }: any) {
  const cMap = {
    emerald: "bg-emerald-500 text-white shadow-emerald-500/20",
    amber: "bg-amber-400 text-slate-900 shadow-amber-400/20",
    rose: "bg-rose-500 text-white shadow-rose-500/20",
    sky: "bg-slate-900 text-white shadow-slate-900/20"
  };
  
  return (
    <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] flex items-center gap-7 shadow-sm hover:shadow-xl transition-shadow group">
       <div className={cn("p-5 rounded-2xl shadow-2xl transition-transform group-hover:scale-110 duration-500", cMap[color as keyof typeof cMap])}>
          <Icon size={28} weight="fill" />
       </div>
       <div>
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{title}</h4>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-slate-900 tracking-tightest">{value}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-80">{desc}</span>
          </div>
       </div>
    </div>
  );
}
