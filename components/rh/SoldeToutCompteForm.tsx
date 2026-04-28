"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Download, Save, CheckCircle2, AlertTriangle, Calendar } from "lucide-react";
import { calculerSoldeDeCompte, safeFormatDate, type ResultatSoldeDeCompte } from "@/lib/paie-ci";
import { exportPDF, generateSTCPDF, type CompanyInfo } from "@/lib/pdf-templates";
import { toast } from "sonner";
import type { Tables } from "@/types/supabase";

export type EmployeeSTC = Pick<
  Tables<"employees">,
  "id" | "full_name" | "matricule" | "salaire_brut" | "type_contrat" | "date_embauche"
>;

interface Props {
  employees: EmployeeSTC[];
  company?: CompanyInfo | null;
  defaultEmployeeId?: string;
}

const fmt = (n: number): string =>
  new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n || 0));

function computeSeniorityYears(dateEmbauche: string | null | undefined): string {
  if (!dateEmbauche) return "0";
  const debut = new Date(dateEmbauche);
  if (isNaN(debut.getTime())) return "0";
  const diffMs = Date.now() - debut.getTime();
  const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  return years > 0 ? years.toFixed(2) : "0";
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  return fallback;
}

export function SoldeToutCompteForm({ employees, company, defaultEmployeeId }: Props) {
  const [employeeId, setEmployeeId] = useState<string>(defaultEmployeeId ?? "");
  const [employeeSearch, setEmployeeSearch] = useState("");

  const [salaireMoyen, setSalaireMoyen] = useState<string>("");
  const [anciennete, setAnciennete] = useState<string>("");
  const [sommeBrutsCdd, setSommeBrutsCdd] = useState<string>("0");
  const [joursConges, setJoursConges] = useState<string>("0");
  const [joursPreavis, setJoursPreavis] = useState<string>("0");

  const [archiving, setArchiving] = useState(false);
  const [archived, setArchived] = useState(false);
  const [exporting, setExporting] = useState(false);

  const filteredEmployees = useMemo<EmployeeSTC[]>(() => {
    const q = employeeSearch.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter(e => {
      const name = (e.full_name || "").toLowerCase();
      const mat = (e.matricule || "").toLowerCase();
      return name.includes(q) || mat.includes(q);
    });
  }, [employees, employeeSearch]);

  const selectedEmployee = useMemo<EmployeeSTC | undefined>(
    () => employees.find(e => e.id === employeeId),
    [employees, employeeId]
  );

  const isCdd = (selectedEmployee?.type_contrat || "CDI").toUpperCase() === "CDD";

  // Pré-remplissage automatique quand un employé est sélectionné
  useEffect(() => {
    if (!selectedEmployee) return;
    setSalaireMoyen(String(selectedEmployee.salaire_brut ?? 0));
    setAnciennete(computeSeniorityYears(selectedEmployee.date_embauche));
    setArchived(false);
  }, [selectedEmployee]);

  const resultat = useMemo<ResultatSoldeDeCompte | null>(() => {
    if (!selectedEmployee) return null;
    const sm = Number(salaireMoyen) || 0;
    const anc = Number(anciennete) || 0;
    const ssbCdd = Number(sommeBrutsCdd) || 0;
    const conges = Number(joursConges) || 0;
    const preavis = Number(joursPreavis) || 0;
    const saa = Number(selectedEmployee.salaire_brut) || sm;
    return calculerSoldeDeCompte({
      type_contrat: isCdd ? "CDD" : "CDI",
      salaire_moyen_12_mois: sm,
      somme_salaires_bruts_cdd: ssbCdd,
      anciennete_annees: anc,
      jours_conges_restants: conges,
      jours_preavis_non_effectues: preavis,
      salaire_mensuel_actuel: saa,
    });
  }, [selectedEmployee, isCdd, salaireMoyen, anciennete, sommeBrutsCdd, joursConges, joursPreavis]);

  function handleExportPdf(): void {
    if (!selectedEmployee || !resultat) {
      toast.error("Sélectionnez un salarié et complétez les paramètres.");
      return;
    }
    setExporting(true);
    try {
      const doc = generateSTCPDF({
        employee: selectedEmployee,
        stcResult: resultat,
        company: company || { name: "ENTREPRISE", id: "temp" },
        params: {
          salaire_moyen_12_mois: salaireMoyen,
          anciennete_annees: anciennete,
          somme_salaires_bruts_cdd: sommeBrutsCdd,
          jours_conges_restants: joursConges,
          jours_preavis_non_effectues: joursPreavis,
        },
      });
      const filename = `STC_${(selectedEmployee.full_name || "Export").replace(/ /g, "_")}_${new Date().getFullYear()}`;
      exportPDF(doc, filename);
      toast.success("PDF généré.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Erreur lors de la génération du PDF."));
    } finally {
      setExporting(false);
    }
  }

  async function handleArchive(): Promise<void> {
    if (!selectedEmployee || !resultat) {
      toast.error("Sélectionnez un salarié et complétez les paramètres.");
      return;
    }
    const toastId = toast.loading("Archivage en cours…");
    setArchiving(true);
    try {
      const response = await fetch("/api/stc/archiver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: selectedEmployee.id,
          resultat,
          parametres: {
            salaire_moyen_12_mois: salaireMoyen,
            anciennete_annees: anciennete,
            somme_salaires_bruts_cdd: sommeBrutsCdd,
            jours_conges_restants: joursConges,
            jours_preavis_non_effectues: joursPreavis,
          },
        }),
      });
      const data: { error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur lors de l'archivage.");
      setArchived(true);
      toast.success("STC archivé dans le dossier du personnel.", { id: toastId });
    } catch (err) {
      toast.error(getErrorMessage(err, "Erreur lors de l'archivage."), { id: toastId });
    } finally {
      setArchiving(false);
    }
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">
      {/* ── Colonne formulaire (3/5) ──────────────────────────── */}
      <div className="lg:col-span-3 space-y-4 sm:space-y-5">
        {/* Sélection salarié */}
        <Card>
          <CardTitle sub="Recherche par nom ou matricule">Salarié concerné</CardTitle>
          <div className="p-4 sm:p-5 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un collaborateur…"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
              />
            </div>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            >
              <option value="">— Sélectionner —</option>
              {filteredEmployees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.full_name} ({e.matricule}) · {e.type_contrat || "CDI"}
                </option>
              ))}
            </select>

            {selectedEmployee && (
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Matricule</p>
                  <p className="mt-0.5 text-slate-900 font-medium tabular-nums">{selectedEmployee.matricule}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Contrat</p>
                  <p className="mt-0.5 text-slate-900 font-medium">{selectedEmployee.type_contrat || "CDI"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Embauche</p>
                  <p className="mt-0.5 text-slate-900 font-medium tabular-nums" suppressHydrationWarning>
                    {safeFormatDate(selectedEmployee.date_embauche)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Salaire</p>
                  <p className="mt-0.5 text-slate-900 font-medium tabular-nums">{fmt(selectedEmployee.salaire_brut || 0)}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Paramètres financiers */}
        <Card>
          <CardTitle sub="Bases de calcul des indemnités légales">Paramètres financiers</CardTitle>
          <div className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NumericField
                label="Salaire moyen (12 mois)"
                hint="Base légale pour licenciement et préavis"
                value={salaireMoyen}
                onChange={setSalaireMoyen}
                step={1000}
                suffix="FCFA"
                disabled={!selectedEmployee}
              />
              <NumericField
                label="Ancienneté"
                hint="Calculée depuis la date d'embauche"
                value={anciennete}
                onChange={setAnciennete}
                step={0.01}
                suffix="ans"
                disabled={!selectedEmployee}
              />
            </div>

            {isCdd && (
              <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3">
                <NumericField
                  label="Masse salariale du CDD"
                  hint="Total des salaires bruts perçus — base de la prime de précarité (3 %)"
                  value={sommeBrutsCdd}
                  onChange={setSommeBrutsCdd}
                  step={1000}
                  suffix="FCFA"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NumericField
                label="Jours de congés restants"
                hint="Indemnité compensatrice (ICCP)"
                value={joursConges}
                onChange={setJoursConges}
                step={0.5}
                suffix="jours"
                disabled={!selectedEmployee}
              />
              <NumericField
                label="Préavis non effectué"
                hint="Indemnité compensatrice de préavis"
                value={joursPreavis}
                onChange={setJoursPreavis}
                step={1}
                suffix="jours"
                disabled={!selectedEmployee}
              />
            </div>
          </div>
        </Card>

        {/* Avertissement legal */}
        <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3.5 flex gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed">
            <span className="font-semibold">Brut indicatif.</span> Les retenues fiscales et sociales (CNPS, CN, IGR) seront déduites
            sur le bulletin de solde final selon les barèmes en vigueur.
          </p>
        </div>
      </div>

      {/* ── Colonne résultat (2/5) ────────────────────────────── */}
      <aside className="lg:col-span-2">
        <div className="lg:sticky lg:top-4">
          <Card className="overflow-hidden">
            <CardTitle
              sub={
                selectedEmployee
                  ? `${selectedEmployee.full_name} · ${isCdd ? "CDD" : "CDI"}`
                  : "Sélectionnez un salarié pour voir le calcul"
              }
            >
              Solde de tout compte
            </CardTitle>

            {!selectedEmployee || !resultat ? (
              <div className="px-5 py-12 text-center">
                <Calendar className="h-7 w-7 text-slate-300 mx-auto mb-2.5" />
                <p className="text-sm font-medium text-slate-700">En attente de saisie</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Choisissez un salarié et renseignez les paramètres pour générer le solde.
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 sm:p-5 space-y-2.5 text-sm">
                  {isCdd ? (
                    <Line
                      label="Indemnité de précarité"
                      hint="3 % de la masse salariale CDD"
                      value={fmt(resultat.indemnite_precarite)}
                    />
                  ) : (
                    <Line
                      label="Indemnité de licenciement"
                      hint="Selon ancienneté et salaire moyen"
                      value={fmt(resultat.indemnite_licenciement)}
                    />
                  )}
                  <Line
                    label="Indemnité de congés (ICCP)"
                    hint="Salaire / 26 × jours restants"
                    value={fmt(resultat.indemnite_compensatrice_conges)}
                  />
                  <Line
                    label="Indemnité de préavis"
                    hint="Salaire / 26 × jours non effectués"
                    value={fmt(resultat.indemnite_preavis)}
                  />
                </div>

                <div className="border-t border-slate-100 px-4 sm:px-5 py-4 bg-slate-900 text-white flex items-baseline justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-medium">Total brut STC</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Avant retenues fiscales et sociales</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight">
                    {fmt(resultat.total_brut_stc)}
                  </p>
                </div>

                <div className="px-4 sm:px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleExportPdf}
                    disabled={exporting || !resultat}
                    className="flex-1 h-9 inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {exporting ? "Export…" : "Exporter PDF"}
                  </button>
                  <button
                    onClick={handleArchive}
                    disabled={archiving || archived || !resultat}
                    className={[
                      "flex-1 h-9 inline-flex items-center justify-center gap-2 rounded-md px-3 text-sm font-medium",
                      archived
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50",
                    ].join(" ")}
                  >
                    {archived ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Archivé
                      </>
                    ) : archiving ? (
                      "Archivage…"
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        Archiver
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </Card>
        </div>
      </aside>
    </section>
  );
}

// ── UI primitives ──────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-slate-200 bg-white ${className}`}>{children}</div>;
}

function CardTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-start justify-between gap-2 sm:gap-3 px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-slate-100">
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-slate-900">{children}</h3>
        {sub && <p className="text-xs text-slate-500 mt-0.5 leading-snug">{sub}</p>}
      </div>
    </div>
  );
}

interface NumericFieldProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  step?: number;
  suffix?: string;
  disabled?: boolean;
}

function NumericField({ label, hint, value, onChange, step, suffix, disabled }: NumericFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-700 block">{label}</label>
      <div className="relative">
        <input
          type="number"
          step={step}
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-9 w-full rounded-md border border-slate-200 bg-white pl-3 pr-14 text-sm text-slate-900 tabular-nums focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider text-slate-400 font-medium">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-[10px] text-slate-500 leading-snug">{hint}</p>}
    </div>
  );
}

function Line({ label, hint, value }: { label: string; hint?: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-slate-700">{label}</p>
        {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <p className="text-sm font-semibold text-slate-900 tabular-nums shrink-0">{value}</p>
    </div>
  );
}
