"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Users,
  CalendarCheck2,
  AlertTriangle,
  Briefcase,
  ArrowUpRight,
  ArrowRight,
  FileText,
  Clock,
  Stethoscope,
  FolderOpen,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { QuickActions } from "@/components/rh/QuickActions";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardCharts = dynamic(
  () => import("@/components/rh/DashboardCharts").then((m) => m.DashboardCharts),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-2xl" /> }
);

// ─────────────────────────────────────────────────────────────────────────
// Nouveau tableau de bord — composition bento éditoriale, accent aubergine.
// Héro avec anneau de conformité · KPI épurés · panneau « À traiter » focal.
// Consomme les mêmes données que /rh (rétro-compatible avec l'ancien cockpit).
// ─────────────────────────────────────────────────────────────────────────

const AUBERGINE = "#ee7f03";

interface Alert {
  id: string;
  type: "CONTRACT" | "TRIAL" | "MEDICAL" | "DOCUMENT";
  label: string;
  employeeName: string;
  date: string;
  urgency: "high" | "medium" | "low";
}

const ALERT_META: Record<Alert["type"], { icon: React.ElementType; href: string }> = {
  CONTRACT: { icon: FileText, href: "/contrats" },
  TRIAL: { icon: Clock, href: "/contrats" },
  MEDICAL: { icon: Stethoscope, href: "/medical" },
  DOCUMENT: { icon: FolderOpen, href: "/ged" },
};

const URGENCY: Record<Alert["urgency"], { label: string; cls: string }> = {
  high: { label: "Urgent", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  medium: { label: "À surveiller", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  low: { label: "Planifié", cls: "bg-slate-100 text-slate-600 border-slate-200" },
};

interface DashboardHomeProps {
  totalActifs: number;
  totalFemmes: number;
  cddExpirant: number;
  postesOuverts: number;
  complianceScore: number;
  dateLabel: string;
  allAlerts: Alert[];
  chartDeptData: { name: string; value: number }[];
  chartGenderData: { name: string; value: number }[];
  congesEnAttente: { id: string; type: string; nb_jours: number; employees?: { full_name?: string } | { full_name?: string }[] | null }[];
  recentActivities: { id: string; name: string; created_at: string; employees?: { full_name?: string } | { full_name?: string }[] | null }[];
  derniersEmployes: { id: string; full_name: string; poste?: string | null; photo_url?: string | null }[];
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function fmtDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("fr-CI", { day: "2-digit", month: "short" });
  } catch {
    return d;
  }
}

function ComplianceRing({ score }: { score: number }) {
  const r = 15.9;
  const dash = Math.max(0, Math.min(100, score));
  return (
    <div className="relative flex h-[104px] w-[104px] shrink-0 items-center justify-center">
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${dash} 100`}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="font-display text-2xl font-bold text-white tabular-nums">{Math.round(score)}%</span>
        <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/70">Conformité</span>
      </div>
    </div>
  );
}

export function DashboardHome({
  totalActifs,
  totalFemmes,
  cddExpirant,
  postesOuverts,
  complianceScore,
  dateLabel,
  allAlerts,
  chartDeptData,
  chartGenderData,
  congesEnAttente,
  recentActivities,
  derniersEmployes,
}: DashboardHomeProps) {
  const kpis = [
    { label: "Effectif actif", value: totalActifs, sub: `${totalFemmes} femmes`, icon: Users, href: "/employes" },
    { label: "Congés en attente", value: congesEnAttente.length, sub: "à arbitrer", icon: CalendarCheck2, href: "/conges", alert: congesEnAttente.length > 0 },
    { label: "CDD à échéance", value: cddExpirant, sub: "sous 30 jours", icon: AlertTriangle, href: "/contrats", alert: cddExpirant > 0 },
    { label: "Postes ouverts", value: postesOuverts, sub: "recrutement actif", icon: Briefcase, href: "/recrutement" },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 px-4 pb-12 pt-5 sm:px-6 md:px-8">
      {/* ── Héro ── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-2xl p-6 text-white shadow-[0_18px_40px_-22px_rgba(238,127,3,0.7)] sm:p-8"
        style={{ background: `linear-gradient(135deg, ${AUBERGINE} 0%, #d67002 55%, #b35c00 100%)` }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60 capitalize">{dateLabel}</p>
            <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {greeting()} <span className="text-white/55">·</span> RH Manager CI
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/70">
              {allAlerts.length > 0
                ? `${allAlerts.length} échéance${allAlerts.length > 1 ? "s" : ""} prioritaire${allAlerts.length > 1 ? "s" : ""} à traiter aujourd'hui.`
                : "Aucune échéance urgente — tout est sous contrôle."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/paie/generer-lot" className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-[13px] font-semibold text-[#d67002] transition-transform hover:scale-[1.02]">
                Lancer la paie <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/employes" className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-white/20">
                Voir l'effectif
              </Link>
            </div>
          </div>
          <ComplianceRing score={complianceScore} />
        </div>
      </motion.section>

      {/* ── KPI ── */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={k.href}
                className="group flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#ee7f03]/40 hover:shadow-[0_12px_28px_-16px_rgba(238,127,3,0.45)] dark:border-slate-800 dark:bg-slate-900 sm:p-5"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{k.label}</span>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${k.alert ? "bg-amber-50 text-amber-600" : "bg-[#ee7f03]/10 text-[#ee7f03] group-hover:bg-[#ee7f03] group-hover:text-white"}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <div>
                  <p className="font-display text-[2rem] font-bold leading-none tabular-nums text-slate-900 dark:text-white">{k.value}</p>
                  <p className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-slate-500">
                    {k.sub}
                    <ArrowUpRight className="h-3 w-3 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-[#ee7f03]" />
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </section>

      {/* ── Bento ── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Colonne principale (2/3) */}
        <div className="space-y-4 lg:col-span-2">
          {/* À traiter */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ee7f03]/10 text-[#ee7f03]">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">À traiter aujourd'hui</h2>
                  <p className="text-[11px] font-medium text-slate-400">Échéances & décisions prioritaires</p>
                </div>
              </div>
              <span className="rounded-full bg-[#ee7f03]/10 px-2.5 py-1 text-[12px] font-bold tabular-nums text-[#ee7f03]">{allAlerts.length}</span>
            </div>

            {allAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-5 py-12 text-center">
                <Sparkles className="h-7 w-7 text-[#ee7f03]/40" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tout est à jour</p>
                <p className="text-xs text-slate-400">Aucune échéance prioritaire pour le moment.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {allAlerts.map((a) => {
                  const meta = ALERT_META[a.type];
                  const Icon = meta.icon;
                  const u = URGENCY[a.urgency];
                  return (
                    <li key={`${a.id}-${a.type}`}>
                      <Link href={meta.href} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[#ee7f03]/[0.04]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-[#ee7f03]/10 group-hover:text-[#ee7f03] dark:bg-slate-800">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-slate-800 group-hover:text-[#ee7f03] dark:text-slate-100">{a.employeeName}</p>
                          <p className="truncate text-[12px] text-slate-500">{a.label} · {fmtDate(a.date)}</p>
                        </div>
                        <span className={`hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold sm:inline-block ${u.cls}`}>{u.label}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#ee7f03]" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Répartition de l'effectif (chart) */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 font-display text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">Répartition de l'effectif</h2>
            <DashboardCharts deptData={chartDeptData} genderData={chartGenderData} />
          </div>
        </div>

        {/* Rail (1/3) */}
        <div className="space-y-4">
          <QuickActions />

          {/* Derniers arrivants */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">Derniers arrivants</h2>
              <Link href="/employes" className="text-[12px] font-semibold text-[#ee7f03] hover:underline">Tout voir</Link>
            </div>
            {derniersEmployes.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">Aucun collaborateur récent.</p>
            ) : (
              <ul className="space-y-1">
                {derniersEmployes.slice(0, 5).map((e) => (
                  <li key={e.id}>
                    <Link href={`/employes/${e.id}`} className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <Avatar src={e.photo_url} name={e.full_name} size={32} rounded="lg" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-slate-800 group-hover:text-[#ee7f03] dark:text-slate-100">{e.full_name}</p>
                        <p className="truncate text-[11px] text-slate-400">{e.poste || "—"}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Activité récente */}
          {recentActivities.length > 0 && (
            <div className="rounded-2xl border border-slate-200/70 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 font-display text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">Activité récente</h2>
              <ul className="space-y-3">
                {recentActivities.slice(0, 5).map((act) => {
                  const who = Array.isArray(act.employees)
                    ? (act.employees[0] as { full_name?: string })?.full_name
                    : (act.employees as { full_name?: string } | null)?.full_name;
                  return (
                    <li key={act.id} className="flex items-start gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ee7f03]" />
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-medium text-slate-700 dark:text-slate-200">{act.name}</p>
                        <p className="text-[11px] text-slate-400">{who ?? "—"} · {fmtDate(act.created_at)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
