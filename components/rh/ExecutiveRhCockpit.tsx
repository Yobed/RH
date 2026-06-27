"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KpiCard } from "@/components/rh/KpiCard";
import { ComplianceAlertList } from "@/components/rh/ComplianceAlertList";
import { QuickActions } from "@/components/rh/QuickActions";
import { DashboardCharts } from "@/components/rh/DashboardCharts";
import { DashboardHeroClient } from "@/components/rh/DashboardHeroClient";
import { AiSuggestionsWidget } from "@/components/rh/AiSuggestionsWidget";
import { ActionCenter, type ActionItem } from "@/components/rh/ActionCenter";
import {
  UsersIcon as Users,
  WarningIcon as FileWarning,
  BriefcaseIcon as Briefcase,
  ScalesIcon as Scale,
  ArrowRightIcon as ArrowRight,
  SparklesIcon as Sparkles,
  CheckCircleIcon as CheckCircle,
  ClockIcon as Clock,
} from "@/components/rh/ClientIcons";
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
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "activity">("overview");

  return (
    <div className="relative min-h-screen pb-12">
      <div className="mx-auto px-4 sm:px-6 py-6 space-y-8 max-w-[1440px]">
        
        {/* ── HERO BANNER ── */}
        <DashboardHeroClient
          totalActifs={totalActifs}
          complianceScore={Math.round(complianceScore)}
          congesEnAttente={congesEnAttente?.length ?? 0}
          dateLabel={dateLabel}
        />

        {/* ── COCKPIT INTERACTIVE TABS ── */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`relative px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "overview"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Sparkles className="h-4 w-4 text-[#FF8200]" />
              Vue d'ensemble & Urgences
              {allAlerts.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-[#FF8200] text-white font-black">
                  {allAlerts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`relative px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "analytics"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              Analyses & Performance
            </button>

            <button
              onClick={() => setActiveTab("activity")}
              className={`relative px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "activity"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Users className="h-4 w-4" />
              Effectifs & Mouvements
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs font-medium text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              En ligne
            </span>
          </div>
        </div>

        {/* ── TAB CONTENT WITH ANIMATION ── */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* DUAL COLUMN EXECUTIVE GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT MAIN OPERATIONAL COLUMN (7 cols) */}
                <div className="lg:col-span-7 space-y-8">
                  
                  {/* À traiter center */}
                  <section className="space-y-3">
                    <SectionDivider label="Centre de Traitement Prioritaire" />
                    <ActionCenter items={actionItems} />
                  </section>

                  {/* Quick Actions */}
                  <section className="space-y-3">
                    <SectionDivider label="Actions Rapides" />
                    <QuickActions />
                  </section>

                  {/* Bento KPIs */}
                  <section className="space-y-4">
                    <SectionDivider label="Métriques Synthétiques" />
                    {/* Featured KPI - full width */}
                    <KpiCard
                      label="Effectif actif"
                      value={totalActifs}
                      icon={Users}
                      description="Collaborateurs en poste"
                      index={0}
                      featured
                    />
                    {/* Secondary KPIs - 2 columns for better readability */}
                    <div className="grid grid-cols-2 gap-4">
                      <KpiCard
                        label="Recrutements"
                        value={postesOuverts}
                        icon={Briefcase}
                        variant="success"
                        description="Postes ouverts"
                        index={1}
                      />
                      <KpiCard
                        label="Contentieux"
                        value={contentieuxOuverts}
                        icon={Scale}
                        description="Dossiers actifs"
                        variant={contentieuxOuverts > 0 ? "warning" : "default"}
                        index={2}
                      />
                      <KpiCard
                        label="Visites Médicales"
                        value={medicalAlertsCount}
                        icon={FileWarning}
                        description="Sous 30 jours"
                        variant={medicalAlertsCount > 0 ? "danger" : "default"}
                        index={3}
                      />
                      <KpiCard
                        label="Évaluations"
                        value={evalBrouillon}
                        icon={Briefcase}
                        description="En brouillon"
                        variant={evalBrouillon > 0 ? "warning" : "default"}
                        index={4}
                      />
                      <KpiCard
                        label="CDD Expirants"
                        value={cddExpirant}
                        icon={Briefcase}
                        description="Sous 30 jours"
                        variant={cddExpirant > 0 ? "danger" : "default"}
                        index={5}
                      />
                    </div>
                  </section>

                </div>

                {/* RIGHT INTELLIGENCE & ALERTS COLUMN (5 cols) */}
                <div className="lg:col-span-5 space-y-8 sticky top-6">
                  
                  {/* AI Suggestions Widget */}
                  <section className="space-y-3">
                    <SectionDivider label="Assistant IA & Recommandations" />
                    <AiSuggestionsWidget
                      totalActifs={totalActifs}
                      cddExpirant={cddExpirant}
                      medicalAlertsCount={medicalAlertsCount}
                      evalBrouillon={evalBrouillon}
                      contentieuxOuverts={contentieuxOuverts}
                      congesEnAttente={congesEnAttente?.length ?? 0}
                    />
                  </section>

                  {/* Compliance Alerts Feed */}
                  <section className="space-y-3">
                    <SectionDivider label="Alertes de Conformité Legal" />
                    <ComplianceAlertList alerts={allAlerts} />
                  </section>

                  {/* Compliance Detail if score < 100 */}
                  {complianceScore < 100 && (
                    <section className="space-y-3">
                      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            Pénalités de score ({Math.round(complianceScore)}/100)
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {missingDocsTotal > 0 && (
                            <PenaltyRow
                              label="Documents manquants"
                              detail={`${missingDocsTotal} doc(s) requis`}
                              points={Math.min(missingDocsTotal, 50)}
                              href="/employes"
                              linkLabel="Résoudre"
                              severity="medium"
                            />
                          )}
                          {cddExpirant > 0 && (
                            <PenaltyRow
                              label="CDD à échéance"
                              detail={`${cddExpirant} contrat(s)`}
                              points={cddExpirant * 8}
                              href="/employes"
                              linkLabel="Revoir"
                              severity="high"
                            />
                          )}
                          {essaiExpirant > 0 && (
                            <PenaltyRow
                              label="Essais à confirmer"
                              detail={`${essaiExpirant} période(s)`}
                              points={essaiExpirant * 10}
                              href="/employes"
                              linkLabel="Valider"
                              severity="high"
                            />
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                </div>

              </div>
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <section className="space-y-3">
                <SectionDivider label="Répartition & Structure des Effectifs" />
                <DashboardCharts deptData={chartDeptData} genderData={chartGenderData} />
              </section>
            </motion.div>
          )}

          {activeTab === "activity" && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* ALERTES & CONGÉS */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white leading-none">
                        Demandes de Congés
                      </h2>
                      <p className="text-[11px] text-slate-500 font-medium mt-1">
                        Approbations managériales en attente
                      </p>
                    </div>
                    <Link
                      href="/conges"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Voir tout <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {!congesEnAttente || congesEnAttente.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-500 font-medium">Aucune demande en attente.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {congesEnAttente.map((c) => {
                        const empRaw = c.employees;
                        const emp = Array.isArray(empRaw) ? empRaw[0] : empRaw;
                        return (
                          <div key={c.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {emp?.full_name?.charAt(0) ?? "?"}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-none">
                                  {emp?.full_name ?? "—"}
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium mt-1">
                                  {new Date(c.date_debut as string).toLocaleDateString("fr-CI")} · {c.nb_jours} jour{(c.nb_jours ?? 1) > 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {c.type}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Timeline documents */}
                <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-none mb-5">
                    Activité Documentaire Récente
                  </h2>
                  <div className="space-y-4">
                    {recentActivities?.map((act, i) => (
                      <div key={act.id} className="flex gap-3 relative">
                        {i < (recentActivities.length - 1) && (
                          <div className="absolute left-[13px] top-7 bottom-0 w-px bg-slate-100 dark:bg-slate-800" />
                        )}
                        <div className="h-7 w-7 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 z-10">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{act.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {(act.employees as { full_name?: string })?.full_name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table collaborateurs */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Derniers Collaborateurs Intégrés
                  </h2>
                  <Link
                    href="/employes"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Voir l'annuaire complet <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Collaborateur
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Poste & Département
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Type de Contrat
                        </th>
                        <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {derniersEmployes?.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {emp.full_name?.charAt(0)}
                              </div>
                              <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{emp.full_name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{emp.poste}</p>
                            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mt-0.5">
                              {emp.departement ?? "—"}
                            </p>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-xs font-semibold uppercase tracking-wide bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md">
                              {emp.type_contrat ?? "—"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                              {emp.statut}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2 pb-2">
      <div className="w-1 h-5 rounded-full bg-[#FF8200] shrink-0" />
      <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-100 whitespace-nowrap">
        {label}
      </h2>
      <div className="flex-1 h-px bg-gradient-to-r from-slate-300 via-slate-200 to-transparent dark:from-slate-700 dark:via-slate-800 dark:to-transparent" />
    </div>
  );
}

function PenaltyRow({
  label,
  detail,
  points,
  href,
  linkLabel,
  severity,
}: {
  label: string;
  detail: string;
  points: number;
  href: string;
  linkLabel: string;
  severity: "high" | "medium";
}) {
  const isHigh = severity === "high";
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`w-0.5 h-8 shrink-0 rounded-full self-stretch ${isHigh ? "bg-rose-400" : "bg-amber-400"}`} />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{label}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{detail}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
          -{points} pts
        </span>
        <Link
          href={href}
          className="text-[10px] font-semibold text-[#FF8200] hover:text-[#E06D00] hover:underline underline-offset-2"
        >
          {linkLabel}
        </Link>
      </div>
    </div>
  );
}
