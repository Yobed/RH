"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KpiCard } from "@/components/rh/KpiCard";
import { ComplianceAlertList } from "@/components/rh/ComplianceAlertList";
import { QuickActions } from "@/components/rh/QuickActions";
import { DashboardCharts } from "@/components/rh/DashboardCharts";
import { AiSuggestionsWidget } from "@/components/rh/AiSuggestionsWidget";
import { ActionCenter, type ActionItem } from "@/components/rh/ActionCenter";
import {
  UsersIcon as Users,
  WarningIcon as FileWarning,
  BriefcaseIcon as Briefcase,
  ScalesIcon as Scale,
  SparklesIcon as Sparkles,
} from "@/components/rh/ClientIcons";
import {
  Search,
  Grid,
  List as ListIcon,
  ChevronRight,
  Plus,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  CalendarCheck2,
  AlertTriangle,
  UserCheck2,
  X,
  Eye,
  Settings2,
  Wand2,
  Play,
  Cpu,
  RefreshCw,
  Table,
  Check,
  Sparkles as SparklesLucide,
  ArrowRight,
  Sliders,
  Sparkle,
  Filter,
  Layers,
  Building,
  CheckCircle2,
  ArrowUpRight,
  Clock,
  MoreVertical,
  SlidersVertical,
  HelpCircle,
  BarChart3,
  UserPlus
} from "lucide-react";
import Link from "next/link";

interface ExecutiveRhCockpitProps {
  totalActifs: number;
  totalFemmes: number;
  cddExpirant: number;
  medicalAlertsCount: number;
  postesOuverts: number;
  evalBrouillon: number;
  contentieuxOuverts: number;
  complianceScore: number;
  dateLabel: string;
  actionItems: ActionItem[];
  allAlerts: any[];
  chartDeptData: any[];
  chartGenderData: any[];
  congesEnAttente: any[];
  recentActivities: any[];
  derniersEmployes: any[];
  missingDocsTotal: number;
  totalExpectedDocs: number;
  essaiExpirant: number;
}

export function ExecutiveRhCockpit({
  totalActifs,
  totalFemmes,
  cddExpirant,
  medicalAlertsCount,
  postesOuverts,
  evalBrouillon,
  contentieuxOuverts,
  complianceScore,
  dateLabel,
  actionItems,
  allAlerts,
  chartDeptData,
  chartGenderData,
  congesEnAttente,
  recentActivities,
  derniersEmployes,
  missingDocsTotal,
  totalExpectedDocs,
  essaiExpirant,
}: ExecutiveRhCockpitProps) {
  // 5 Odoo-Executive View Modes
  const [viewMode, setViewMode] = useState<"overview" | "kanban" | "list" | "pivot" | "ai_copilot">("overview");
  const [kanbanGroupBy, setKanbanGroupBy] = useState<"department" | "stage">("department");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>("all");
  
  // Customization & Drawers
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  
  // AI State
  const [aiPromptInput, setAiPromptInput] = useState("");
  const [aiSimulatedResponse, setAiSimulatedResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // BI Pivot State
  const [pivotHeatmapMode, setPivotHeatmapMode] = useState(true);
  const [pivotSortColumn, setPivotSortColumn] = useState<"name" | "value" | "cdi" | "cdd">("value");

  // Keyboard shortcut listener for Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Dynamic filter for employees
  const filteredEmployes = useMemo(() => {
    if (!derniersEmployes) return [];
    return derniersEmployes.filter((emp) => {
      const matchesSearch =
        !searchQuery ||
        emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.poste?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.departement?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (activeFilter === "cdd") return emp.type_contrat === "CDD";
      if (activeFilter === "cdi") return emp.type_contrat === "CDI";
      return true;
    });
  }, [derniersEmployes, searchQuery, activeFilter]);

  // Grouping for Kanban View
  const kanbanColumns = useMemo(() => {
    if (kanbanGroupBy === "stage") {
      return [
        { id: "embauche", title: "Recrutement & Sourcing", count: postesOuverts, color: "bg-indigo-500", badgeBg: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" },
        { id: "essai", title: "Période d'Essai", count: essaiExpirant, color: "bg-amber-500", badgeBg: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
        { id: "en_poste", title: "Collaborateurs En Poste", count: totalActifs - cddExpirant, color: "bg-emerald-500", badgeBg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
        { id: "echeance", title: "Échéances CDD & Risques", count: cddExpirant, color: "bg-rose-500", badgeBg: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
      ];
    }

    // Default: Group by Department
    const depts = chartDeptData && chartDeptData.length > 0 ? chartDeptData : [
      { name: "Direction & IT", value: 4 },
      { name: "Finance & Compta", value: 6 },
      { name: "Ressources Humaines", value: 3 },
      { name: "Opérations & Logistique", value: 12 },
    ];

    return depts.map((d, idx) => {
      const colors = ["bg-indigo-600", "bg-[#2563eb]", "bg-emerald-600", "bg-blue-600", "bg-purple-600"];
      return {
        id: d.name,
        title: d.name,
        count: d.value,
        color: colors[idx % colors.length],
        badgeBg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      };
    });
  }, [kanbanGroupBy, chartDeptData, totalActifs, cddExpirant, postesOuverts, essaiExpirant]);

  // Sorted Pivot BI Data
  const sortedPivotData = useMemo(() => {
    if (!chartDeptData) return [];
    return [...chartDeptData].sort((a, b) => {
      if (pivotSortColumn === "name") return a.name.localeCompare(b.name);
      if (pivotSortColumn === "cdi") return (b.value * 0.8) - (a.value * 0.8);
      if (pivotSortColumn === "cdd") return (b.value * 0.2) - (a.value * 0.2);
      return b.value - a.value;
    });
  }, [chartDeptData, pivotSortColumn]);

  // Handle AI Prompt Simulation
  const handleRunAiPrompt = (query?: string) => {
    const q = query || aiPromptInput;
    if (!q) return;
    setIsAiLoading(true);
    setAiSimulatedResponse(null);
    setTimeout(() => {
      setIsAiLoading(false);
      if (q.toLowerCase().includes("cnps") || q.toLowerCase().includes("fdfp") || q.toLowerCase().includes("risques")) {
        setAiSimulatedResponse("⚡ [Odoo AI Studio Audit] : Déclarations CNPS Q1 auditées à 98.4%. 2 dossiers d'apprentissage FDFP restent en attente d'approbation (1,450,000 FCFA). Recommandation : Transmettre l'attestation fiscale avant le 15 du mois.");
      } else if (q.toLowerCase().includes("cdd") || q.toLowerCase().includes("contrat") || q.toLowerCase().includes("renouvellement")) {
        setAiSimulatedResponse(`⚡ [Odoo AI Studio Audit] : Audit des contrats terminé. ${cddExpirant} contrats CDD arrivent à échéance sous 30 jours. Analyse prédictive : 2 profils clés dans le département Opérations présentent un taux de performance élevé. Transformation en CDI recommandée.`);
      } else if (q.toLowerCase().includes("masse") || q.toLowerCase().includes("paie") || q.toLowerCase().includes("salariale")) {
        setAiSimulatedResponse(`⚡ [Odoo AI Studio Audit] : Analyse de la masse salariale mensuelle : Stabilité (+1.2% vs N-1). Les primes de performance représentent 6.5% du total. Aucun écart budgétaire critique détecté.`);
      } else {
        setAiSimulatedResponse(`⚡ [Odoo AI Studio Audit] : Synthèse Exécutive RH pour ${dateLabel}. Score de conformité global stabilisé à ${Math.round(complianceScore)}%. ${congesEnAttente.length} demandes de congés nécessitent votre arbitrage préalable.`);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 pb-24 selection:bg-[#2563eb] selection:text-white">
      
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ODOO HIGH-PRECISION CONTROL PANEL & HEADER                      */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
        
        {/* Top App Identity & Global Controls */}
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Brand Identity */}
          <div className="flex items-center justify-between md:justify-start gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#2563eb] flex items-center justify-center text-white shadow-md shadow-[#2563eb]/20 font-black text-lg">
                RH
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white uppercase">
                    Ressources Humaines <span className="text-slate-400 font-normal">/ Executive Cockpit</span>
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" /> Synchronisé
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {dateLabel} • Console d'Arbitrage et d'Intelligence Stratégique
                </p>
              </div>
            </div>

            {/* Mobile quick action */}
            <Link
              href="/employes"
              className="md:hidden p-2 rounded-lg bg-[#2563eb] text-white shadow-sm"
            >
              <Plus className="h-5 w-5" />
            </Link>
          </div>

          {/* Odoo-Style Central Search & Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            
            {/* Odoo Control Panel Search Bar */}
            <div className="relative flex-1 md:w-96 flex items-center bg-slate-100 dark:bg-slate-800 focus-within:bg-white dark:focus-within:bg-slate-900 text-slate-900 dark:text-white rounded-xl px-3.5 py-2 border border-slate-200 dark:border-slate-700 transition-all shadow-2xs">
              <Search className="h-4 w-4 shrink-0 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Rechercher salarié, poste, département... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs font-bold outline-none placeholder-slate-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600 mr-1">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 shrink-0"
              >
                ⌘K
              </button>
            </div>

            {/* Main Primary CTA Button */}
            <Link
              href="/employes"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-[#E07400] text-white text-xs font-black transition-all shadow-sm active:scale-95 shrink-0"
            >
              <UserPlus className="h-4 w-4 stroke-[2.5]" />
              <span>Nouveau Salarié</span>
            </Link>
          </div>
        </div>

        {/* ── ODOO CONTROL SUB-BAR (VIEW SWITCHER & SMART FILTERS) ── */}
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Quick Filter Chips (Odoo Style) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Filter className="h-3.5 w-3.5 text-[#2563eb]" /> Filtres :
            </span>
            {[
              { id: "all", label: "Tous les salariés" },
              { id: "cdi", label: "CDI Uniquement" },
              { id: "cdd", label: "CDD & Échéances" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                  activeFilter === f.id
                    ? "bg-[#2563eb]/15 text-[#2563eb] border border-[#2563eb]/30"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Odoo View Mode Switcher Buttons */}
          <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl shrink-0 self-end sm:self-auto">
            {[
              { id: "overview", label: "Aperçu", icon: BarChart3 },
              { id: "kanban", label: "Kanban", icon: Grid },
              { id: "list", label: "Liste", icon: ListIcon },
              { id: "pivot", label: "Pivot BI", icon: Table },
              { id: "ai_copilot", label: "IA Studio", icon: SparklesLucide, special: true },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = viewMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                    isActive
                      ? tab.special
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <IconComp className={`h-3.5 w-3.5 ${isActive && !tab.special ? "text-[#2563eb]" : isActive && tab.special ? "text-amber-300" : ""}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ODOO SMART BUTTONS KPI HEADER                                    */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 pt-6 pb-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {[
            { label: "Effectif Actif", val: totalActifs, sub: "Salariés sous contrat", icon: Users, color: "text-slate-900 dark:text-white", border: "border-slate-200 dark:border-slate-800", onClick: () => setViewMode("list") },
            { label: "Congés en Attente", val: congesEnAttente?.length ?? 0, sub: "Arbitrages requis", icon: CalendarCheck2, color: "text-amber-600", border: "border-amber-200 dark:border-amber-900/40", onClick: () => setViewMode("overview") },
            { label: "CDD à Échéance", val: cddExpirant, sub: "Sous 30 jours", icon: AlertTriangle, color: "text-rose-600", border: "border-rose-200 dark:border-rose-900/40", onClick: () => { setViewMode("kanban"); setKanbanGroupBy("stage"); } },
            { label: "Postes Ouverts", val: postesOuverts, sub: "Recrutement actif", icon: UserCheck2, color: "text-indigo-600", border: "border-indigo-200 dark:border-indigo-900/40", onClick: () => setViewMode("kanban") },
            { label: "Conformité RH", val: `${Math.round(complianceScore)}%`, sub: "Audit CNPS & Légal", icon: ShieldCheck, color: "text-emerald-600", border: "border-emerald-200 dark:border-emerald-900/40", onClick: () => setViewMode("pivot") },
          ].map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <button
                key={idx}
                onClick={item.onClick}
                className={`bg-white dark:bg-slate-900 p-4 rounded-xl border ${item.border} shadow-2xs hover:shadow-md hover:border-[#2563eb]/50 transition-all text-left flex items-center justify-between group cursor-pointer`}
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">{item.label}</span>
                  <span className={`text-xl font-black ${item.color} tracking-tight block mt-0.5`}>{item.val}</span>
                  <span className="text-[10px] font-bold text-slate-500 block mt-0.5">{item.sub}</span>
                </div>
                <div className="h-9 w-9 rounded-lg bg-slate-50 dark:bg-slate-800 group-hover:bg-[#2563eb]/10 flex items-center justify-center text-slate-400 group-hover:text-[#2563eb] transition-colors shrink-0">
                  <IconComponent className="h-5 w-5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MAIN VIEW CONTENT AREA                                           */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <main className="mx-auto max-w-[1600px] px-4 sm:px-8 pt-4">
        <AnimatePresence mode="wait">
          
          {/* ────────────────────────────────────────────────────────────── */}
          {/* 1. VUE OVERVIEW (APERÇU SYNTHÉTIQUE)                          */}
          {/* ────────────────────────────────────────────────────────────── */}
          {viewMode === "overview" && (
            <motion.div
              key="overview-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column (8 cols): Action Center & Charts */}
                <div className="lg:col-span-8 space-y-6">
                  <ActionCenter items={actionItems} />
                  <DashboardCharts deptData={chartDeptData} genderData={chartGenderData} />
                </div>

                {/* Right Column (4 cols): AI Widget, Compliance & Shortcuts */}
                <div className="lg:col-span-4 space-y-6">
                  <AiSuggestionsWidget
                    totalActifs={totalActifs}
                    cddExpirant={cddExpirant}
                    medicalAlertsCount={medicalAlertsCount}
                    evalBrouillon={evalBrouillon}
                    contentieuxOuverts={contentieuxOuverts}
                    congesEnAttente={congesEnAttente?.length ?? 0}
                  />
                  <ComplianceAlertList alerts={allAlerts} />
                  <QuickActions />
                </div>
              </div>
            </motion.div>
          )}

          {/* ────────────────────────────────────────────────────────────── */}
          {/* 2. VUE KANBAN WORKFLOW (STYLE ODOO RECRUITMENT/EMPLOYEES)       */}
          {/* ────────────────────────────────────────────────────────────── */}
          {viewMode === "kanban" && (
            <motion.div
              key="kanban-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Odoo Kanban Sub-Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Sliders className="h-4 w-4 text-[#2563eb]" /> Regroupement :
                  </span>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                      onClick={() => setKanbanGroupBy("department")}
                      className={`px-3 py-1 rounded-md text-xs font-black transition-all ${
                        kanbanGroupBy === "department" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : "text-slate-500"
                      }`}
                    >
                      Par Département
                    </button>
                    <button
                      onClick={() => setKanbanGroupBy("stage")}
                      className={`px-3 py-1 rounded-md text-xs font-black transition-all ${
                        kanbanGroupBy === "stage" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : "text-slate-500"
                      }`}
                    >
                      Par Étape RH
                    </button>
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-500">
                  Affichage de <span className="text-[#2563eb] font-black">{filteredEmployes.length}</span> cartes
                </div>
              </div>

              {/* Odoo Kanban Columns Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
                {kanbanColumns.map((col) => {
                  const colEmployees = filteredEmployes.filter((emp) => {
                    if (kanbanGroupBy === "stage") {
                      if (col.id === "embauche") return false;
                      if (col.id === "essai") return emp.type_contrat === "CDD" || emp.type_contrat === "STAGE";
                      if (col.id === "echeance") return emp.type_contrat === "CDD";
                      return emp.type_contrat === "CDI";
                    }
                    return emp.departement === col.id || (!emp.departement && col.id.includes("Direction"));
                  });

                  return (
                    <div
                      key={col.id}
                      className="bg-slate-100/70 dark:bg-slate-900/60 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 space-y-3"
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800 px-1">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                          <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">{col.title}</h3>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${col.badgeBg}`}>
                          {colEmployees.length}
                        </span>
                      </div>

                      {/* Cards list */}
                      <div className="space-y-2.5 min-h-[300px]">
                        {colEmployees.length === 0 ? (
                          <div className="p-6 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
                            <p className="text-[11px] font-bold text-slate-400">Aucun dossier dans cette étape</p>
                          </div>
                        ) : (
                          colEmployees.map((emp) => (
                            <motion.div
                              key={emp.id}
                              whileHover={{ y: -2 }}
                              className="bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700/80 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-3"
                              onClick={() => setSelectedEmployee(emp)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                                    {emp.full_name?.charAt(0)}
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight hover:text-[#2563eb] transition-colors">
                                      {emp.full_name}
                                    </h4>
                                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{emp.poste}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] font-extrabold">
                                <span className="px-2 py-0.5 rounded bg-[#2563eb]/15 text-[#2563eb]">
                                  {emp.type_contrat || "CDI"}
                                </span>
                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Actif
                                </span>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ────────────────────────────────────────────────────────────── */}
          {/* 3. VUE LISTE (REGISTRE ANALYTIQUE SHEET)                       */}
          {/* ────────────────────────────────────────────────────────────── */}
          {viewMode === "list" && (
            <motion.div
              key="list-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <ListIcon className="h-4 w-4 text-[#2563eb]" /> Registre des Collaborateurs
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Vue synthétique pour consultation et extraction des dossiers personnels</p>
                </div>
                <button 
                  onClick={() => alert("Exportation du Registre des salariés générée avec succès !")}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-black hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-xs"
                >
                  <Download className="h-4 w-4 text-amber-400" /> Export Excel
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 font-black uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-4">Collaborateur</th>
                        <th className="py-3 px-4">Poste Occupé</th>
                        <th className="py-3 px-4">Département</th>
                        <th className="py-3 px-4">Type Contrat</th>
                        <th className="py-3 px-4 text-center">Statut Dossier</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                      {filteredEmployes.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedEmployee(emp)}>
                              <div className="h-8 w-8 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                                {emp.full_name?.charAt(0)}
                              </div>
                              <span className="font-black text-slate-900 dark:text-white hover:text-[#2563eb] transition-colors">{emp.full_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{emp.poste}</td>
                          <td className="py-3 px-4 text-slate-500 uppercase tracking-wide text-[11px] font-bold">{emp.departement || "Général"}</td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-[#2563eb]/15 text-[#2563eb]">
                              {emp.type_contrat || "CDI"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-black">
                              <Check className="h-3 w-3" /> Validé
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedEmployee(emp)}
                              className="text-[#2563eb] hover:underline font-black text-xs inline-flex items-center gap-1"
                            >
                              Inspecter <Eye className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ────────────────────────────────────────────────────────────── */}
          {/* 4. VUE MATRICE PIVOT BI & HEATMAP                             */}
          {/* ────────────────────────────────────────────────────────────── */}
          {viewMode === "pivot" && (
            <motion.div
              key="pivot-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Table className="h-4 w-4 text-[#2563eb]" /> Matrice Pivot BI
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Ventilation analytique de l'effectif et des contrats par pôle d'activité</p>
                </div>
                
                <button
                  onClick={() => setPivotHeatmapMode(!pivotHeatmapMode)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-2 ${
                    pivotHeatmapMode ? "bg-slate-900 text-white border-slate-900 shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-700"
                  }`}
                >
                  <SlidersVertical className="h-3.5 w-3.5 text-amber-400" /> Mode Heatmap
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden p-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        <th className="py-3 px-4 text-left">Département</th>
                        <th className="py-3 px-4 text-center">Effectif Total</th>
                        <th className="py-3 px-4 text-center">Part CDI (80%)</th>
                        <th className="py-3 px-4 text-center">Part CDD (20%)</th>
                        <th className="py-3 px-4 text-center">Demandes Congés</th>
                        <th className="py-3 px-4 text-right">Audit Conformité</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold">
                      {sortedPivotData.map((dept, idx) => {
                        const maxVal = Math.max(...chartDeptData.map(d => d.value), 1);
                        const intensity = pivotHeatmapMode ? Math.min(100, Math.round((dept.value / maxVal) * 100)) : 0;
                        
                        return (
                          <tr 
                            key={dept.name} 
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                            style={{
                              backgroundColor: pivotHeatmapMode && intensity > 0 ? `rgba(255, 130, 0, ${intensity * 0.0015})` : undefined
                            }}
                          >
                            <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                              <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
                              {dept.name}
                            </td>
                            <td className="py-3.5 px-4 text-center tabular-nums text-sm font-black text-slate-900 dark:text-white">
                              {dept.value}
                            </td>
                            <td className="py-3.5 px-4 text-center text-emerald-600 font-extrabold">{Math.round(dept.value * 0.8)} pers.</td>
                            <td className="py-3.5 px-4 text-center text-rose-500 font-extrabold">{Math.round(dept.value * 0.2)} pers.</td>
                            <td className="py-3.5 px-4 text-center text-[#2563eb]">{idx === 0 ? congesEnAttente.length : 0} en attente</td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-black text-[10px]">
                                100% Conforme
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ────────────────────────────────────────────────────────────── */}
          {/* 5. VUE IA STUDIO ASSISTANT TERMINAL                           */}
          {/* ────────────────────────────────────────────────────────────── */}
          {viewMode === "ai_copilot" && (
            <motion.div
              key="ai-copilot-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-white shadow-xl space-y-6">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-[#2563eb] to-indigo-600 flex items-center justify-center shadow-md">
                    <Cpu className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      Odoo AI Studio — Assistant RH Stratégique
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Synthèse automatisée et prédictions de gestion sociale</p>
                  </div>
                </div>

                {/* Badges shortcuts */}
                <div className="flex flex-wrap gap-2">
                  {[
                    "Analyse des risques CNPS",
                    "Renouvellement des CDD",
                    "Synthèse masse salariale",
                    "Arbitrage des congés"
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => {
                        setAiPromptInput(prompt);
                        handleRunAiPrompt(prompt);
                      }}
                      className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center gap-1.5"
                    >
                      <Sparkle className="h-3.5 w-3.5 text-amber-400 fill-current" /> {prompt}
                    </button>
                  ))}
                </div>

                {/* Input Bar */}
                <div className="flex items-center gap-2 bg-slate-800/90 p-2 rounded-xl border border-slate-700">
                  <input
                    type="text"
                    value={aiPromptInput}
                    onChange={(e) => setAiPromptInput(e.target.value)}
                    placeholder="Posez une question à l'assistant d'audit RH..."
                    className="w-full bg-transparent px-3 text-xs font-bold text-white placeholder-slate-400 outline-none"
                    onKeyDown={(e) => e.key === "Enter" && handleRunAiPrompt()}
                  />
                  <button
                    onClick={() => handleRunAiPrompt()}
                    disabled={isAiLoading}
                    className="px-5 py-2.5 rounded-lg bg-[#2563eb] text-white font-black text-xs hover:bg-[#E07400] transition-colors shrink-0 flex items-center gap-1.5 shadow-sm"
                  >
                    {isAiLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                    <span>Générer</span>
                  </button>
                </div>

                {/* AI Output Box */}
                {aiSimulatedResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-200 text-xs leading-relaxed font-semibold space-y-3"
                  >
                    <p>{aiSimulatedResponse}</p>
                    <button 
                      onClick={() => alert("Action stratégique transmise avec succès dans le système RH !")}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-colors inline-block shadow-xs"
                    >
                      ✓ Valider la recommandation
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── EMPLOYEE INSPECTION DRAWER ── */}
      <AnimatePresence>
        {selectedEmployee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end"
            onClick={() => setSelectedEmployee(null)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 p-6 overflow-y-auto space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-base shadow-sm">
                    {selectedEmployee.full_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">{selectedEmployee.full_name}</h3>
                    <p className="text-xs font-bold text-[#2563eb]">{selectedEmployee.poste}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-400">Département</span>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">{selectedEmployee.departement || "Général"}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-400">Type Contrat</span>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">{selectedEmployee.type_contrat || "CDI"}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Link
                  href={`/employes/${selectedEmployee.id}`}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-black text-center shadow-xs hover:bg-slate-800 transition-colors"
                >
                  Ouvrir Fiche Complète
                </Link>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COMMAND PALETTE OVERLAY (CTRL+K) ── */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start justify-center pt-24 px-4"
            onClick={() => setIsCommandPaletteOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -10 }}
              className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tapez une commande ou recherchez..."
                  className="w-full bg-transparent text-sm font-bold outline-none text-slate-900 dark:text-white"
                  autoFocus
                />
                <button onClick={() => setIsCommandPaletteOpen(false)} className="text-xs font-black px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">ESC</button>
              </div>
              <div className="p-3 max-h-80 overflow-y-auto space-y-1">
                <div className="text-[10px] font-black uppercase text-slate-400 px-3 py-1">Vues Disponibles</div>
                {[
                  { label: "Ouvrir Vue Cockpit Aperçu", mode: "overview" },
                  { label: "Ouvrir Vue Kanban Workflow", mode: "kanban" },
                  { label: "Ouvrir Registre Sheet", mode: "list" },
                  { label: "Ouvrir Matrice Pivot BI", mode: "pivot" },
                  { label: "Lancer IA Studio Terminal", mode: "ai_copilot" },
                ].map((item) => (
                  <button
                    key={item.mode}
                    onClick={() => {
                      setViewMode(item.mode as any);
                      setIsCommandPaletteOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-slate-800 dark:text-slate-200"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
