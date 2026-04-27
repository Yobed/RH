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
  Funnel
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from "recharts";
import { cn } from "@/lib/utils";

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
  const [activeTab, setActiveTab] = useState<"performance" | "recrutement" | "payroll" | "turnover">("performance");
  const [showCalculation, setShowCalculation] = useState<string | null>(null);

  // --- Synchronized Filtering Logic ---
  
  // 1. Get all unique Departments
  const departments = useMemo(() => {
    return ["ALL", ...Array.from(new Set(employees.map(e => e.departement).filter(Boolean)))].sort();
  }, [employees]);

  // 2. Get unique Categories based on selected Department (THE SYNC)
  const availableCategories = useMemo(() => {
    const deptEmployees = selectedDept === "ALL" 
      ? employees 
      : employees.filter(e => e.departement === selectedDept);
    
    return ["ALL", ...Array.from(new Set(deptEmployees.map(e => e.categorie).filter(Boolean)))].sort();
  }, [employees, selectedDept]);

  // Reset category if it's no longer available in the newly selected dept
  useEffect(() => {
    if (selectedCategory !== "ALL" && !availableCategories.includes(selectedCategory)) {
      setSelectedCategory("ALL");
    }
  }, [selectedDept, availableCategories, selectedCategory]);

  // 3. Final Filtered Dataset
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => 
      (selectedDept === "ALL" || e.departement === selectedDept) &&
      (selectedCategory === "ALL" || e.categorie === selectedCategory)
    );
  }, [employees, selectedDept, selectedCategory]);

  const employeeIds = useMemo(() => filteredEmployees.map(e => e.id), [filteredEmployees]);
  const filteredBulletins = bulletins.filter(b => employeeIds.includes(b.employee_id));
  const filteredEvaluations = evaluations.filter(ev => employeeIds.includes(ev.employee_id));

  // --- KPI Calculations ---
  
  // 1. PERFORMANCE / TALENT MATRIX
  const talentStats = useMemo(() => {
    const totalEvals = filteredEvaluations.length;
    if (totalEvals === 0) return { avgScore: 0, potential: 0, commentary: "Analyse impossible : Aucune donnée d'évaluation pour ce segment.", score: 0 };
    
    const avgScore = filteredEvaluations.reduce((acc, curr) => acc + (curr.score_global || 0), 0) / totalEvals;
    const highPotential = filteredEvaluations.filter(ev => ev.potential_score >= 80).length;
    const ratioHighPot = (highPotential / totalEvals) * 100;

    let commentary = "";
    let score = 0;
    if (avgScore > 80) {
      commentary = "Excellence opérationnelle confirmée. Le segment affiche une maturité rare. Priorisez la rétention des 'Top Talents' par des programmes de mentoring.";
      score = 92;
    } else if (avgScore > 65) {
      commentary = "Performance solide et homogène. Quelques gisements de croissance identifiés sur les compétences transverses. Focus sur le 'Upskilling'.";
      score = 75;
    } else {
      commentary = "Alerte : Dispersion des performances constatée. Un audit des besoins de formation et un coaching managérial sont recommandés urgemment.";
      score = 55;
    }

    return { avgScore, potential: ratioHighPot, commentary, total: totalEvals, score };
  }, [filteredEvaluations]);

  // 2. RECRUTEMENT FOCUS
  const recruitmentStats = useMemo(() => {
    const totalPostings = jobPostings.length;
    const filled = jobPostings.filter(p => p.statut === "Clôturé" || p.statut === "Terminé").length;
    const fillRate = totalPostings > 0 ? (filled / totalPostings) * 100 : 0;
    
    const activeCandidates = candidates.filter(c => c.statut === "Entretien" || c.statut === "Test");
    const avgScoreIA = activeCandidates.length > 0 
      ? activeCandidates.reduce((acc, curr) => acc + (curr.score_ia || 0), 0) / activeCandidates.length 
      : 0;

    let commentary = "";
    let score = 0;
    if (fillRate < 50) {
      commentary = "Tension critique sur le recrutement. La marque employeur ou l'attractivité salariale pour ce segment doit être questionnée.";
      score = 45;
    } else if (avgScoreIA > 70) {
      commentary = "Flux de talents qualitatifs (Score IA élevé). Le pipeline est robuste. Accélérez le 'Time-to-Hire' pour ne pas perdre les meilleurs profils.";
      score = 88;
    } else {
      commentary = "Sourcing actif mais sélectivité moyenne. Pensez à diversifier les canaux de recrutement pour capter des profils plus experts.";
      score = 65;
    }

    return { fillRate, avgScoreIA, commentary, totalPostings, score };
  }, [jobPostings, candidates]);

  // 3. PAYROLL FOCUS
  const payrollStats = useMemo(() => {
    const totalBrut = filteredBulletins.reduce((acc, curr) => acc + (curr.salaire_brut || 0), 0);
    const count = filteredBulletins.length || 1;
    const avgNet = filteredBulletins.reduce((acc, curr) => acc + (curr.salaire_net || 0), 0) / count;

    let commentary = "La masse salariale est alignée sur les prévisions budgétaires. L'équité interne sur ce segment semble respectée.";
    let score = 85;
    if (totalBrut > 50000000) {
      commentary = "Pression budgétaire forte. Surveillez l'évolution du ratio Masse Salariale / CA pour ce département spécifique.";
      score = 70;
    }

    return { totalBrut, avgNet, commentary, score };
  }, [filteredBulletins]);

  return (
    <div className="flex flex-col gap-8 pb-12 overflow-x-hidden">
      
      {/* --- HEADER STRATÉGIQUE --- */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-amber-400 text-slate-900 rounded-[1.5rem] shadow-lg shadow-amber-100">
            <Presentation size={32} weight="fill" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">FOCUS STRATÉGIQUE</h1>
            <p className="text-slate-400 font-bold flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-500" />
              Intelligence RH & Pilotage de la Performance
            </p>
          </div>
        </div>

        {/* --- DYNAMIC SLICERS BAR --- */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-[2rem] border border-slate-100">
          <div className="flex items-center gap-2 px-4 border-r border-slate-200">
            <Funnel size={18} weight="bold" className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slices</span>
          </div>

          {/* Dept Multi-Select (Simplified to Select for UI clarity) */}
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-white px-4 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none border border-slate-200 focus:ring-2 focus:ring-amber-400 transition-all cursor-pointer"
          >
            {departments.map(d => (
              <option key={d} value={d}>{d === "ALL" ? "Tous les Départements" : d}</option>
            ))}
          </select>

          {/* Category Multi-Select (Synchronized) */}
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white px-4 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none border border-slate-200 focus:ring-2 focus:ring-amber-400 transition-all cursor-pointer"
          >
            {availableCategories.map(c => (
              <option key={c} value={c}>{c === "ALL" ? "Toutes les Catégories" : c}</option>
            ))}
          </select>
          
          <div className="ml-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black">
            {filteredEmployees.length} EMP.
          </div>
        </div>
      </header>

      {/* --- NAVIGATION DES DOMAINES --- */}
      <nav className="flex justify-center">
        <div className="inline-flex p-1.5 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
          {[
            { id: "performance", label: "Performance", icon: Target },
            { id: "recrutement", label: "Recrutement", icon: Users },
            { id: "payroll", label: "Rémunération", icon: Money },
            { id: "turnover", label: "Rétention", icon: ArrowsClockwise },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-3 px-8 py-3.5 rounded-[1.5rem] text-sm font-black transition-all duration-500",
                activeTab === tab.id 
                  ? "bg-slate-900 text-white shadow-xl translate-y-[-2px]" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <tab.icon size={20} weight={activeTab === tab.id ? "fill" : "bold"} />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* --- CONTENT SLIDE --- */}
      <main className="w-full max-w-7xl mx-auto px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="flex flex-col gap-8"
          >
            
            {/* POWERPOINT MAIN CARD */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* Data Visualization Column */}
              <div className="lg:col-span-3 bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 flex flex-col gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/50 rounded-bl-[10rem] -z-0" />
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-2 bg-amber-400 rounded-full" />
                    <div>
                      <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
                        {activeTab === "performance" && "Analyse de la Performance Segmentée"}
                        {activeTab === "recrutement" && "Indicateurs d'Attractivité"}
                        {activeTab === "payroll" && "Contrôle des Coûts Salariaux"}
                        {activeTab === "turnover" && "Radar de Stabilité Sociale"}
                      </h2>
                      <p className="text-slate-400 font-bold text-sm">Période : Année en cours • Filtre : {selectedDept} / {selectedCategory}</p>
                    </div>
                  </div>
                </div>

                {/* Big Chart Area */}
                <div className="h-[400px] w-full relative z-10 bg-slate-50/30 rounded-[2rem] p-6">
                  <ResponsiveContainer width="100%" height="100%">
                    {activeTab === "performance" ? (
                      <AreaChart data={filteredEvaluations.length > 0 ? filteredEvaluations.map((ev, i) => ({ name: `N°${i+1}`, val: ev.score_global, pot: ev.potential_score })) : [{name: 'Vide', val: 0, pot: 0}]}>
                        <defs>
                          <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} fontStyle="bold" />
                        <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={10} fontStyle="bold" />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="val" stroke="#f59e0b" strokeWidth={5} fillOpacity={1} fill="url(#colorVal)" />
                        <Line type="monotone" dataKey="pot" stroke="#475569" strokeDasharray="5 5" strokeWidth={2} />
                      </AreaChart>
                    ) : activeTab === "recrutement" ? (
                      <BarChart data={[
                        { label: 'Objectifs', val: 100, color: '#F1F5F9' },
                        { label: 'Réalisation', val: recruitmentStats.fillRate, color: '#f59e0b' },
                        { label: 'Score Candidats', val: recruitmentStats.avgScoreIA, color: '#0ea5e9' }
                      ]}>
                        <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} fontWeight="black" dy={10} />
                        <YAxis hide domain={[0, 120]} />
                        <Tooltip cursor={{fill: 'transparent'}} />
                        <Bar dataKey="val" radius={[20, 20, 0, 0]} barSize={60}>
                          {[0, 1, 2].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 1 ? '#f59e0b' : index === 2 ? '#0ea5e9' : '#F1F5F9'} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                        { subject: 'Stabilité', A: 88, fullMark: 100 },
                        { subject: 'Motivation', A: 76, fullMark: 100 },
                        { subject: 'Climat', A: 92, fullMark: 100 },
                        { subject: 'Maitrise Coût', A: 85, fullMark: 100 },
                        { subject: 'Compétence', A: 70, fullMark: 100 },
                      ]}>
                        <PolarGrid stroke="#E2E8F0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 11, fontWeight: 'black' }} />
                        <Radar name="Performance" dataKey="A" stroke="#f59e0b" strokeWidth={3} fill="#f59e0b" fillOpacity={0.5} />
                      </RadarChart>
                    )}
                  </ResponsiveContainer>
                </div>

                {/* THE POWERPOINT EXPERT COMMENTARY - MOVED BELOW KPI FOR HI-IMPACT */}
                <div className="bg-slate-900 text-white rounded-[2rem] p-10 mt-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Robot size={100} />
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-amber-400 text-slate-900 rounded-2xl">
                      <Lightbulb size={24} weight="fill" />
                    </div>
                    <h3 className="text-xl font-black tracking-tight uppercase">ANALYSE & RECOMMANDATIONS DE L'EXPERT</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-8 flex flex-col gap-4">
                      <p className="text-lg text-slate-100 font-bold leading-relaxed italic border-l-4 border-amber-400 pl-6 py-2">
                        " {activeTab === "performance" ? talentStats.commentary : activeTab === "recrutement" ? recruitmentStats.commentary : payrollStats.commentary} "
                      </p>
                      <div className="flex gap-3 mt-4">
                        <button 
                          onClick={() => setShowCalculation(activeTab)}
                          className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black transition-all"
                        >
                          <GraduationCap size={18} />
                          MÉTHODOLOGIE DU CALCUL
                        </button>
                      </div>
                    </div>
                    <div className="md:col-span-4 flex flex-col items-center justify-center border-l border-white/10 px-8">
                      <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">Santé du Segment</div>
                      <div className="text-6xl font-black text-white tracking-tighter">
                        {activeTab === "performance" ? talentStats.score : activeTab === "recrutement" ? recruitmentStats.score : payrollStats.score}%
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full mt-4 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${activeTab === "performance" ? talentStats.score : activeTab === "recrutement" ? recruitmentStats.score : payrollStats.score}%` }}
                          className="h-full bg-amber-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side KPI Column (The "Atomic" Facts) */}
              <div className="flex flex-col gap-6">
                {activeTab === "performance" && (
                  <>
                    <MetricSlide icon={Target} title="Performance" val={`${talentStats.avgScore.toFixed(1)}`} unit="/100" label="Score Moyen" trend="+2.4%" color="amber" />
                    <MetricSlide icon={Buildings} title="Potentiel" val={`${talentStats.potential.toFixed(0)}`} unit="%" label="Hi-Potential Ratio" trend="+0.8%" color="emerald" />
                    <MetricSlide icon={Users} title="Couverture" val={`${((talentStats.total || 0))}`} unit="Eval" label="Effectif Évalué" trend="Ok" color="sky" />
                  </>
                )}
                {activeTab === "recrutement" && (
                   <>
                    <MetricSlide icon={ChartLineUp} title="Réussite" val={`${recruitmentStats.fillRate.toFixed(1)}`} unit="%" label="Taux de Placement" trend="-5%" color="rose" />
                    <MetricSlide icon={GraduationCap} title="Qualité" val={`${recruitmentStats.avgScoreIA.toFixed(1)}`} unit="%" label="Score IA Moyen" trend="+12%" color="amber" />
                    <MetricSlide icon={Info} title="Besoins" val={`${recruitmentStats.totalPostings}`} unit="Jobs" label="Postes Ouverts" trend="Stable" color="sky" />
                  </>
                )}
                {activeTab === "payroll" && (
                   <>
                    <MetricSlide icon={Money} title="Budget" val={`${(payrollStats.totalBrut / 1000000).toFixed(1)}`} unit="M" label="Masse Salariale" trend="+4%" color="amber" />
                    <MetricSlide icon={UserGear} title="Net Moyen" val={`${(payrollStats.avgNet / 1000).toFixed(0)}`} unit="K" label="Rémunération Moyenne" trend="+2.1%" color="emerald" />
                    <MetricSlide icon={ChartBar} title="Equité" val="94" unit="%" label="Indice de Parité" trend="Stable" color="sky" />
                  </>
                )}
              </div>

            </div>

            {/* DETAIL BOTTOM STRIP */}
            <footer className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl flex items-center gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                  <CheckCircle size={24} weight="fill" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">DATA QUALITY</h4>
                  <p className="text-xs font-bold text-slate-400">Fiabilité des données : 98.4%</p>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl flex items-center gap-4">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                  <WarningCircle size={24} weight="fill" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">ALERTES SEGMENT</h4>
                  <p className="text-xs font-bold text-slate-400">02 Points de vigilance détectés</p>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl flex items-center gap-4">
                <div className="p-3 bg-slate-200 text-slate-600 rounded-2xl">
                  <CalendarCheck size={24} weight="fill" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">PROCHAINE ÉCHÉANCE</h4>
                  <p className="text-xs font-bold text-slate-400">Revue trimestrielle dans 14 jours</p>
                </div>
              </div>
            </footer>

          </motion.div>
        </AnimatePresence>
      </main>

      {/* --- METHODO OVERLAY --- */}
      <AnimatePresence>
        {showCalculation && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl"
            onClick={() => setShowCalculation(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[3.5rem] p-12 max-w-2xl w-full shadow-2xl relative"
            >
              <div className="flex flex-col items-center text-center gap-6">
                <div className="p-6 bg-amber-100 text-amber-600 rounded-[2rem]">
                  <GraduationCap size={64} weight="duotone" />
                </div>
                <div>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Méthodologie Experte</h3>
                  <p className="text-slate-400 font-bold text-lg uppercase tracking-widest">{showCalculation}</p>
                </div>
              </div>

              <div className="mt-10 space-y-8">
                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 border-l-8 border-l-amber-400">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Formule de Calcul</h4>
                  <code className="text-xl font-black text-slate-900 block">
                    {showCalculation === "performance" && "Σ(Score Global) / Total Evaluations"}
                    {showCalculation === "recrutement" && "(Postes Pourvus / Total Postes Ouvert) x 100"}
                    {showCalculation === "payroll" && "Σ(Salaire Brut) / Effectif du Segment"}
                    {showCalculation === "turnover" && "Indice de Stabilité (Analyse prédictive IA)"}
                  </code>
                </div>

                <div className="flex gap-5 px-4">
                  <div className="p-3 bg-amber-50 rounded-2xl h-fit">
                    <Info size={32} className="text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 mb-1 uppercase tracking-tight">Impact Stratégique</h4>
                    <p className="text-slate-500 font-bold leading-relaxed">
                      {showCalculation === "performance" && "Cet indicateur permet d'identifier les poches de sous-performance avant qu'elles n'impactent la productivité globale. Il sert de base pour l'allocation du budget formation."}
                      {showCalculation === "recrutement" && "Indispensable pour mesurer l'attractivité de l'entreprise sur un segment donné. Un taux faible signale un décalage entre l'offre et le marché."}
                      {showCalculation === "payroll" && "Permet de s'assurer que la croissance de la masse salariale reste corrélée à la valeur produite par le département."}
                      {showCalculation === "turnover" && "Vision anticipée des départs potentiels. Permet d'engager des entretiens de rétention proactifs."}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowCalculation(null)}
                  className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-lg tracking-tight hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-200"
                >
                  VALIDER & FERMER
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// --- SUB-COMPONENTS ---

function MetricSlide({ icon: Icon, title, val, unit, label, trend, color }: any) {
  const colorMap = {
    amber: "bg-amber-50 text-amber-500",
    emerald: "bg-emerald-50 text-emerald-500",
    sky: "bg-sky-50 text-sky-500",
    rose: "bg-rose-50 text-rose-500"
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -4 }}
      className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col gap-5 group"
    >
      <div className="flex items-center justify-between">
        <div className={cn("p-3 rounded-2xl", colorMap[color as keyof typeof colorMap])}>
          <Icon size={24} weight="fill" />
        </div>
        <div className={cn("text-[10px] font-black px-3 py-1 rounded-full", trend.includes('-') ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
          {trend}
        </div>
      </div>
      
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-slate-900 leading-none">{val}</span>
          <span className="text-lg font-black text-slate-300">{unit}</span>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{label}</p>
      </div>
      
      <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "65%" }}
          className={cn("h-full", color === 'amber' ? 'bg-amber-400' : color === 'emerald' ? 'bg-emerald-400' : 'bg-sky-400')}
        />
      </div>
    </motion.div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-100">
        <p className="text-xs font-black text-slate-900 mb-2 uppercase tracking-widest">{payload[0].payload.name}</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs font-bold text-slate-600">Perf: {payload[0].value}%</span>
          </div>
          {payload[1] && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-xs font-bold text-slate-600">Potentiel: {payload[1].value}%</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}
