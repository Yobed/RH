/**
 * Outils planning retraite Côte d'Ivoire.
 * Âge légal de départ à la retraite : 60 ans (régime général CNPS CI).
 * Source : Art. 28 Loi n°2012-1158 portant régime CNPS.
 */

export const AGE_LEGAL_RETRAITE = 60;

export type RetraiteUrgence = "imminente" | "proche" | "moyen" | "lointain";

export interface RetraiteProjection {
  employee_id: string;
  full_name: string;
  matricule: string | null;
  poste: string | null;
  departement: string | null;
  date_naissance: string;
  date_retraite: string;          // date des 60 ans (YYYY-MM-DD)
  age_actuel: number;             // années (entier)
  jours_avant_retraite: number;
  mois_avant_retraite: number;
  urgence: RetraiteUrgence;
}

export function calculerDateRetraite(dateNaissance: string | null | undefined): Date | null {
  if (!dateNaissance) return null;
  const naissance = new Date(dateNaissance);
  if (Number.isNaN(naissance.getTime())) return null;
  const retraite = new Date(naissance);
  retraite.setFullYear(retraite.getFullYear() + AGE_LEGAL_RETRAITE);
  return retraite;
}

export function calculerAgeActuel(dateNaissance: string | null | undefined): number | null {
  if (!dateNaissance) return null;
  const naissance = new Date(dateNaissance);
  if (Number.isNaN(naissance.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - naissance.getFullYear();
  const m = now.getMonth() - naissance.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < naissance.getDate())) age--;
  return age;
}

function classerUrgence(joursAvant: number): RetraiteUrgence {
  if (joursAvant <= 365) return "imminente";       // < 1 an
  if (joursAvant <= 365 * 2) return "proche";      // < 2 ans
  if (joursAvant <= 365 * 5) return "moyen";       // < 5 ans
  return "lointain";
}

export interface EmployeeForRetraite {
  id: string;
  full_name: string | null;
  matricule: string | null;
  poste: string | null;
  departement: string | null;
  date_naissance: string | null;
  statut: string | null;
}

export function projectionsRetraite(
  employees: ReadonlyArray<EmployeeForRetraite>,
  horizonAnnees: number = 5
): RetraiteProjection[] {
  const now = new Date();
  const horizonMs = horizonAnnees * 365.25 * 24 * 3600 * 1000;

  const projections: RetraiteProjection[] = [];

  for (const emp of employees) {
    if (emp.statut && emp.statut !== "actif") continue;
    if (!emp.date_naissance) continue;
    const dateRet = calculerDateRetraite(emp.date_naissance);
    const age = calculerAgeActuel(emp.date_naissance);
    if (!dateRet || age === null) continue;

    const diffMs = dateRet.getTime() - now.getTime();
    // Ne garde que les retraites à venir (ou < 1 an de retard, pour suivre les retards de gestion)
    if (diffMs < -365 * 24 * 3600 * 1000) continue;
    if (diffMs > horizonMs) continue;

    const joursAvant = Math.round(diffMs / (24 * 3600 * 1000));
    const moisAvant = Math.round(diffMs / (30.44 * 24 * 3600 * 1000));

    projections.push({
      employee_id: emp.id,
      full_name: emp.full_name ?? "Sans nom",
      matricule: emp.matricule,
      poste: emp.poste,
      departement: emp.departement,
      date_naissance: emp.date_naissance,
      date_retraite: dateRet.toISOString().slice(0, 10),
      age_actuel: age,
      jours_avant_retraite: joursAvant,
      mois_avant_retraite: moisAvant,
      urgence: classerUrgence(joursAvant),
    });
  }

  // Trier par date de retraite croissante (le plus proche d'abord)
  projections.sort((a, b) => a.jours_avant_retraite - b.jours_avant_retraite);
  return projections;
}

export const URGENCE_META: Record<RetraiteUrgence, { label: string; color: string; bg: string; border: string }> = {
  imminente: { label: "< 1 an",     color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200" },
  proche:    { label: "1 – 2 ans",  color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  moyen:     { label: "2 – 5 ans",  color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  lointain:  { label: "> 5 ans",    color: "text-slate-700",   bg: "bg-slate-50",   border: "border-slate-200" },
};
