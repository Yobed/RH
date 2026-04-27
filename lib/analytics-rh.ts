/**
 * Source unique de vérité pour les KPI RH.
 * Toutes les vues analytiques (Analytique, Focus) consomment ces fonctions
 * pour garantir des chiffres rigoureusement identiques.
 */
import { differenceInYears, format, parseISO, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

// ── Types ──────────────────────────────────────────────────────────────────
export interface RhEmployee {
  id: string;
  full_name: string;
  date_embauche: string;
  date_naissance: string | null;
  genre: string | null;
  statut: string | null;
  departement?: string | null;
  categorie?: string | null;
}

export interface RhBulletin {
  id: string;
  employee_id: string;
  periode: string;
  salaire_brut: number;
  salaire_net: number;
  its: number;
  cnps_salarie: number;
  prime_transport?: number | null;
  sursalaire?: number | null;
  total_contributions?: number | null;
  net_to_pay?: number | null;
  tax_cn?: number | null;
  tax_igr?: number | null;
  withholding_cnps?: number | null;
  details?: {
    heures_sup?: { h15?: number; h50?: number; h75?: number };
    nb_jours_absence?: number;
  } | null;
}

export interface RhContract {
  employee_id: string;
  date_debut: string;
  date_fin: string | null;
  statut: string | null;
}

export interface RhConge {
  employee_id: string;
  date_debut: string;
  date_fin: string;
  nb_jours: number;
  statut: string | null;
  type: string;
}

export interface RhMedical {
  id: string;
  employee_id: string;
  resultat: string;
  prochaine_visite: string | null;
}

export interface RhJob {
  id: string;
  titre: string;
  created_at: string;
  statut: string;
  date_limite: string | null;
}

export interface RhCandidate {
  id: string;
  job_id: string;
  created_at: string;
  statut: string;
  score_ia: number | null;
}

export interface RhEvaluation {
  id: string;
  employee_id: string;
  score_global: number | null;
  potential_score: number | null;
  date_realisation: string | null;
  type: string;
  statut: string;
}

export interface RhAccident {
  id: string;
  employee_id: string;
  date_accident: string;
  jours_arret: number | null;
  gravite: string | null;
}

export interface RhDataset {
  employees: RhEmployee[];
  bulletins: RhBulletin[];
  contracts: RhContract[];
  conges: RhConge[];
  medical: RhMedical[];
  jobPostings: RhJob[];
  candidates: RhCandidate[];
  evaluations: RhEvaluation[];
  accidents: RhAccident[];
}

export interface RhFilters {
  departement?: string; // "Tous" / nom
  categorie?: string;
  statut?: string;      // "actif" / "inactif" / "Tous"
  annee?: number | null; // null/undefined = toutes années
  mois?: number | null;  // 1-12 ; null/undefined = tous mois
}

/**
 * Date de référence dérivée des filtres temporels.
 * - annee + mois : dernier jour du mois choisi (ou aujourd'hui si futur)
 * - annee seule : 31 déc de cette année (ou aujourd'hui si année courante / futur)
 * - rien : aujourd'hui
 */
export function getReferenceDate(annee?: number | null, mois?: number | null): Date {
  const today = new Date();
  if (!annee) return today;
  if (mois && mois >= 1 && mois <= 12) {
    const lastDay = new Date(annee, mois, 0); // jour 0 du mois suivant = dernier jour
    return lastDay > today ? today : lastDay;
  }
  const dec31 = new Date(annee, 11, 31);
  return dec31 > today ? today : dec31;
}

/** Liste des années présentes dans le dataset (depuis date_embauche, periode des bulletins, accidents, conges) */
export function listYears(d: RhDataset): number[] {
  const years = new Set<number>();
  for (const e of d.employees) {
    if (e.date_embauche) years.add(new Date(e.date_embauche).getFullYear());
  }
  for (const b of d.bulletins) {
    if (b.periode && b.periode.length >= 4) years.add(parseInt(b.periode.substring(0, 4), 10));
  }
  for (const c of d.contracts) {
    if (c.date_debut) years.add(new Date(c.date_debut).getFullYear());
    if (c.date_fin) years.add(new Date(c.date_fin).getFullYear());
  }
  for (const c of d.conges) {
    if (c.date_debut) years.add(new Date(c.date_debut).getFullYear());
  }
  for (const a of d.accidents) {
    if (a.date_accident) years.add(new Date(a.date_accident).getFullYear());
  }
  years.add(new Date().getFullYear());
  return Array.from(years).filter(y => !isNaN(y) && y > 1990 && y < 2100).sort((a, b) => b - a);
}

export const MONTH_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

// ── Utils ──────────────────────────────────────────────────────────────────
const ABSENTEEISM_TYPES = new Set([
  "maladie", "absence", "sans_solde", "mise_a_pied", "absence_non_payee",
]);

export const COUT_PATRONAL_RATE = 0.21; // CNPS + CMU + AT/MP + FDFP + Apprentissage approx CI
export const HEURES_MENSUELLES = 173.33;

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const fmtNumber = (n: number, digits = 0) =>
  new Intl.NumberFormat("fr-CI", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);

export const FMT = { currency: fmtCurrency, number: fmtNumber };

// ── Application des filtres ────────────────────────────────────────────────
function isInPeriod(dateStr: string | null | undefined, annee?: number | null, mois?: number | null): boolean {
  if (!annee) return true;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  if (d.getFullYear() !== annee) return false;
  if (mois && (d.getMonth() + 1) !== mois) return false;
  return true;
}

function bulletinInPeriod(periode: string, annee?: number | null, mois?: number | null): boolean {
  if (!annee) return true;
  if (!periode || periode.length < 7) return false;
  const y = parseInt(periode.substring(0, 4), 10);
  const m = parseInt(periode.substring(5, 7), 10);
  if (y !== annee) return false;
  if (mois && m !== mois) return false;
  return true;
}

export function applyFilters(dataset: RhDataset, filters: RhFilters): RhDataset {
  const employees = dataset.employees.filter(e => {
    const matchDept = !filters.departement || filters.departement === "Tous" ||
      (e.departement || "Non défini") === filters.departement;
    const matchCat = !filters.categorie || filters.categorie === "Tous" ||
      (e.categorie || "Non définie") === filters.categorie;
    return matchDept && matchCat;
  });

  const employeeIds = new Set(employees.map(e => e.id));
  const { annee, mois } = filters;

  return {
    employees,
    bulletins: dataset.bulletins.filter(b =>
      employeeIds.has(b.employee_id) && bulletinInPeriod(b.periode, annee, mois)
    ),
    contracts: dataset.contracts.filter(c => employeeIds.has(c.employee_id)),
    conges: dataset.conges.filter(c =>
      employeeIds.has(c.employee_id) && isInPeriod(c.date_debut, annee, mois)
    ),
    medical: dataset.medical.filter(m => employeeIds.has(m.employee_id)),
    jobPostings: !annee
      ? dataset.jobPostings
      : dataset.jobPostings.filter(j => isInPeriod(j.created_at, annee, mois)),
    candidates: !annee
      ? dataset.candidates
      : dataset.candidates.filter(c => isInPeriod(c.created_at, annee, mois)),
    evaluations: dataset.evaluations.filter(ev =>
      employeeIds.has(ev.employee_id) &&
      (!annee || isInPeriod(ev.date_realisation, annee, mois))
    ),
    accidents: dataset.accidents.filter(a =>
      employeeIds.has(a.employee_id) && isInPeriod(a.date_accident, annee, mois)
    ),
  };
}

// ── KPI Effectif ───────────────────────────────────────────────────────────
export interface EffectifKpi {
  total: number;
  actifs: number;
  inactifs: number;
  suspendus: number;
  hommes: number;
  femmes: number;
  parityRate: number; // % femmes
  entriesYear: number;
  departuresYear: number;
  byDepartment: { name: string; count: number }[];
  byCategory: { name: string; count: number }[];
}

export function computeEffectif(d: RhDataset, ref: Date = new Date()): EffectifKpi {
  const year = ref.getFullYear();
  const actifs = d.employees.filter(e => e.statut === "actif");
  const total = d.employees.length;
  const hommes = actifs.filter(e => e.genre?.toUpperCase() === "M").length;
  const femmes = actifs.filter(e => e.genre?.toUpperCase() === "F").length;

  const entriesYear = d.employees.filter(e => new Date(e.date_embauche).getFullYear() === year).length;

  const departuresYear = d.employees.filter(e => {
    if (e.statut !== "inactif") return false;
    const empContracts = d.contracts.filter(c => c.employee_id === e.id && c.date_fin);
    if (empContracts.length === 0) return false;
    const sorted = [...empContracts].sort((a, b) =>
      new Date(b.date_fin!).getTime() - new Date(a.date_fin!).getTime()
    );
    return sorted[0].date_fin && new Date(sorted[0].date_fin!).getFullYear() === year;
  }).length;

  const deptMap = new Map<string, number>();
  const catMap = new Map<string, number>();
  for (const e of actifs) {
    const dept = e.departement || "Non défini";
    const cat = e.categorie || "Non définie";
    deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
    catMap.set(cat, (catMap.get(cat) || 0) + 1);
  }

  return {
    total,
    actifs: actifs.length,
    inactifs: d.employees.filter(e => e.statut === "inactif").length,
    suspendus: d.employees.filter(e => e.statut === "suspendu").length,
    hommes,
    femmes,
    parityRate: actifs.length === 0 ? 0 : Math.round((femmes / actifs.length) * 1000) / 10,
    entriesYear,
    departuresYear,
    byDepartment: Array.from(deptMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    byCategory: Array.from(catMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
  };
}

// ── Pyramide des âges ──────────────────────────────────────────────────────
export interface AgePyramidBin {
  range: string;
  Hommes: number;
  Femmes: number;
}

export function computeAgePyramid(d: RhDataset, ref: Date = new Date()): { pyramid: AgePyramidBin[]; averageAge: number } {
  const bins: AgePyramidBin[] = [
    { range: "18–25", Hommes: 0, Femmes: 0 },
    { range: "26–35", Hommes: 0, Femmes: 0 },
    { range: "36–45", Hommes: 0, Femmes: 0 },
    { range: "46–55", Hommes: 0, Femmes: 0 },
    { range: "56+", Hommes: 0, Femmes: 0 },
  ];
  const ranges = [[18, 25], [26, 35], [36, 45], [46, 55], [56, 100]];

  let totalAge = 0;
  let withAge = 0;

  for (const e of d.employees) {
    if (e.statut !== "actif" || !e.date_naissance) continue;
    const age = differenceInYears(ref, parseISO(e.date_naissance));
    totalAge += age;
    withAge++;
    const isFemme = e.genre?.toUpperCase() === "F";
    for (let i = 0; i < ranges.length; i++) {
      if (age >= ranges[i][0] && age <= ranges[i][1]) {
        if (isFemme) bins[i].Femmes++;
        else bins[i].Hommes++;
        break;
      }
    }
  }

  return {
    pyramid: bins,
    averageAge: withAge === 0 ? 0 : Math.round(totalAge / withAge),
  };
}

// ── KPI Masse salariale (12 derniers mois) ─────────────────────────────────
export interface PayrollMonthPoint {
  periode: string;
  label: string; // "Avr 26"
  brut: number;
  net: number;
  coutTotal: number; // brut * (1 + COUT_PATRONAL_RATE)
  hsHeures: number;
}

export interface PayrollKpi {
  series: PayrollMonthPoint[];
  current: PayrollMonthPoint | null;
  previous: PayrollMonthPoint | null;
  deltaPct: number; // M vs M-1
  ytdBrut: number;
  ytdCoutTotal: number;
  averageBrutPerEmployee: number; // sur le mois courant
}

export function computePayroll(d: RhDataset, ref: Date = new Date()): PayrollKpi {
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) months.push(format(subMonths(ref, i), "yyyy-MM"));

  const series: PayrollMonthPoint[] = months.map(m => {
    const monthBulletins = d.bulletins.filter(b => b.periode === m);
    const brut = monthBulletins.reduce((s, b) => s + Number(b.salaire_brut || 0), 0);
    const net = monthBulletins.reduce((s, b) => s + Number(b.salaire_net || 0), 0);
    const hsHeures = monthBulletins.reduce((s, b) => {
      const hs = b.details?.heures_sup;
      return s + Number(hs?.h15 || 0) + Number(hs?.h50 || 0) + Number(hs?.h75 || 0);
    }, 0);
    return {
      periode: m,
      label: format(parseISO(`${m}-01`), "MMM yy", { locale: fr }),
      brut,
      net,
      coutTotal: brut * (1 + COUT_PATRONAL_RATE),
      hsHeures,
    };
  });

  const current = series[series.length - 1] ?? null;
  const previous = series[series.length - 2] ?? null;
  const deltaPct = !previous || previous.brut === 0
    ? 0
    : Math.round(((current!.brut - previous.brut) / previous.brut) * 1000) / 10;

  const year = ref.getFullYear();
  const ytdBulletins = d.bulletins.filter(b => b.periode.startsWith(`${year}-`));
  const ytdBrut = ytdBulletins.reduce((s, b) => s + Number(b.salaire_brut || 0), 0);
  const ytdCoutTotal = ytdBrut * (1 + COUT_PATRONAL_RATE);

  const currentBulletins = current ? d.bulletins.filter(b => b.periode === current.periode) : [];
  const averageBrutPerEmployee = currentBulletins.length === 0
    ? 0
    : Math.round(currentBulletins.reduce((s, b) => s + Number(b.salaire_brut || 0), 0) / currentBulletins.length);

  return { series, current, previous, deltaPct, ytdBrut, ytdCoutTotal, averageBrutPerEmployee };
}

// ── KPI Turnover (12 mois) ─────────────────────────────────────────────────
export interface TurnoverPoint {
  periode: string;
  label: string;
  entrees: number;
  sorties: number;
}

export interface TurnoverKpi {
  series: TurnoverPoint[];
  rateYear: number; // %
  entriesYear: number;
  departuresYear: number;
}

export function computeTurnover(d: RhDataset, ref: Date = new Date()): TurnoverKpi {
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) months.push(format(subMonths(ref, i), "yyyy-MM"));

  const series: TurnoverPoint[] = months.map(m => {
    const entrees = d.employees.filter(e => e.date_embauche.startsWith(m)).length;
    const sorties = d.employees.filter(e => {
      if (e.statut !== "inactif") return false;
      const empContracts = d.contracts.filter(c => c.employee_id === e.id && c.date_fin);
      if (empContracts.length === 0) return false;
      const sorted = [...empContracts].sort((a, b) =>
        new Date(b.date_fin!).getTime() - new Date(a.date_fin!).getTime()
      );
      return sorted[0].date_fin?.startsWith(m);
    }).length;
    return {
      periode: m,
      label: format(parseISO(`${m}-01`), "MMM yy", { locale: fr }),
      entrees,
      sorties,
    };
  });

  const eff = computeEffectif(d, ref);
  const avgEffectif = (eff.actifs + Math.max(0, eff.actifs - eff.entriesYear + eff.departuresYear)) / 2;
  const rateYear = avgEffectif === 0 ? 0 : Math.round((eff.departuresYear / avgEffectif) * 1000) / 10;

  return { series, rateYear, entriesYear: eff.entriesYear, departuresYear: eff.departuresYear };
}

// ── KPI Absentéisme (mois courant) ─────────────────────────────────────────
export interface AbsenteeismKpi {
  rateMonth: number;
  totalDaysMonth: number;
  byType: { type: string; days: number }[];
}

export function computeAbsenteeism(d: RhDataset, ref: Date = new Date()): AbsenteeismKpi {
  const eff = computeEffectif(d, ref);
  const month = ref.getMonth();
  const year = ref.getFullYear();
  const theoreticalDays = eff.actifs * 22;

  let total = 0;
  const byTypeMap = new Map<string, number>();

  for (const c of d.conges) {
    if (c.statut !== "approuve") continue;
    const t = c.type.toLowerCase();
    if (!ABSENTEEISM_TYPES.has(t)) continue;
    const debut = new Date(c.date_debut);
    if (debut.getMonth() !== month || debut.getFullYear() !== year) continue;
    total += Number(c.nb_jours);
    byTypeMap.set(t, (byTypeMap.get(t) || 0) + Number(c.nb_jours));
  }

  return {
    rateMonth: theoreticalDays === 0 ? 0 : Math.round((total / theoreticalDays) * 1000) / 10,
    totalDaysMonth: total,
    byType: Array.from(byTypeMap.entries()).map(([type, days]) => ({ type, days })).sort((a, b) => b.days - a.days),
  };
}

// ── KPI Médical / Conformité ───────────────────────────────────────────────
export interface MedicalKpi {
  complianceRate: number;   // % salariés actifs avec visite à jour
  expiringSoon: number;     // visites dans <60j
  overdue: number;          // visites passées
}

export function computeMedical(d: RhDataset, ref: Date = new Date()): MedicalKpi {
  const eff = computeEffectif(d, ref);
  if (eff.actifs === 0) return { complianceRate: 0, expiringSoon: 0, overdue: 0 };

  const now = new Date(ref);
  const soon = new Date(ref);
  soon.setDate(soon.getDate() + 60);

  let compliant = 0;
  let expiring = 0;
  let overdue = 0;

  for (const e of d.employees) {
    if (e.statut !== "actif") continue;
    const empMedical = d.medical.filter(m => m.employee_id === e.id);
    if (empMedical.length === 0) continue;
    const latest = [...empMedical].sort((a, b) => (b.prochaine_visite || "").localeCompare(a.prochaine_visite || ""))[0];
    if (!latest.prochaine_visite) continue;
    const visiteDate = new Date(latest.prochaine_visite);
    if (visiteDate < now) overdue++;
    else if (visiteDate < soon) {
      compliant++;
      expiring++;
    } else {
      compliant++;
    }
  }

  return {
    complianceRate: Math.round((compliant / eff.actifs) * 1000) / 10,
    expiringSoon: expiring,
    overdue,
  };
}

// ── KPI Recrutement ────────────────────────────────────────────────────────
export interface RecruitmentKpi {
  jobsTotal: number;
  jobsOpen: number;
  candidatesTotal: number;
  candidatesHired: number;
  fillRate: number;
  avgHiringDays: number;
  avgScoreIa: number;
}

export function computeRecruitment(d: RhDataset): RecruitmentKpi {
  const jobsTotal = d.jobPostings.length;
  const jobsOpen = d.jobPostings.filter(j => j.statut === "ouvert").length;
  const candidatesTotal = d.candidates.length;
  const candidatesHired = d.candidates.filter(c => c.statut === "recrute").length;

  const fillRate = jobsTotal === 0 ? 0 : Math.round((candidatesHired / jobsTotal) * 1000) / 10;

  let totalDays = 0;
  let recruited = 0;
  for (const c of d.candidates) {
    if (c.statut !== "recrute" || !c.job_id) continue;
    const job = d.jobPostings.find(j => j.id === c.job_id);
    if (!job) continue;
    const created = new Date(job.created_at).getTime();
    const closed = new Date(c.created_at).getTime();
    totalDays += Math.max(0, (closed - created) / 86400000);
    recruited++;
  }
  const avgHiringDays = recruited === 0 ? 0 : Math.round(totalDays / recruited);

  const sumScore = d.candidates.reduce((s, c) => s + (c.score_ia || 0), 0);
  const avgScoreIa = candidatesTotal === 0 ? 0 : Math.round((sumScore / candidatesTotal) * 10) / 10;

  return { jobsTotal, jobsOpen, candidatesTotal, candidatesHired, fillRate, avgHiringDays, avgScoreIa };
}

// ── KPI Performance ────────────────────────────────────────────────────────
export interface PerformanceKpi {
  total: number;
  validated: number;
  avgScore: number;
  avgPotential: number;
  byCategory: { category: string; avgScore: number; count: number }[];
}

export function computePerformance(d: RhDataset): PerformanceKpi {
  const valid = d.evaluations.filter(ev => ev.statut === "valide");
  const total = d.evaluations.length;
  if (valid.length === 0) {
    return { total, validated: 0, avgScore: 0, avgPotential: 0, byCategory: [] };
  }
  const avgScore = Math.round((valid.reduce((s, ev) => s + Number(ev.score_global || 0), 0) / valid.length) * 10) / 10;
  const avgPotential = Math.round((valid.reduce((s, ev) => s + Number(ev.potential_score || 0), 0) / valid.length) * 10) / 10;

  // par catégorie
  const empById = new Map(d.employees.map(e => [e.id, e]));
  const catMap = new Map<string, { sum: number; count: number }>();
  for (const ev of valid) {
    const emp = empById.get(ev.employee_id);
    const cat = emp?.categorie || "Non définie";
    const cur = catMap.get(cat) || { sum: 0, count: 0 };
    cur.sum += Number(ev.score_global || 0);
    cur.count++;
    catMap.set(cat, cur);
  }
  const byCategory = Array.from(catMap.entries()).map(([category, v]) => ({
    category,
    avgScore: Math.round((v.sum / v.count) * 10) / 10,
    count: v.count,
  })).sort((a, b) => b.avgScore - a.avgScore);

  return { total, validated: valid.length, avgScore, avgPotential, byCategory };
}

// ── KPI Sécurité / Accidents ───────────────────────────────────────────────
export interface SafetyKpi {
  count: number;
  joursPerdus: number;
  freqRate: number;     // /1M heures
  severityRate: number; // /1k heures
  byGravity: { gravite: string; count: number }[];
}

export function computeSafety(d: RhDataset, ref: Date = new Date()): SafetyKpi {
  const eff = computeEffectif(d, ref);
  const count = d.accidents.length;
  const joursPerdus = d.accidents.reduce((s, a) => s + (a.jours_arret || 0), 0);
  const theoreticalHours = eff.actifs * HEURES_MENSUELLES * 12;
  const freqRate = theoreticalHours === 0 ? 0 : Math.round((count / theoreticalHours) * 1_000_000 * 10) / 10;
  const severityRate = theoreticalHours === 0 ? 0 : Math.round((joursPerdus / theoreticalHours) * 1000 * 1000) / 1000;

  const gravMap = new Map<string, number>();
  for (const a of d.accidents) {
    const g = a.gravite || "non précisée";
    gravMap.set(g, (gravMap.get(g) || 0) + 1);
  }
  const byGravity = Array.from(gravMap.entries()).map(([gravite, count]) => ({ gravite, count })).sort((a, b) => b.count - a.count);

  return { count, joursPerdus, freqRate, severityRate, byGravity };
}

// ── Listes uniques (filtres) ───────────────────────────────────────────────
export function listDepartments(employees: RhEmployee[]): string[] {
  const set = new Set<string>();
  for (const e of employees) set.add(e.departement || "Non défini");
  return ["Tous", ...Array.from(set).sort()];
}

export function listCategories(employees: RhEmployee[]): string[] {
  const set = new Set<string>();
  for (const e of employees) set.add(e.categorie || "Non définie");
  return ["Tous", ...Array.from(set).sort()];
}
