"use client";

import { Fragment, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CaretDown,
  CaretRight,
  Info,
  Lightbulb,
  ShieldCheck,
  ArrowRight,
  MagnifyingGlass,
  Funnel,
  DownloadSimple,
  UserCheck,
  WarningOctagon,
  Sparkle,
  CheckCircle,
  X,
  PaperPlaneRight,
  TrendUp,
  Briefcase,
  CalendarCheck,
  CurrencyCircleDollar,
  GraduationCap,
} from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/ui/page-shell";
import {
  RISK_LEVEL_META,
  RISK_FACTORS_ORDERED,
  type RiskLevel,
  type RisqueDepartRow,
} from "@/lib/risque-depart";

type NiveauFilter = "tous" | RiskLevel;

function ScoreGauge({ score, niveau }: { score: number; niveau: RiskLevel }) {
  const meta = RISK_LEVEL_META[niveau];
  return (
    <div className="flex items-center gap-2.5 min-w-[140px]">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full transition-all ${meta.dot}`}
        />
      </div>
      <span className={`w-9 text-right font-display text-sm font-bold tabular-nums ${meta.text}`}>
        {score}
      </span>
    </div>
  );
}

function NiveauBadge({ niveau }: { niveau: RiskLevel }) {
  const meta = RISK_LEVEL_META[niveau];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${meta.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function CategoryTag({ category }: { category: string }) {
  const styleMap: Record<string, string> = {
    Rémunération: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
    Engagement: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300",
    Performance: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300",
    Contrat: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
    Climat: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300",
  };
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${styleMap[category] || "bg-slate-100 text-slate-600"}`}>
      {category}
    </span>
  );
}

// Carte « Méthodologie » : documente le barème et les seuils de niveau.
function MethodologyCard() {
  const [open, setOpen] = useState(false);
  const maxTotal = RISK_FACTORS_ORDERED.reduce((s, f) => s + f.weight, 0);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Info weight="duotone" className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-display text-sm font-bold text-slate-900 dark:text-white">
              Méthodologie & Barème Prédictif turnover
            </span>
            <span className="block text-xs text-slate-500">7 signaux RH analysés · Algorithme pondéré (Score max 100)</span>
          </span>
        </span>
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          {open ? "Masquer les détails" : "Consulter le barème"}
          {open ? <CaretDown className="h-4 w-4" /> : <CaretRight className="h-4 w-4" />}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100 dark:border-slate-800"
          >
            <div className="space-y-6 px-5 py-5">
              {/* Seuils de niveau */}
              <div>
                <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Échelle des Niveaux de Risque
                </p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {(["critique", "eleve", "modere", "faible"] as const).map((lvl) => {
                    const m = RISK_LEVEL_META[lvl];
                    const range =
                      lvl === "critique" ? "≥ 70 pts" : lvl === "eleve" ? "45 – 69 pts" : lvl === "modere" ? "20 – 44 pts" : "< 20 pts";
                    return (
                      <div key={lvl} className={`flex flex-col rounded-xl border p-3 ${m.badge}`}>
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <span className={`h-2 w-2 rounded-full ${m.dot}`} />
                          {m.label}
                        </div>
                        <span className="mt-1 font-display text-xs opacity-80">{range}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Barème des facteurs */}
              <div>
                <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Détail des 7 facteurs de risque (Total Théorique {maxTotal} pts)
                </p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {RISK_FACTORS_ORDERED.map((f) => (
                    <div
                      key={f.key}
                      className="flex items-start gap-3 rounded-xl border border-slate-200/70 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <span className="mt-0.5 shrink-0 rounded-lg bg-slate-900 px-2 py-1 font-display text-xs font-bold tabular-nums text-white dark:bg-slate-700">
                        +{f.weight}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{f.label}</p>
                          <CategoryTag category={f.category} />
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{f.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Détail par employé : facteurs déclenchés + recommandations RH + Action rapide.
function EmployeeDetail({
  row,
  onOpenAction,
}: {
  row: RisqueDepartRow;
  onOpenAction: (emp: RisqueDepartRow) => void;
}) {
  if (row.facteurs.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/50 px-4 py-3.5 text-xs font-medium text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
        <ShieldCheck weight="duotone" className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>Aucun facteur d&apos;alerte détecté. Le profil présente un niveau de rétention optimal et un engagement stable.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {row.facteurs.map((f) => (
          <div
            key={f.key}
            className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{f.label}</p>
                <span className="shrink-0 rounded-md bg-rose-50 px-2 py-0.5 font-display text-xs font-bold tabular-nums text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                  +{f.points} pts
                </span>
              </div>
              {f.detail && <p className="mt-0.5 text-[11px] font-semibold text-rose-500">{f.detail}</p>}
              <p className="mt-2 flex items-start gap-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                <Lightbulb weight="duotone" className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <span><strong className="font-semibold text-slate-800 dark:text-slate-200">Recommandation RH :</strong> {f.recommendation}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
          <Sparkle weight="fill" className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Plan d&apos;action préventif recommandé pour désamorcer le risque.</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenAction(row)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-95"
          >
            <PaperPlaneRight weight="bold" className="h-3.5 w-3.5" />
            Lancer un plan de rétention
          </button>
          <Link
            href={`/employes/${row.employee_id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Fiche collaborateur <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Modal d'action de rétention
function RetentionModal({
  employee,
  onClose,
}: {
  employee: RisqueDepartRow | null;
  onClose: () => void;
}) {
  const [actionType, setActionType] = useState("entretien");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!employee) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Avatar src={employee.photo_url} name={employee.full_name} size={36} rounded="full" />
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Plan de rétention : {employee.full_name}
              </h3>
              <p className="text-xs text-slate-500">{employee.poste} · Score : <span className="font-bold text-rose-600">{employee.score}/100</span></p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <CheckCircle weight="fill" className="h-12 w-12 text-emerald-500" />
            <h4 className="mt-3 font-display text-base font-bold text-slate-900 dark:text-white">Action enregistrée !</h4>
            <p className="mt-1 text-xs text-slate-500">Le plan d&apos;action de rétention a été consigné dans le dossier du collaborateur.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Mesure RH prioritaire
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "entretien", label: "Entretien 1-on-1", icon: UserCheck },
                  { id: "remuneration", label: "Révision salariale", icon: CurrencyCircleDollar },
                  { id: "formation", label: "Plan de formation", icon: GraduationCap },
                  { id: "contrat", label: "Renouvellement CDD", icon: CalendarCheck },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = actionType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActionType(item.id)}
                      className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Objectifs & Notes d&apos;accompagnement
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Précisez les points clés à aborder (ex. revalorisation salariale proposée, attentes de carrière, formation sollicitée)..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-95"
              >
                Valider l&apos;action de rétention
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export function RisqueDepartTable({ data }: { data: RisqueDepartRow[] }) {
  const [filter, setFilter] = useState<NiveauFilter>("tous");
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("tous");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionEmployee, setActionEmployee] = useState<RisqueDepartRow | null>(null);

  // Départements uniques
  const departments = useMemo(() => {
    const set = new Set<string>();
    data.forEach((e) => {
      if (e.departement && e.departement !== "—") set.add(e.departement);
    });
    return Array.from(set).sort();
  }, [data]);

  // Statistiques
  const counts = useMemo(
    () => ({
      critique: data.filter((e) => e.niveau === "critique").length,
      eleve: data.filter((e) => e.niveau === "eleve").length,
      modere: data.filter((e) => e.niveau === "modere").length,
      faible: data.filter((e) => e.niveau === "faible").length,
    }),
    [data]
  );

  const avgScore = useMemo(() => {
    if (data.length === 0) return 0;
    const sum = data.reduce((s, e) => s + e.score, 0);
    return Math.round(sum / data.length);
  }, [data]);

  // Filtrage combiné
  const filtered = useMemo(() => {
    return data.filter((emp) => {
      const matchNiveau = filter === "tous" || emp.niveau === filter;
      const matchDept = selectedDept === "tous" || emp.departement === selectedDept;
      const matchSearch =
        search === "" ||
        emp.full_name.toLowerCase().includes(search.toLowerCase()) ||
        emp.poste.toLowerCase().includes(search.toLowerCase()) ||
        emp.departement.toLowerCase().includes(search.toLowerCase());
      return matchNiveau && matchDept && matchSearch;
    });
  }, [data, filter, selectedDept, search]);

  const top5 = useMemo(() => data.filter((e) => e.score > 0).slice(0, 5), [data]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["ID", "Nom Complète", "Poste", "Département", "Score", "Niveau", "Nombre Facteurs"];
    const rows = filtered.map((e) => [
      e.employee_id,
      `"${e.full_name}"`,
      `"${e.poste}"`,
      `"${e.departement}"`,
      e.score,
      e.niveau,
      e.facteurs.length,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `risque_depart_rh_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Banner Exécutif de Synthèse */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendUp weight="bold" className="h-4 w-4" />
              </span>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Cockpit d&apos;Analyse du Turnover & Rétention
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">
              Surveillance proactive des signaux faibles de démission pour préserver le capital humain et réduire les coûts de recrutement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 md:border-t-0 md:pt-0 dark:border-slate-800">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="text-right">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Indice Moyen</span>
                <span className="font-display text-lg font-bold text-slate-900 dark:text-white">{avgScore} / 100</span>
              </div>
            </div>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <DownloadSimple weight="bold" className="h-4 w-4 text-emerald-600" />
              Exporter l&apos;Analyse (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Cards de résumé cliquables */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Critique"
          value={counts.critique}
          sub="≥ 70 pts · Action urgente"
          tone="danger"
          onClick={() => setFilter(filter === "critique" ? "tous" : "critique")}
        />
        <StatCard
          label="Élevé"
          value={counts.eleve}
          sub="45 – 69 pts · Vigilance RH"
          tone="warning"
          onClick={() => setFilter(filter === "eleve" ? "tous" : "eleve")}
        />
        <StatCard
          label="Modéré"
          value={counts.modere}
          sub="20 – 44 pts · Suivi régulier"
          tone="warning"
          onClick={() => setFilter(filter === "modere" ? "tous" : "modere")}
        />
        <StatCard
          label="Faible"
          value={counts.faible}
          sub="< 20 pts · Profils stables"
          tone="success"
          onClick={() => setFilter(filter === "faible" ? "tous" : "faible")}
        />
      </div>

      {/* Top 5 à surveiller en priorité */}
      {top5.length > 0 && (
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/30 p-5 dark:border-rose-900/40 dark:bg-rose-950/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <WarningOctagon weight="fill" className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <p className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Alerte Rétention — Top {top5.length} des collaborateurs les plus vulnérables
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {top5.map((emp) => (
              <button
                key={emp.employee_id}
                onClick={() => {
                  setFilter("tous");
                  setSelectedDept("tous");
                  setSearch("");
                  setExpanded(emp.employee_id);
                }}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-left shadow-2xs transition-all hover:border-emerald-500/50 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <Avatar src={emp.photo_url} name={emp.full_name} size={26} rounded="full" />
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{emp.full_name}</p>
                  <p className="text-[10px] text-slate-400">{emp.poste}</p>
                </div>
                <span className={`ml-1 rounded-md px-1.5 py-0.5 font-display text-xs font-bold tabular-nums ${RISK_LEVEL_META[emp.niveau].text}`}>
                  {emp.score} pts
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Collapsible Méthodologie */}
      <MethodologyCard />

      {/* Barre d'outils de Recherche & Filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        {/* Recherche */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par collaborateur, poste, département..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-800 dark:text-white"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filtres Département & Niveau */}
        <div className="flex flex-wrap items-center gap-2">
          {departments.length > 0 && (
            <div className="relative">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="tous">Tous départements</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          {/* Boutons de Filtre Niveau */}
          <div className="flex flex-wrap items-center gap-1">
            {(["tous", "critique", "eleve", "modere", "faible"] as const).map((n) => (
              <button
                key={n}
                onClick={() => setFilter(n)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === n
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-2xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                }`}
              >
                {n === "tous" ? `Tous (${data.length})` : `${RISK_LEVEL_META[n].label} (${counts[n]})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tableau des Collaborateurs */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/70 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Collaborateur
                </th>
                <th className="hidden px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 md:table-cell">
                  Département & Ancienneté
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Score de Risque
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Niveau
                </th>
                <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Signaux Détectés
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <UserCheck className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm font-semibold">Aucun collaborateur ne correspond aux critères.</p>
                      <button
                        onClick={() => { setFilter("tous"); setSelectedDept("tous"); setSearch(""); }}
                        className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
                      >
                        Réinitialiser tous les filtres
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((emp) => {
                const isOpen = expanded === emp.employee_id;
                return (
                  <Fragment key={emp.employee_id}>
                    <tr
                      onClick={() => setExpanded(isOpen ? null : emp.employee_id)}
                      className={`cursor-pointer transition-colors ${
                        isOpen
                          ? "bg-slate-50 dark:bg-slate-800/50"
                          : "hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar src={emp.photo_url} name={emp.full_name} size={38} rounded="full" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                              {emp.full_name}
                            </p>
                            <p className="truncate text-xs text-slate-500">{emp.poste}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-5 py-3.5 text-xs text-slate-600 md:table-cell dark:text-slate-300">
                        <span className="font-semibold">{emp.departement}</span>
                        <span className="block text-[11px] text-slate-400">{emp.anciennete_ans.toFixed(1)} an(s) d&apos;ancienneté</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <ScoreGauge score={emp.score} niveau={emp.niveau} />
                      </td>
                      <td className="px-5 py-3.5">
                        <NiveauBadge niveau={emp.niveau} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-300">
                          {emp.facteurs.length} signal{emp.facteurs.length > 1 ? "s" : ""}
                          <CaretDown weight="bold" className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </span>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-slate-50/80 dark:bg-slate-800/30">
                        <td colSpan={5} className="px-6 py-5">
                          <EmployeeDetail row={emp} onOpenAction={(e) => setActionEmployee(e)} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retention Modal */}
      <AnimatePresence>
        {actionEmployee && (
          <RetentionModal employee={actionEmployee} onClose={() => setActionEmployee(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
