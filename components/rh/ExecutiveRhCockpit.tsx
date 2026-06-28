"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { KpiCard } from "@/components/rh/KpiCard";
import { ComplianceAlertList } from "@/components/rh/ComplianceAlertList";
import { QuickActions } from "@/components/rh/QuickActions";
import { Skeleton } from "@/components/ui/skeleton";

// Graphes (recharts) chargés à la demande — allège le premier rendu de /rh.
const DashboardCharts = dynamic(
  () => import("@/components/rh/DashboardCharts").then((m) => m.DashboardCharts),
  { ssr: false, loading: () => <Skeleton className="h-80 w-full rounded-2xl" /> }
);
import { DashboardHeroClient } from "@/components/rh/DashboardHeroClient";
import { AiSuggestionsWidget } from "@/components/rh/AiSuggestionsWidget";
import { ActionCenter, type ActionItem } from "@/components/rh/ActionCenter";
import { ChronometreWidget } from "@/components/rh/ChronometreWidget";
import { MesTachesWidget } from "@/components/rh/MesTachesWidget";
import { MonCalendrierAbsencesWidget } from "@/components/rh/MonCalendrierAbsencesWidget";
import { TableauAffichageWidget } from "@/components/rh/TableauAffichageWidget";
import { AnniversairesEvenementsWidget } from "@/components/rh/AnniversairesEvenementsWidget";
import { HrSuiteModulesWidget } from "@/components/rh/HrSuiteModulesWidget";
import { RessourcesInteretWidget } from "@/components/rh/RessourcesInteretWidget";
import { ParcoursGuidesWidget } from "@/components/rh/ParcoursGuidesWidget";
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
import { toast } from "sonner";
import { StatCard, SectionTitle } from "@/components/ui/page-shell";
import { Avatar } from "@/components/ui/avatar";

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

function DashboardSectionHeader({
  title,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = "emerald",
}: {
  title: string;
  subtitle?: string;
  icon: any;
  badge?: string;
  badgeColor?: "emerald" | "amber" | "blue" | "indigo";
}) {
  const badgeStyles = {
    emerald: "border-emerald-200 bg-emerald-100/80 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/80 dark:text-emerald-300",
    amber: "border-amber-200 bg-amber-100/80 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/80 dark:text-amber-300",
    blue: "border-blue-200 bg-blue-100/80 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/80 dark:text-blue-300",
    indigo: "border-indigo-200 bg-indigo-100/80 text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/80 dark:text-indigo-300",
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-linear-to-r from-slate-100/90 via-slate-50 to-emerald-50/40 px-5 py-3.5 shadow-2xs dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs dark:bg-emerald-600">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {badge && (
        <span className={`self-start sm:self-center rounded-full border px-3 py-0.5 text-[11px] font-bold ${badgeStyles[badgeColor]}`}>
          {badge}
        </span>
      )}
    </div>
  );
}

function SectionSeparator({ label }: { label?: string }) {
  return (
    <div className="relative py-4 my-2">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-slate-200/80 dark:border-slate-800" />
      </div>
      {label && (
        <div className="relative flex justify-center">
          <span className="bg-slate-50 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:bg-slate-950">
            {label}
          </span>
        </div>
      )}
    </div>
  );
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

  // Ctrl+K est géré par la palette de commandes globale (cf. layout). Ici, le
  // sélecteur de vues s'ouvre via son bouton dédié pour éviter le double raccourci.

  // Filtre synchronisé sur l'effectif réel (Kanban, Liste, Pivot, Aperçu)
  const filteredEmployes = useMemo(() => {
    return (derniersEmployes ?? []).filter((emp) => {
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

  // Synchronized Grouping for Kanban View
  const kanbanColumns = useMemo(() => {
    if (kanbanGroupBy === "stage") {
      const essaiCount = filteredEmployes.filter(e => e.type_contrat === "STAGE" || e.type_contrat === "CDD").length;
      const cdiCount = filteredEmployes.filter(e => e.type_contrat === "CDI").length;
      const cddCount = filteredEmployes.filter(e => e.type_contrat === "CDD").length;
      return [
        { id: "embauche", title: "Recrutement & Sourcing", count: postesOuverts, color: "bg-teal-500", badgeBg: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300" },
        { id: "essai", title: "Période d'Essai", count: essaiCount, color: "bg-amber-500", badgeBg: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
        { id: "en_poste", title: "Collaborateurs En Poste", count: cdiCount, color: "bg-emerald-500", badgeBg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
        { id: "echeance", title: "Échéances CDD & Risques", count: cddCount, color: "bg-rose-500", badgeBg: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
      ];
    }

    // Dynamic department grouping based on filtered dataset
    const deptMap: Record<string, number> = {
      "Direction & IT": 0,
      "Finance & Compta": 0,
      "Ressources Humaines": 0,
      "Opérations & Logistique": 0,
    };

    filteredEmployes.forEach((emp) => {
      const d = emp.departement || "Direction & IT";
      deptMap[d] = (deptMap[d] || 0) + 1;
    });

    const colors = ["bg-teal-600", "bg-[#059669]", "bg-emerald-600", "bg-amber-500", "bg-slate-600"];
    return Object.entries(deptMap).map(([name, count], idx) => ({
      id: name,
      title: name,
      count,
      color: colors[idx % colors.length],
      badgeBg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
    }));
  }, [kanbanGroupBy, filteredEmployes, postesOuverts]);

  // Synchronized Sorted Pivot BI Data
  const sortedPivotData = useMemo(() => {
    const deptMap: Record<string, { total: number; cdi: number; cdd: number }> = {
      "Direction & IT": { total: 0, cdi: 0, cdd: 0 },
      "Finance & Compta": { total: 0, cdi: 0, cdd: 0 },
      "Ressources Humaines": { total: 0, cdi: 0, cdd: 0 },
      "Opérations & Logistique": { total: 0, cdi: 0, cdd: 0 },
    };

    filteredEmployes.forEach((emp) => {
      const d = emp.departement || "Direction & IT";
      if (!deptMap[d]) deptMap[d] = { total: 0, cdi: 0, cdd: 0 };
      deptMap[d].total += 1;
      if (emp.type_contrat === "CDD") deptMap[d].cdd += 1;
      else deptMap[d].cdi += 1;
    });

    const list = Object.entries(deptMap).map(([name, data]) => ({
      name,
      value: data.total,
      cdi: data.cdi,
      cdd: data.cdd
    }));

    return list.sort((a, b) => {
      if (pivotSortColumn === "name") return a.name.localeCompare(b.name);
      if (pivotSortColumn === "cdi") return b.cdi - a.cdi;
      if (pivotSortColumn === "cdd") return b.cdd - a.cdd;
      return b.value - a.value;
    });
  }, [filteredEmployes, pivotSortColumn]);

  // Handle AI Prompt Simulation with multi-question and multi-line structured responses
  const handleRunAiPrompt = (query?: string) => {
    const q = query || aiPromptInput;
    if (!q) return;
    setIsAiLoading(true);
    setAiSimulatedResponse(null);

    setTimeout(() => {
      setIsAiLoading(false);
      const lowerQ = q.toLowerCase();
      const responses: string[] = [];

      // Check for CDD / Contrats / Noms / Expiration
      if (lowerQ.includes("cdd") || lowerQ.includes("contrat") || lowerQ.includes("renouvellement") || lowerQ.includes("nom") || lowerQ.includes("expiration")) {
        const contractAlerts = allAlerts?.filter((a) => a.type === "CONTRACT");
        let listStr = "";
        
        // Dynamically extract CDD employees from the synchronized filtered dataset
        const synchronizedCddList = filteredEmployes.filter((e) => e.type_contrat === "CDD");
        if (synchronizedCddList.length > 0) {
          listStr = synchronizedCddList.map((e) => `• ${e.full_name} (${e.poste}) — Fin de contrat CDD imminente (${e.departement || "Général"})`).join("\n");
        } else if (contractAlerts && contractAlerts.length > 0) {
          listStr = contractAlerts.map((a) => `• ${a.employeeName} — Échéance le ${new Date(a.date).toLocaleDateString("fr-FR")} (Contrat ${a.severity === "CRITICAL" ? "Urgent" : "CDD"})`).join("\n");
        } else {
          listStr = "• Bamba Yao (Développeur Fullstack) — Échéance le 30/06/2026\n• Camara Drogba (Chef de Projet) — Échéance le 31/07/2026";
        }

        responses.push(
          `📄 AUDIT DES CONTRATS CDD & ÉCHÉANCES SYNCHRONISÉ :\n` +
          `Nous avons identifié ${synchronizedCddList.length || cddExpirant || 2} contrat(s) CDD actifs et sous surveillance :\n\n` +
          `${listStr}\n\n` +
          `💡 Recommandation Stratégique :\n` +
          `1. Organiser les entretiens de fin de contrat d'ici la fin de semaine.\n` +
          `2. Valider la transformation en CDI pour les profils clés ou procéder au renouvellement formel.`
        );
      }

      // Check for CNPS / FDFP / Risques / Conformité
      if (lowerQ.includes("cnps") || lowerQ.includes("fdfp") || lowerQ.includes("risques") || lowerQ.includes("conformité")) {
        responses.push(
          `🛡️ AUDIT DE CONFORMITÉ SOCIALE & CNPS :\n` +
          `• Déclarations CNPS (Q1) : Validées et auditées à 98.4%.\n` +
          `• Dossiers de formation FDFP : 2 dossiers en attente d'approbation finale (Montant estimé : 1,450,000 FCFA).\n` +
          `• Action requise : Transmettre l'attestation de régularité fiscale avant le 15 du mois pour éviter toute pénalité.`
        );
      }

      // Check for Masse salariale / Paie / Salaires
      if (lowerQ.includes("masse") || lowerQ.includes("paie") || lowerQ.includes("salariale") || lowerQ.includes("budget")) {
        responses.push(
          `📊 SYNTHÈSE DE LA MASSE SALARIALE :\n` +
          `• Évolution mensuelle : +1.2% par rapport au mois N-1 (conforme aux prévisions).\n` +
          `• Structure des rémunérations : Les primes et indemnités représentent 6.5% du volume global.\n` +
          `• Diagnostic : Aucun dépassement de budget ni anomalie détectée sur la paie en cours.`
        );
      }

      // Check for Congés / Absences
      if (lowerQ.includes("congé") || lowerQ.includes("conge") || lowerQ.includes("absence") || lowerQ.includes("arbitrage")) {
        responses.push(
          `📅 GESTION DES CONGÉS ET ABSENCES :\n` +
          `• Demandes en attente d'arbitrage : ${congesEnAttente.length} dossier(s).\n` +
          `• Impact opérationnel : Faible sur le département IT, modéré sur les Opérations.\n` +
          `• Action recommandée : Valider les plannings avant le début du mois prochain.`
        );
      }

      // If no specific keyword matched or general summary requested
      if (responses.length === 0) {
        responses.push(
          `⚡ SYNTHÈSE EXÉCUTIVE RH — ${dateLabel} :\n\n` +
          `• Score de conformité global : ${Math.round(complianceScore)}% (Statut : Excellent).\n` +
          `• Effectif total sous gestion : ${filteredEmployes.length} collaborateurs filtrés / synchronisés.\n` +
          `• Alertes prioritaires : ${filteredEmployes.filter(e => e.type_contrat === "CDD").length} CDD sous surveillance et ${congesEnAttente.length} demande(s) de congés en attente.\n\n` +
          `N'hésitez pas à poser une question plus spécifique sur les salariés, la masse salariale ou la conformité CNPS.`
        );
      }

      setAiSimulatedResponse(responses.join("\n\n───────────────────────────────────────\n\n"));
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 pb-24 selection:bg-primary selection:text-white">
      
      {/* ── Barre d'outils du cockpit (titre + recherche + actions) ── */}
      {/* Non sticky : la barre de navigation globale (TopNav) reste la seule barre fixe. */}
      <header className="relative bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">

        {/* Titre de page & contrôles */}
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">

          {/* Titre de page */}
          <div className="flex items-center justify-between md:justify-start gap-3">
            <div>
              <h1 className="font-heading text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Tableau de bord
              </h1>
              <p className="text-xs font-medium text-slate-500 capitalize mt-0.5">{dateLabel}</p>
            </div>

            {/* Mobile quick action */}
            <Link
              href="/employes"
              className="md:hidden p-1.5 rounded-lg bg-primary text-white shadow-xs"
            >
              <Plus className="h-4 w-4" />
            </Link>
          </div>

          {/* Odoo-Style Central Search & Action Buttons */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            
            {/* Odoo Control Panel Search Bar */}
            <div className="relative flex-1 md:w-80 flex items-center bg-slate-100 dark:bg-slate-800 focus-within:bg-white dark:focus-within:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 border border-slate-200 dark:border-slate-700 transition-all shadow-2xs h-9">
              <Search className="h-4 w-4 shrink-0 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Rechercher un salarié, un poste…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs font-medium outline-none placeholder-slate-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600 mr-1">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300 shrink-0"
              >
                ⌘K
              </button>
            </div>

            {/* Main Primary CTA Button */}
            <Link
              href="/employes"
              className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-all shadow-2xs active:scale-95 shrink-0 h-9"
            >
              <UserPlus className="h-4 w-4 stroke-[2]" />
              <span>Nouveau Salarié</span>
            </Link>
          </div>
        </div>

        {/* ── Barre de contrôle (filtres + vues) — épurée ── */}
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8 py-2.5 border-t border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">

          {/* Group 1: Quick Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
              <Filter className="h-3.5 w-3.5 text-primary" />
              Filtres
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { id: "all", label: "Tous les salariés" },
                { id: "cdi", label: "CDI Uniquement" },
                { id: "cdd", label: "CDD & Échéances" },
              ].map((f) => {
                const isActive = activeFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      isActive
                        ? "bg-primary text-white shadow-sm ring-2 ring-primary/20"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden sm:block h-4 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* Group 2: View Mode Switcher */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <span className="hidden lg:inline text-xs font-semibold text-slate-500 uppercase tracking-wider">Vues</span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 relative ${
                      isActive
                        ? tab.special
                          ? "bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400"
                          : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-200 dark:ring-slate-700"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40"
                    }`}
                  >
                    <IconComp className={`h-3.5 w-3.5 ${isActive && !tab.special ? "text-primary" : isActive && tab.special ? "text-amber-300" : ""}`} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {isActive && (
                      <span className={`h-1.5 w-1.5 rounded-full ${tab.special ? "bg-amber-200" : "bg-primary"} ml-0.5`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* ── Indicateurs clés (StatCards éditoriales, cliquables) ── */}
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 pt-6 pb-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            label="Effectif filtré"
            value={filteredEmployes.length}
            sub={activeFilter !== "all" || searchQuery ? "Filtre actif" : "Total sous gestion"}
            icon={<Users className="h-4 w-4" />}
            tone="brand"
            onClick={() => { setViewMode("list"); setActiveFilter("all"); setSearchQuery(""); }}
          />
          <StatCard
            label="Congés en attente"
            value={congesEnAttente?.length ?? 0}
            sub="Arbitrages requis"
            icon={<CalendarCheck2 className="h-4 w-4" />}
            tone="warning"
            onClick={() => setViewMode("overview")}
          />
          <StatCard
            label="CDD à échéance"
            value={filteredEmployes.filter((e) => e.type_contrat === "CDD").length || cddExpirant}
            sub={activeFilter === "cdd" ? "Filtre CDD actif" : "Sous surveillance"}
            icon={<AlertTriangle className="h-4 w-4" />}
            tone="danger"
            onClick={() => { setViewMode("kanban"); setKanbanGroupBy("stage"); setActiveFilter("cdd"); }}
          />
          <StatCard
            label="Postes ouverts"
            value={postesOuverts}
            sub="Recrutement actif"
            icon={<UserCheck2 className="h-4 w-4" />}
            tone="default"
            onClick={() => { setViewMode("kanban"); setKanbanGroupBy("department"); }}
          />
          <StatCard
            label="Conformité RH"
            value={`${Math.round(complianceScore)}%`}
            sub="Audit CNPS & Légal"
            icon={<ShieldCheck className="h-4 w-4" />}
            tone="success"
            onClick={() => setViewMode("pivot")}
          />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MAIN VIEW CONTENT AREA                                           */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <main className="mx-auto max-w-[1600px] px-4 sm:px-8 pt-4">
        <AnimatePresence mode="wait">
          
          {/* ────────────────────────────────────────────────────────────── */}
          {/* 1. VUE OVERVIEW (APERÇU SYNTHÉTIQUE MODULAIRE)                   */}
          {/* ────────────────────────────────────────────────────────────── */}
          {viewMode === "overview" && (
            <motion.div
              key="overview-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              {/* Hero Banner Executive with 3D Illustration & Telemetry */}
              <DashboardHeroClient
                totalActifs={filteredEmployes.length}
                complianceScore={complianceScore}
                congesEnAttente={congesEnAttente?.length ?? 0}
                dateLabel={dateLabel}
              />

              {/* ────────────────────────────────────────────────────────────── */}
              {/* SECTION 1: PILOTAGE & ALERTES PRIORITAIRES                      */}
              {/* ────────────────────────────────────────────────────────────── */}
              <section className="space-y-6">
                <DashboardSectionHeader
                  title="1. PILOTAGE & DÉCISIONS REQUISES"
                  subtitle="Alertes de conformité légale/CNPS et centre d'arbitrage prioritaire"
                  icon={AlertTriangle}
                  badge="Urgent & Prioritaire"
                  badgeColor="amber"
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-8 space-y-6">
                    <ComplianceAlertList alerts={allAlerts} />
                    <ActionCenter items={actionItems} />
                  </div>
                  <div className="lg:col-span-4 space-y-6">
                    <AiSuggestionsWidget
                      totalActifs={totalActifs}
                      cddExpirant={cddExpirant}
                      medicalAlertsCount={medicalAlertsCount}
                      evalBrouillon={evalBrouillon}
                      contentieuxOuverts={contentieuxOuverts}
                      congesEnAttente={congesEnAttente?.length ?? 0}
                    />
                    <QuickActions />
                  </div>
                </div>
              </section>

              <SectionSeparator label="Opérations & Agenda" />

              {/* ────────────────────────────────────────────────────────────── */}
              {/* SECTION 2: GESTION OPÉRATIONNELLE & AGENDA RH                   */}
              {/* ────────────────────────────────────────────────────────────── */}
              <section className="space-y-6">
                <DashboardSectionHeader
                  title="2. OPÉRATIONNEL & AGENDA DES ÉQUIPES"
                  subtitle="Calendrier des absences, chronomètre et parcours de formation"
                  icon={CalendarCheck2}
                  badge="Quotidien"
                  badgeColor="blue"
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <MonCalendrierAbsencesWidget />
                      <ParcoursGuidesWidget />
                    </div>
                  </div>
                  <div className="lg:col-span-4 space-y-6">
                    <ChronometreWidget />
                    <MesTachesWidget />
                  </div>
                </div>
              </section>

              <SectionSeparator label="Analytique & KPIs" />

              {/* ────────────────────────────────────────────────────────────── */}
              {/* SECTION 3: PERFORMANCE & ANALYTIQUE RH                         */}
              {/* ────────────────────────────────────────────────────────────── */}
              <section className="space-y-6">
                <DashboardSectionHeader
                  title="3. ANALYTIQUE & RÉPARTITION DE LA MASSE SALARIALE"
                  subtitle="Statistiques par département et répartition par genre"
                  icon={BarChart3}
                  badge="Analytique"
                  badgeColor="emerald"
                />

                <div>
                  <DashboardCharts deptData={chartDeptData} genderData={chartGenderData} />
                </div>
              </section>

              <SectionSeparator label="Suite Modulaire & Outils" />

              {/* ────────────────────────────────────────────────────────────── */}
              {/* SECTION 4: SUITE MODULES RH & COMMUNICATION INTERNE             */}
              {/* ────────────────────────────────────────────────────────────── */}
              <section className="space-y-6">
                <DashboardSectionHeader
                  title="4. MODULES SUITE RH & RESSOURCES INTERNES"
                  subtitle="Accès rapide aux applications et tableau d'affichage"
                  icon={Layers}
                  badge="Outillage RH"
                  badgeColor="indigo"
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-8 space-y-6">
                    <HrSuiteModulesWidget />
                  </div>
                  <div className="lg:col-span-4 space-y-6">
                    <AnniversairesEvenementsWidget />
                    <TableauAffichageWidget />
                    <RessourcesInteretWidget />
                  </div>
                </div>
              </section>
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
                  <span className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Sliders className="h-4 w-4 text-[#059669]" /> Regroupement :
                  </span>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                      onClick={() => setKanbanGroupBy("department")}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                        kanbanGroupBy === "department" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : "text-slate-500"
                      }`}
                    >
                      Par Département
                    </button>
                    <button
                      onClick={() => setKanbanGroupBy("stage")}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                        kanbanGroupBy === "stage" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : "text-slate-500"
                      }`}
                    >
                      Par Étape RH
                    </button>
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-500">
                  Affichage de <span className="text-[#059669] font-bold">{filteredEmployes.length}</span> cartes
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
                          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">{col.title}</h3>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${col.badgeBg}`}>
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
                                  <Avatar src={emp.photo_url} name={emp.full_name} size={36} />
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight hover:text-[#059669] transition-colors">
                                      {emp.full_name}
                                    </h4>
                                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{emp.poste}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] font-extrabold">
                                <span className="px-2 py-0.5 rounded bg-[#059669]/15 text-[#059669]">
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
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ListIcon className="h-4 w-4 text-[#059669]" /> Registre des Collaborateurs
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Vue synthétique pour consultation et extraction des dossiers personnels</p>
                </div>
                <a
                  href="/api/employees/export?statut=actif"
                  download
                  onClick={() => toast.success("Export du registre lancé")}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-2xs"
                >
                  <Download className="h-4 w-4 text-slate-500" /> Export Excel
                </a>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 font-bold uppercase tracking-wider text-slate-500">
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
                              <Avatar src={emp.photo_url} name={emp.full_name} size={32} />
                              <span className="font-bold text-slate-900 dark:text-white hover:text-[#059669] transition-colors">{emp.full_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{emp.poste}</td>
                          <td className="py-3 px-4 text-slate-500 uppercase tracking-wide text-[11px] font-bold">{emp.departement || "Général"}</td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#059669]/15 text-[#059669]">
                              {emp.type_contrat || "CDI"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                              <Check className="h-3 w-3" /> Validé
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedEmployee(emp)}
                              className="text-[#059669] hover:underline font-bold text-xs inline-flex items-center gap-1"
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
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Table className="h-4 w-4 text-[#059669]" /> Matrice Pivot BI
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Ventilation analytique de l'effectif et des contrats par pôle d'activité</p>
                </div>
                
                <button
                  onClick={() => setPivotHeatmapMode(!pivotHeatmapMode)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
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
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
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
                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                              <span className="h-2.5 w-2.5 rounded-full bg-[#059669]" />
                              {dept.name}
                            </td>
                            <td className="py-3.5 px-4 text-center tabular-nums text-sm font-bold text-slate-900 dark:text-white">
                              {dept.value}
                            </td>
                            <td className="py-3.5 px-4 text-center text-emerald-600 font-extrabold">{Math.round(dept.value * 0.8)} pers.</td>
                            <td className="py-3.5 px-4 text-center text-rose-500 font-extrabold">{Math.round(dept.value * 0.2)} pers.</td>
                            <td className="py-3.5 px-4 text-center text-[#059669]">{idx === 0 ? congesEnAttente.length : 0} en attente</td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px]">
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
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                  <div className="h-12 w-12 rounded-xl bg-[#059669]/10 text-[#059669] flex items-center justify-center shrink-0 border border-[#059669]/20">
                    <Cpu className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      AI Studio RH — Assistant Stratégique
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">Synthèse automatisée, réponses multi-questions et prédictions RH</p>
                  </div>
                </div>

                {/* Badges shortcuts */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2.5">
                    Raccourcis d'analyses prioritaires :
                  </label>
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
                        className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-[#059669]/10 hover:text-[#059669] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkle className="h-3.5 w-3.5 text-[#059669]" /> {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Multi-line Input Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-[#059669] focus-within:ring-2 focus-within:ring-[#059669]/20 transition-all">
                  <textarea
                    rows={3}
                    value={aiPromptInput}
                    onChange={(e) => setAiPromptInput(e.target.value)}
                    placeholder="Posez vos questions à l'assistant (ex: Noms des CDD expirants et analyse CNPS). Entrée pour envoyer, Shift+Entrée pour un saut de ligne..."
                    className="w-full bg-transparent px-2 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 outline-none resize-y min-h-[64px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleRunAiPrompt();
                      }
                    }}
                  />
                  <button
                    onClick={() => handleRunAiPrompt()}
                    disabled={isAiLoading}
                    className="px-5 py-3 rounded-lg bg-[#059669] text-white font-bold text-xs hover:bg-[#047857] transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
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
                    className="p-6 rounded-xl bg-[#059669]/5 border border-[#059669]/20 text-slate-800 dark:text-slate-200 text-xs leading-relaxed font-medium space-y-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <Sparkle className="h-5 w-5 text-[#059669] shrink-0 mt-0.5" />
                      <div className="flex-1 whitespace-pre-wrap font-sans text-xs leading-relaxed space-y-1.5">
                        {aiSimulatedResponse}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-[#059669]/10 flex items-center justify-end">
                      <button
                        onClick={() => toast.success("Recommandation transmise au système RH")}
                        className="px-4 py-2 rounded-xl bg-[#059669] text-white font-bold text-xs hover:bg-[#047857] transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Check className="h-4 w-4" /> Valider la recommandation
                      </button>
                    </div>
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
                  <Avatar src={selectedEmployee.photo_url} name={selectedEmployee.full_name} size={44} rounded="xl" className="shadow-sm" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{selectedEmployee.full_name}</h3>
                    <p className="text-xs font-bold text-[#059669]">{selectedEmployee.poste}</p>
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
                  <span className="text-[10px] font-bold uppercase text-slate-400">Département</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedEmployee.departement || "Général"}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Type Contrat</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedEmployee.type_contrat || "CDI"}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Link
                  href={`/employes/${selectedEmployee.id}`}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold text-center shadow-xs hover:bg-slate-800 transition-colors"
                >
                  Ouvrir Fiche Complète
                </Link>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
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
                <button onClick={() => setIsCommandPaletteOpen(false)} className="text-xs font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">ESC</button>
              </div>
              <div className="p-3 max-h-80 overflow-y-auto space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-400 px-3 py-1">Vues Disponibles</div>
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
