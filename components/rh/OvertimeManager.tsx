"use client";

import React, { useMemo, useState } from "react";
import { format, isSameMonth, isSameWeek, parseISO, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Plus, Search, Trash2, Clock, Calculator, Users, TrendingUp,
  Calendar as CalendarIcon, X,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createClientSupabase } from "@/lib/supabase/client";

// ── Types ───────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  full_name: string;
  matricule: string;
  salaire_brut: number;
}

interface OvertimeRecord {
  id: string;
  employee_id: string;
  date: string;
  hours_count: number;
  category: string;
  reason: string | null;
  statut: string;
  employee?: { full_name: string; matricule: string };
}

interface Props {
  employees: Employee[];
  initialRecords: OvertimeRecord[];
  companyId: string;
}

// ── Constantes — Art. 24 CT-CI / Décret n°96-203 ────────────────────────────

const HEURES_MENSUELLES = 173.33;

const CATEGORIES: Record<string, { label: string; factor: number; tone: string }> = {
  "15%":  { label: "15 %",  factor: 1.15, tone: "bg-sky-50 text-sky-700 border-sky-200" },
  "50%":  { label: "50 %",  factor: 1.50, tone: "bg-amber-50 text-amber-700 border-amber-200" },
  "75%":  { label: "75 %",  factor: 1.75, tone: "bg-violet-50 text-violet-700 border-violet-200" },
  "100%": { label: "100 %", factor: 2.00, tone: "bg-rose-50 text-rose-700 border-rose-200" },
};

const CATEGORY_HINTS: Record<string, string> = {
  "15%":  "Semaine — heures 41 à 48",
  "50%":  "Semaine au-delà de 48 h ou heures de nuit (21 h – 5 h)",
  "75%":  "Dimanche, jour férié ou nuit du dimanche / férié",
  "100%": "Cas exceptionnel — accord d'entreprise",
};

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n);

function tauxHoraire(salaireBrut: number): number {
  return salaireBrut > 0 ? Math.round(salaireBrut / HEURES_MENSUELLES) : 0;
}

function montantImputation(salaireBrut: number, category: string, hours: number): number {
  const factor = CATEGORIES[category]?.factor ?? 1;
  return Math.round(tauxHoraire(salaireBrut) * factor * hours);
}

// ── Composants UI ──────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-slate-200 bg-white ${className}`}>{children}</div>;
}

function KpiCard({
  label, value, sub, accent = "neutral",
}: {
  label: string; value: string; sub?: string;
  accent?: "neutral" | "positive" | "negative" | "warn";
}) {
  const accentBar = {
    neutral: "bg-slate-200",
    positive: "bg-emerald-500",
    negative: "bg-rose-500",
    warn: "bg-amber-500",
  }[accent];
  return (
    <div className="relative rounded-lg border border-slate-200 bg-white p-3.5 sm:p-5">
      <div className={`absolute left-0 top-3.5 bottom-3.5 sm:top-5 sm:bottom-5 w-0.5 rounded-r ${accentBar}`} />
      <p className="text-[11px] sm:text-xs text-slate-500 font-medium">{label}</p>
      <p className="mt-1 sm:mt-1.5 text-lg sm:text-2xl font-semibold text-slate-900 tabular-nums leading-tight break-words">{value}</p>
      {sub && <p className="mt-1 text-[10px] sm:text-xs text-slate-500 leading-snug">{sub}</p>}
    </div>
  );
}

function CategoryPill({ category }: { category: string }) {
  const meta = CATEGORIES[category];
  if (!meta) return <span className="text-xs text-slate-400">—</span>;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium tabular-nums border ${meta.tone}`}>
      {meta.label}
    </span>
  );
}

// ── Composant principal ─────────────────────────────────────────────────────

export function OvertimeManager({ employees, initialRecords, companyId }: Props) {
  const [records, setRecords] = useState<OvertimeRecord[]>(initialRecords);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPeriod, setFilterPeriod] = useState<"all" | "month" | "week" | "prevMonth">("month");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [employeeId, setEmployeeId] = useState("");
  const [hoursCount, setHoursCount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [category, setCategory] = useState("15%");
  const [reason, setReason] = useState("");

  const supabase = createClientSupabase();

  // ── Filtrage ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const now = new Date();
    const prevMonth = subMonths(now, 1);
    const q = search.toLowerCase().trim();
    return records.filter(r => {
      const recDate = parseISO(r.date);
      if (filterCategory !== "all" && r.category !== filterCategory) return false;
      if (filterPeriod === "month" && !isSameMonth(recDate, now)) return false;
      if (filterPeriod === "week" && !isSameWeek(recDate, now, { weekStartsOn: 1 })) return false;
      if (filterPeriod === "prevMonth" && !isSameMonth(recDate, prevMonth)) return false;
      if (q && !(r.employee?.full_name.toLowerCase().includes(q)
        || r.employee?.matricule.toLowerCase().includes(q)
        || (r.reason || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [records, search, filterCategory, filterPeriod]);

  // ── KPI ───────────────────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const totalHours = filtered.reduce((s, r) => s + (Number(r.hours_count) || 0), 0);
    const totalCost = filtered.reduce((s, r) => {
      const emp = employees.find(e => e.id === r.employee_id);
      if (!emp) return s;
      return s + montantImputation(emp.salaire_brut, r.category, Number(r.hours_count));
    }, 0);
    const personnel = new Set(filtered.map(r => r.employee_id)).size;

    // ratio surcharge = total HS / heures théoriques sur la période
    const theoHours = personnel * HEURES_MENSUELLES;
    const ratio = theoHours === 0 ? 0 : Math.round((totalHours / theoHours) * 1000) / 10;

    return { totalHours, totalCost, personnel, ratio };
  }, [filtered, employees]);

  // ── Recherche employé pour formulaire ────────────────────────────────────
  const [empSearch, setEmpSearch] = useState("");
  const employeeOptions = useMemo(() => {
    const q = empSearch.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter(e =>
      e.full_name.toLowerCase().includes(q) || e.matricule.toLowerCase().includes(q)
    );
  }, [employees, empSearch]);

  const selectedEmployee = useMemo(() => employees.find(e => e.id === employeeId), [employees, employeeId]);
  const previewMontant = useMemo(() => {
    if (!selectedEmployee || !hoursCount) return 0;
    return montantImputation(selectedEmployee.salaire_brut, category, Number(hoursCount));
  }, [selectedEmployee, hoursCount, category]);

  function resetForm() {
    setEmployeeId("");
    setHoursCount("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setCategory("15%");
    setReason("");
    setEmpSearch("");
  }

  async function handleAdd() {
    if (!employeeId || !hoursCount || !date) {
      toast.error("Renseignez l'employé, la date et le nombre d'heures.");
      return;
    }
    const hrs = Number(hoursCount);
    if (!Number.isFinite(hrs) || hrs <= 0 || hrs > 24) {
      toast.error("Nombre d'heures invalide (entre 0 et 24).");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("overtime_records")
        .insert({
          company_id: companyId,
          employee_id: employeeId,
          date,
          hours_count: hrs,
          category,
          reason: reason || null,
          statut: "approuve",
        })
        .select("*, employee:employees(full_name, matricule)")
        .single();

      if (error) throw error;
      setRecords([data as OvertimeRecord, ...records]);
      setIsDialogOpen(false);
      resetForm();
      toast.success("Heures supplémentaires enregistrées.");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet enregistrement ?")) return;
    try {
      const { error } = await supabase.from("overtime_records").delete().eq("id", id);
      if (error) throw error;
      setRecords(records.filter(r => r.id !== id));
      toast.success("Enregistrement supprimé.");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression.");
    }
  }

  const periodLabel = {
    all: "Toutes périodes",
    month: "Ce mois",
    week: "Cette semaine",
    prevMonth: "Mois précédent",
  }[filterPeriod];

  const isFiltered = search !== "" || filterCategory !== "all" || filterPeriod !== "month";

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-4 sm:gap-5 pb-4 border-b border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">Paie · Art. 24 CT-CI</p>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">Heures supplémentaires</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-1.5 leading-snug">
              Saisie, contrôle et chiffrage des heures majorées.
              <span className="text-slate-700 font-medium block sm:inline sm:ml-1">· {periodLabel}</span>
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(v) => { setIsDialogOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <button
                className="h-9 inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                Nouvelle saisie
              </button>
            </DialogTrigger>
            <NewRecordDialog
              employees={employeeOptions}
              empSearch={empSearch}
              setEmpSearch={setEmpSearch}
              employeeId={employeeId}
              setEmployeeId={setEmployeeId}
              selectedEmployee={selectedEmployee}
              hoursCount={hoursCount}
              setHoursCount={setHoursCount}
              date={date}
              setDate={setDate}
              category={category}
              setCategory={setCategory}
              reason={reason}
              setReason={setReason}
              previewMontant={previewMontant}
              loading={loading}
              onSubmit={handleAdd}
              onCancel={() => setIsDialogOpen(false)}
            />
          </Dialog>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Nom, matricule, motif…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-medium whitespace-nowrap">Catégorie</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            >
              <option value="all">Toutes</option>
              <option value="15%">15 %</option>
              <option value="50%">50 %</option>
              <option value="75%">75 %</option>
              <option value="100%">100 %</option>
            </select>
          </div>

          <div className="inline-flex items-center rounded-md border border-slate-200 bg-white p-0.5 max-w-full overflow-x-auto no-scrollbar">
            {(["month", "week", "prevMonth", "all"] as const).map(p => {
              const labels = { month: "Ce mois", week: "Semaine", prevMonth: "Mois -1", all: "Tout" };
              const active = filterPeriod === p;
              return (
                <button
                  key={p}
                  onClick={() => setFilterPeriod(p)}
                  className={[
                    "h-7 px-3 rounded text-xs font-medium tabular-nums whitespace-nowrap transition-colors",
                    active ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>

          {isFiltered && (
            <button
              onClick={() => { setSearch(""); setFilterCategory("all"); setFilterPeriod("month"); }}
              className="text-xs text-slate-500 hover:text-slate-900 underline underline-offset-2 self-start sm:self-auto sm:ml-auto"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </header>

      {/* ── KPI ─────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <KpiCard
          label="Heures totales"
          value={`${kpi.totalHours.toLocaleString("fr-FR")} h`}
          sub={`${filtered.length} saisies`}
          accent="neutral"
        />
        <KpiCard
          label="Coût brut estimé"
          value={fmtCurrency(kpi.totalCost)}
          sub="Inclut les majorations"
          accent="warn"
        />
        <KpiCard
          label="Salariés concernés"
          value={kpi.personnel.toString()}
          sub={`${employees.length} actifs au total`}
          accent="neutral"
        />
        <KpiCard
          label="Ratio de surcharge"
          value={`${kpi.ratio} %`}
          sub="HS / heures théoriques"
          accent={kpi.ratio > 10 ? "negative" : kpi.ratio > 5 ? "warn" : "positive"}
        />
      </section>

      {/* ── Tableau ─────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Journal des heures</h3>
            <p className="text-xs text-slate-500 mt-0.5">{filtered.length} ligne{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}</p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Clock className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">Aucun enregistrement</p>
            <p className="text-xs text-slate-500 mt-1">
              {records.length === 0
                ? "Saisissez votre première heure supplémentaire."
                : "Aucun résultat pour les filtres sélectionnés."}
            </p>
          </div>
        ) : (
          <>
            {/* Vue desktop : tableau */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                  <tr>
                    <th className="text-left px-5 py-3">Date</th>
                    <th className="text-left px-3 py-3">Salarié</th>
                    <th className="text-right px-3 py-3">Heures</th>
                    <th className="text-center px-3 py-3">Majoration</th>
                    <th className="text-left px-3 py-3">Motif</th>
                    <th className="text-right px-3 py-3">Imputation</th>
                    <th className="px-5 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(r => {
                    const emp = employees.find(e => e.id === r.employee_id);
                    const montant = emp ? montantImputation(emp.salaire_brut, r.category, r.hours_count) : 0;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3 text-slate-700 tabular-nums whitespace-nowrap">
                          {format(parseISO(r.date), "dd MMM yyyy", { locale: fr })}
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-slate-900 truncate max-w-[200px]">{r.employee?.full_name}</div>
                          <div className="text-xs text-slate-400 tabular-nums">{r.employee?.matricule}</div>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums font-medium text-slate-900">{r.hours_count} h</td>
                        <td className="px-3 py-3 text-center"><CategoryPill category={r.category} /></td>
                        <td className="px-3 py-3 text-slate-600 truncate max-w-[280px]">{r.reason || <span className="text-slate-400">—</span>}</td>
                        <td className="px-3 py-3 text-right tabular-nums font-semibold text-slate-900 whitespace-nowrap">{fmtCurrency(montant)}</td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50/40 text-sm font-medium border-t border-slate-100">
                  <tr>
                    <td colSpan={2} className="px-5 py-3 text-slate-500 text-xs uppercase tracking-wider">Total</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-900">{kpi.totalHours} h</td>
                    <td colSpan={2}></td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold text-slate-900">{fmtCurrency(kpi.totalCost)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Vue mobile : cards */}
            <ul className="md:hidden divide-y divide-slate-100">
              {filtered.map(r => {
                const emp = employees.find(e => e.id === r.employee_id);
                const montant = emp ? montantImputation(emp.salaire_brut, r.category, r.hours_count) : 0;
                return (
                  <li key={r.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <CategoryPill category={r.category} />
                          <span className="text-xs text-slate-400 tabular-nums">
                            {format(parseISO(r.date), "dd MMM yyyy", { locale: fr })}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-900 truncate">{r.employee?.full_name}</p>
                        <p className="text-xs text-slate-400 tabular-nums">{r.employee?.matricule}</p>
                        {r.reason && <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">{r.reason}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-slate-900 tabular-nums">{r.hours_count} h</p>
                        <p className="text-xs font-medium text-slate-700 tabular-nums mt-0.5">{fmtCurrency(montant)}</p>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="mt-2 p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>

      {/* ── Footer barème légal ─────────────────────────────────────── */}
      <Card>
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Barème légal — Décret n° 96-203</h3>
          <p className="text-xs text-slate-500 mt-0.5">Majorations applicables aux heures supplémentaires (Code du travail ivoirien, Art. 24).</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {(["15%", "50%", "75%", "100%"] as const).map(c => (
            <div key={c} className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <CategoryPill category={c} />
              </div>
              <p className="text-xs text-slate-600 leading-snug">{CATEGORY_HINTS[c]}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Dialog : Nouvelle saisie ────────────────────────────────────────────────

function NewRecordDialog({
  employees, empSearch, setEmpSearch,
  employeeId, setEmployeeId, selectedEmployee,
  hoursCount, setHoursCount, date, setDate,
  category, setCategory, reason, setReason,
  previewMontant, loading, onSubmit, onCancel,
}: {
  employees: Employee[];
  empSearch: string; setEmpSearch: (v: string) => void;
  employeeId: string; setEmployeeId: (v: string) => void;
  selectedEmployee: Employee | undefined;
  hoursCount: string; setHoursCount: (v: string) => void;
  date: string; setDate: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  reason: string; setReason: (v: string) => void;
  previewMontant: number;
  loading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const taux = selectedEmployee ? tauxHoraire(selectedEmployee.salaire_brut) : 0;
  const factor = CATEGORIES[category]?.factor ?? 1;

  return (
    <DialogContent className="sm:max-w-lg p-0 bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden max-h-[92vh] overflow-y-auto">
      <DialogHeader className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-slate-100">
        <DialogTitle className="text-base font-semibold text-slate-900 flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white">
            <Clock className="h-4 w-4" />
          </span>
          Nouvelle heure supplémentaire
        </DialogTitle>
        <p className="text-xs text-slate-500 mt-1.5">Saisie d'une imputation conforme à l'Art. 24 CT-CI.</p>
      </DialogHeader>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Employé */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">Salarié *</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrer par nom ou matricule…"
              value={empSearch}
              onChange={(e) => setEmpSearch(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            />
          </div>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
          >
            <option value="">— Sélectionner —</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.full_name} ({e.matricule})</option>
            ))}
          </select>
        </div>

        {/* Date / Heures */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Heures *</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="24"
              placeholder="0"
              value={hoursCount}
              onChange={(e) => setHoursCount(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 tabular-nums focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            />
          </div>
        </div>

        {/* Catégorie */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">Majoration *</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(["15%", "50%", "75%", "100%"] as const).map(c => {
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={[
                    "h-9 rounded-md text-xs font-medium tabular-nums transition-colors border",
                    active
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {CATEGORIES[c].label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">{CATEGORY_HINTS[category]}</p>
        </div>

        {/* Motif */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">Motif</label>
          <input
            type="text"
            placeholder="Ex : pic d'activité, livraison urgente…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
          />
        </div>

        {/* Aperçu calcul */}
        {selectedEmployee && hoursCount && Number(hoursCount) > 0 && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-3">Simulation du calcul</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Taux horaire de base</span>
                <span className="tabular-nums">{fmtCurrency(taux)} / h</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Coefficient</span>
                <span className="tabular-nums">× {factor.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Heures saisies</span>
                <span className="tabular-nums">× {hoursCount} h</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 mt-2">
                <span className="font-semibold text-slate-900">Imputation brute</span>
                <span className="font-semibold text-slate-900 tabular-nums">{fmtCurrency(previewMontant)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 sm:flex-none h-9 px-4 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          onClick={onSubmit}
          disabled={loading || !employeeId || !hoursCount}
          className="flex-1 h-9 px-4 rounded-md bg-slate-900 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </DialogContent>
  );
}
