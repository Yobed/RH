"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Download, Save, CheckCircle2, AlertTriangle, Calendar } from "lucide-react";
import {
  calculerSoldeDeCompte,
  calculerITS,
  safeFormatDate,
  type ResultatSoldeDeCompte,
  TAUX_CNPS_RETRAITE_SALARIE,
  CMU_MENSUEL,
  PLAFOND_CNPS_MENSUEL,
  TAUX_ABATTEMENT_ITS,
} from "@/lib/paie-ci";
import { exportPDF, generateSTCPDF, type CompanyInfo } from "@/lib/pdf-templates";
import { toast } from "sonner";
import type { Tables } from "@/types/supabase";

export type EmployeeSTC = Pick<
  Tables<"employees">,
  "id" | "full_name" | "matricule" | "salaire_brut" | "type_contrat" | "date_embauche"
> & {
  poste?: string | null;
  categorie?: string | null;
  departement?: string | null;
};

const MOTIFS_RUPTURE: { value: string; label: string }[] = [
  { value: "", label: "— Sélectionner le motif —" },
  { value: "licenciement_faute_simple", label: "Licenciement pour faute simple" },
  { value: "licenciement_faute_lourde", label: "Licenciement pour faute lourde" },
  { value: "licenciement_economique", label: "Licenciement économique" },
  { value: "demission", label: "Démission" },
  { value: "fin_cdd", label: "Fin de CDD (terme échu)" },
  { value: "rupture_conventionnelle", label: "Rupture conventionnelle" },
  { value: "retraite", label: "Départ volontaire à la retraite" },
  { value: "mise_a_la_retraite", label: "Mise à la retraite par l'employeur" },
  { value: "deces", label: "Décès du salarié" },
  { value: "force_majeure", label: "Force majeure" },
];

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
  const [motifRupture, setMotifRupture] = useState<string>("");
  const [dateFin, setDateFin] = useState<string>("");

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
    if (isCdd) setMotifRupture("fin_cdd");
    setArchived(false);
  }, [selectedEmployee, isCdd]);

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

  // ── Retenues STC ─────────────────────────────────────────────────────────
  // Seules l'ICCP, l'indemnité de préavis et la précarité CDD sont soumises
  // aux cotisations. L'indemnité de licenciement légale est exonérée (CGI-CI).
  const baseImposableStc = resultat
    ? resultat.indemnite_compensatrice_conges
      + resultat.indemnite_preavis
      + (isCdd ? resultat.indemnite_precarite : 0)
    : 0;
  const cnpsStc = resultat
    ? Math.round(Math.min(baseImposableStc, PLAFOND_CNPS_MENSUEL) * TAUX_CNPS_RETRAITE_SALARIE)
    : 0;
  const cmuStc = resultat ? CMU_MENSUEL : 0;
  const baseItsStc = resultat
    ? Math.max(0, (baseImposableStc - cnpsStc) * (1 - TAUX_ABATTEMENT_ITS))
    : 0;
  const itsStc = resultat ? calculerITS(baseItsStc) : 0;
  const netStc = resultat ? resultat.total_brut_stc - cnpsStc - cmuStc - itsStc : 0;

  const today = new Date().toLocaleDateString("fr-CI", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  return (
    <div className="space-y-8">
    <section className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">
      {/* ── Colonne formulaire (3/5) ──────────────────────────── */}
      <div className="lg:col-span-3 space-y-4 sm:space-y-5">
        {/* Sélection salarié */}
        <Card>
          <CardTitle sub="Recherche par nom ou matricule">Salarié concerné</CardTitle>
          <div className="p-4 sm:p-5 space-y-3">

            {employees.length === 0 ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold">Aucun salarié actif trouvé.</p>
                <p className="mt-1 text-xs text-amber-700">
                  Ajoutez d'abord des salariés dans l'onglet{" "}
                  <a href="/employes" className="underline font-medium">Employés</a>{" "}
                  pour pouvoir calculer un Solde de Tout Compte.
                </p>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Rechercher parmi ${employees.length} salarié(s)…`}
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                  />
                </div>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  size={Math.min(filteredEmployees.length + 1, 6)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                >
                  <option value="">— Sélectionner un salarié —</option>
                  {filteredEmployees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.full_name}{e.matricule ? ` (${e.matricule})` : ""} · {e.type_contrat || "CDI"}
                    </option>
                  ))}
                </select>
                {filteredEmployees.length === 0 && employeeSearch && (
                  <p className="text-xs text-slate-400 text-center">
                    Aucun résultat pour «&nbsp;{employeeSearch}&nbsp;»
                  </p>
                )}
              </>
            )}

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

        {/* Motif de rupture + date de fin */}
        <Card>
          <CardTitle sub="Obligatoire pour le bulletin légal">Motif et date de rupture</CardTitle>
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 block">Motif de rupture</label>
              <select
                value={motifRupture}
                onChange={(e) => setMotifRupture(e.target.value)}
                disabled={!selectedEmployee}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {MOTIFS_RUPTURE.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 block">Date de fin de contrat</label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                disabled={!selectedEmployee}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
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

    {/* ── Prévisualisation bulletin complet ───────────────────── */}
    {selectedEmployee && resultat && (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-800">Prévisualisation du bulletin</h3>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">
            Document non officiel
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">

          {/* ① En-tête */}
          <div className="bg-slate-900 text-white px-6 py-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold mb-1">
                République de Côte d&apos;Ivoire — Code du Travail
              </p>
              <h2 className="text-lg font-black tracking-tight">BULLETIN DE SOLDE DE TOUT COMPTE</h2>
              <p className="text-xs text-slate-400 mt-1">
                {MOTIFS_RUPTURE.find(m => m.value === motifRupture)?.label || "Motif non renseigné"}
                {" — "}
                {isCdd ? "Contrat à Durée Déterminée" : "Contrat à Durée Indéterminée"}
              </p>
            </div>
            <div className="text-right shrink-0 space-y-1">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Établi le</p>
                <p className="text-sm font-semibold tabular-nums">{today}</p>
              </div>
              {dateFin && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Fin de contrat</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {new Date(dateFin).toLocaleDateString("fr-CI", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ② Identification salarié */}
          <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/50">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-3">
              I — Identification du salarié
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
              {[
                { label: "Nom & Prénom", value: selectedEmployee.full_name },
                { label: "Matricule", value: selectedEmployee.matricule ?? "—" },
                { label: "Poste occupé", value: selectedEmployee.poste ?? "—" },
                { label: "Catégorie / Échelon", value: selectedEmployee.categorie ?? "—" },
                { label: "Département", value: selectedEmployee.departement ?? "—" },
                { label: "Type de contrat", value: isCdd ? "CDD" : "CDI" },
                { label: "Date d'embauche", value: safeFormatDate(selectedEmployee.date_embauche) },
                { label: "Date de fin", value: dateFin ? new Date(dateFin).toLocaleDateString("fr-CI", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—" },
                { label: "Ancienneté", value: `${Number(anciennete).toFixed(2)} an(s)` },
                { label: "Salaire brut de base", value: fmt(selectedEmployee.salaire_brut ?? 0) },
                { label: "Salaire moyen (12 mois)", value: fmt(Number(salaireMoyen)) },
                { label: "Préavis non effectué", value: `${joursPreavis} jour(s)` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-800 tabular-nums">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ③ Indemnités */}
          <div className="px-6 py-5 border-b border-slate-100">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-3">
              II — Décompte des indemnités légales
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-800 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="text-left pb-2 font-semibold w-[40%]">Désignation</th>
                  <th className="text-left pb-2 font-semibold">Référence légale</th>
                  <th className="text-center pb-2 font-semibold">Détail du calcul</th>
                  <th className="text-center pb-2 font-semibold">Régime fiscal</th>
                  <th className="text-right pb-2 font-semibold">Montant (FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isCdd ? (
                  <BulletinRow
                    label="Indemnité de précarité"
                    ref_legale="Art. 26 CT-CI"
                    calcul={`${fmt(Number(sommeBrutsCdd))} × 3%`}
                    regime="Imposable"
                    montant={resultat.indemnite_precarite}
                  />
                ) : (
                  <BulletinRow
                    label="Indemnité de licenciement"
                    ref_legale="Art. 74 CT-CI"
                    calcul={`${Number(anciennete).toFixed(2)} ans (30%/35%/40%)`}
                    regime="Exonérée"
                    montant={resultat.indemnite_licenciement}
                    exonere
                  />
                )}
                <BulletinRow
                  label="Indemnité compensatrice de congés payés (ICCP)"
                  ref_legale="Art. 25 CT-CI"
                  calcul={`${joursConges} j × ${fmt(selectedEmployee.salaire_brut ?? 0)} ÷ 26`}
                  regime="Imposable"
                  montant={resultat.indemnite_compensatrice_conges}
                />
                <BulletinRow
                  label="Indemnité compensatrice de préavis"
                  ref_legale="Art. 20 CT-CI"
                  calcul={`${joursPreavis} j × ${fmt(selectedEmployee.salaire_brut ?? 0)} ÷ 26`}
                  regime="Imposable"
                  montant={resultat.indemnite_preavis}
                />
              </tbody>
            </table>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-baseline justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">Total brut STC</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Avant retenues sociales et fiscales</p>
              </div>
              <p className="text-xl font-black text-slate-900 tabular-nums">{fmt(resultat.total_brut_stc)}</p>
            </div>
          </div>

          {/* ④ Retenues sociales et fiscales */}
          <div className="px-6 py-5 border-b border-slate-100">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-3">
              III — Retenues sociales et fiscales
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="text-left pb-2 font-semibold">Désignation</th>
                  <th className="text-left pb-2 font-semibold">Base</th>
                  <th className="text-center pb-2 font-semibold">Taux</th>
                  <th className="text-right pb-2 font-semibold">Montant (FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                <tr>
                  <td className="py-2.5 pr-4">
                    <p className="font-medium text-slate-800">Base imposable STC</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {isCdd ? "Précarité + ICCP + Préavis" : "ICCP + Préavis (licenciement exonéré)"}
                    </p>
                  </td>
                  <td className="py-2.5 text-slate-600 tabular-nums">{fmt(baseImposableStc)}</td>
                  <td className="py-2.5 text-center text-slate-400">—</td>
                  <td className="py-2.5 text-right font-semibold text-slate-800 tabular-nums">{fmt(baseImposableStc)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4">
                    <p className="font-medium text-slate-800">CNPS Retraite salarié</p>
                    <p className="text-[10px] text-slate-400">Plafond : {fmt(PLAFOND_CNPS_MENSUEL)}</p>
                  </td>
                  <td className="py-2.5 text-slate-600 tabular-nums">{fmt(Math.min(baseImposableStc, PLAFOND_CNPS_MENSUEL))}</td>
                  <td className="py-2.5 text-center text-slate-500">{(TAUX_CNPS_RETRAITE_SALARIE * 100).toFixed(1)} %</td>
                  <td className="py-2.5 text-right font-semibold text-red-600 tabular-nums">− {fmt(cnpsStc)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4">
                    <p className="font-medium text-slate-800">CMU (Couverture Maladie Universelle)</p>
                  </td>
                  <td className="py-2.5 text-slate-600">Forfait mensuel</td>
                  <td className="py-2.5 text-center text-slate-500">—</td>
                  <td className="py-2.5 text-right font-semibold text-red-600 tabular-nums">− {fmt(cmuStc)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4">
                    <p className="font-medium text-slate-800">ITS (Impôt sur Traitements et Salaires)</p>
                    <p className="text-[10px] text-slate-400">
                      Base ITS = {fmt(baseImposableStc - cnpsStc)} × {((1 - TAUX_ABATTEMENT_ITS) * 100).toFixed(0)} % = {fmt(baseItsStc)}
                    </p>
                  </td>
                  <td className="py-2.5 text-slate-600 tabular-nums">{fmt(baseItsStc)}</td>
                  <td className="py-2.5 text-center text-slate-500">Barème</td>
                  <td className="py-2.5 text-right font-semibold text-red-600 tabular-nums">− {fmt(itsStc)}</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-baseline justify-between">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Total retenues</p>
              <p className="text-base font-bold text-red-600 tabular-nums">− {fmt(cnpsStc + cmuStc + itsStc)}</p>
            </div>
          </div>

          {/* ⑤ Net à payer */}
          <div className="px-6 py-5 bg-emerald-50/50 border-b border-emerald-100">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">NET STC À PAYER</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">Après retenues CNPS, CMU et ITS</p>
              </div>
              <p className="text-3xl font-black text-emerald-800 tabular-nums">{fmt(netStc)}</p>
            </div>
          </div>

          {/* ⑥ Mention légale reçu STC */}
          <div className="px-6 py-5 border-b border-slate-100 space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              IV — Reçu pour solde de tout compte — Art. 16.11 CT-CI
            </p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-relaxed text-slate-700 italic">
              Je soussigné(e), <span className="font-semibold not-italic">{selectedEmployee.full_name}</span>,
              reconnais avoir reçu de mon employeur la somme de{" "}
              <span className="font-semibold not-italic">{fmt(netStc)}</span>{" "}
              ({fmt(netStc).replace(/\s*XOF.*/, "").trim()} francs CFA) en règlement intégral de toutes sommes dues
              à titre de solde de tout compte suite à la cessation de mon contrat de travail
              {motifRupture ? ` pour motif : ${MOTIFS_RUPTURE.find(m => m.value === motifRupture)?.label?.toLowerCase()}` : ""}.
            </div>
            <div className="rounded-md border border-amber-200 bg-amber-50/60 px-4 py-2.5 text-[11px] text-amber-800 leading-relaxed">
              <span className="font-semibold">Délai de contestation :</span> Conformément à l&apos;article 16.11 du Code du Travail
              ivoirien, le présent reçu pour solde de tout compte peut être dénoncé dans un délai de{" "}
              <span className="font-semibold">6 mois</span> à compter de sa date de signature.
              Passé ce délai, il devient libératoire pour l&apos;employeur.
            </div>
          </div>

          {/* ⑦ Zone signatures */}
          <div className="px-6 py-6 bg-white">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-5">
              V — Signatures — Fait à ______________, le {today}
            </p>
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">L&apos;Employeur</p>
                  <p className="text-[10px] text-slate-400">Nom, qualité, cachet et signature</p>
                </div>
                <div className="border-b-2 border-slate-300" />
              </div>
              <div className="space-y-8">
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">
                    Le Salarié — <span className="font-normal italic">{selectedEmployee.full_name}</span>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Mention manuscrite obligatoire :{" "}
                    <span className="italic">&laquo; Reçu pour solde de tout compte &raquo;</span>
                  </p>
                </div>
                <div className="border-b-2 border-slate-300" />
              </div>
            </div>
          </div>

        </div>
      </div>
    )}
    </div>
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

function BulletinRow({
  label, ref_legale, calcul, regime, montant, exonere = false,
}: {
  label: string;
  ref_legale?: string;
  calcul?: string;
  regime?: string;
  montant: number;
  exonere?: boolean;
}) {
  return (
    <tr>
      <td className="py-3 pr-4">
        <p className="text-sm font-medium text-slate-800">{label}</p>
      </td>
      <td className="py-3 px-2 text-xs text-indigo-600 font-medium whitespace-nowrap">{ref_legale}</td>
      <td className="py-3 px-2 text-center text-xs text-slate-500 whitespace-nowrap">{calcul}</td>
      <td className="py-3 px-2 text-center">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
          exonere
            ? "bg-emerald-100 text-emerald-700"
            : "bg-amber-100 text-amber-700"
        }`}>
          {regime}
        </span>
      </td>
      <td className="py-3 pl-4 text-right text-sm font-semibold text-slate-900 tabular-nums whitespace-nowrap">
        {montant > 0
          ? fmt(montant)
          : <span className="text-slate-400 font-normal">—</span>}
      </td>
    </tr>
  );
}
