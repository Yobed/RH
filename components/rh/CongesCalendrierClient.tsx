"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CongesCalendrierItem {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_departement: string | null;
  type: string;
  date_debut: string; // ISO
  date_fin: string;   // ISO
  nb_jours: number;
  statut: string;
}

interface Props {
  conges: CongesCalendrierItem[];
  departements: string[];
  moisInitial: string; // "YYYY-MM"
}

// ---------------------------------------------------------------------------
// Couleurs par type de congé
// ---------------------------------------------------------------------------

const TYPE_COLORS: Record<string, string> = {
  annuel:       "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 shadow-2xs ring-1 ring-emerald-500/20",
  maladie:      "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 shadow-2xs ring-1 ring-amber-500/20",
  maternite:    "bg-pink-500/15 text-pink-800 dark:text-pink-300 border-pink-500/30 shadow-2xs ring-1 ring-pink-500/20",
  paternite:    "bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30 shadow-2xs ring-1 ring-sky-500/20",
  arret_maladie:"bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30 shadow-2xs ring-1 ring-rose-500/20",
  sans_solde:   "bg-slate-500/15 text-slate-800 dark:text-slate-300 border-slate-500/30 shadow-2xs ring-1 ring-slate-500/20",
  exceptionnel: "bg-[#ee7f03]/15 text-[#d67002] dark:text-[#f8d3a3] border-[#ee7f03]/30 shadow-2xs ring-1 ring-[#ee7f03]/20",
};

const TYPE_LABELS: Record<string, string> = {
  annuel:       "Congé annuel",
  maladie:      "Maladie",
  maternite:    "Maternité",
  paternite:    "Paternité",
  arret_maladie:"Arrêt maladie",
  sans_solde:   "Sans solde",
  exceptionnel: "Exceptionnel",
};

const DEFAULT_COLOR = "bg-slate-500/15 text-slate-800 dark:text-slate-300 border-slate-500/30";

// ---------------------------------------------------------------------------
// Helper — navigate month
// ---------------------------------------------------------------------------

function addMonths(mois: string, delta: number): string {
  const [annee, moisNum] = mois.split("-").map(Number);
  const d = new Date(annee, moisNum - 1 + delta, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function moisLabel(mois: string): string {
  const [annee, moisNum] = mois.split("-").map(Number);
  const d = new Date(annee, moisNum - 1, 1);
  return d.toLocaleDateString("fr-CI", { month: "long", year: "numeric" });
}

function joursInMois(mois: string): number {
  const [annee, moisNum] = mois.split("-").map(Number);
  return new Date(annee, moisNum, 0).getDate();
}

// ---------------------------------------------------------------------------
// Algorithme : calcul des jours couverts par congé par employé
// Retourne Map<employee_id, Map<"YYYY-MM-DD", type>>
// ---------------------------------------------------------------------------

function buildJoursCouvertsParEmploye(
  conges: CongesCalendrierItem[],
  mois: string
): Map<string, Map<string, string>> {
  const [annee, moisNum] = mois.split("-").map(Number);
  const nbJours = joursInMois(mois);

  const result = new Map<string, Map<string, string>>();

  for (const conge of conges) {
    if (!result.has(conge.employee_id)) {
      result.set(conge.employee_id, new Map<string, string>());
    }
    const joursCoverts = result.get(conge.employee_id)!;

    const debut = new Date(conge.date_debut);
    const fin = new Date(conge.date_fin);

    for (let j = 1; j <= nbJours; j++) {
      const jour = new Date(annee, moisNum - 1, j);
      if (jour >= debut && jour <= fin) {
        const key = `${annee}-${String(moisNum).padStart(2, "0")}-${String(j).padStart(2, "0")}`;
        joursCoverts.set(key, conge.type);
      }
    }
  }

  return result;
}

// Construire la liste unique des employés (par order d'apparition)
function buildEmployeesListe(
  conges: CongesCalendrierItem[]
): Array<{ employee_id: string; employee_name: string; employee_departement: string | null }> {
  const seen = new Set<string>();
  const result: Array<{ employee_id: string; employee_name: string; employee_departement: string | null }> = [];
  for (const c of conges) {
    if (!seen.has(c.employee_id)) {
      seen.add(c.employee_id);
      result.push({
        employee_id: c.employee_id,
        employee_name: c.employee_name,
        employee_departement: c.employee_departement,
      });
    }
  }
  return result.sort((a, b) => a.employee_name.localeCompare(b.employee_name, "fr"));
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export function CongesCalendrierClient({ conges, departements, moisInitial }: Props) {
  const router = useRouter();
  const [moisAffiche, setMoisAffiche] = useState<string>(moisInitial);
  const [departementFiltre, setDepartementFiltre] = useState<string>("tous");

  const nbJours = joursInMois(moisAffiche);
  const [annee, moisNum] = moisAffiche.split("-").map(Number);

  // Mémoïser le calcul des jours couverts
  const joursCouvertsMap = useMemo(
    () => buildJoursCouvertsParEmploye(conges, moisAffiche),
    [conges, moisAffiche]
  );

  // Mémoïser la liste des employés
  const employeesList = useMemo(
    () => buildEmployeesListe(conges),
    [conges]
  );

  // Filtrer les employés selon le département
  const employeesFiltres = useMemo(
    () =>
      departementFiltre === "tous"
        ? employeesList
        : employeesList.filter(
            (e) => e.employee_departement === departementFiltre
          ),
    [employeesList, departementFiltre]
  );

  // Congés des employés filtrés (pour la vue mobile)
  const congesFiltres = useMemo(
    () =>
      departementFiltre === "tous"
        ? conges
        : conges.filter((c) => c.employee_departement === departementFiltre),
    [conges, departementFiltre]
  );

  function naviguerMois(delta: number) {
    const nouveauMois = addMonths(moisAffiche, delta);
    setMoisAffiche(nouveauMois);
    router.push(`/conges/calendrier?mois=${nouveauMois}`);
  }

  // Colonnes jours 1..nbJours
  const jours = Array.from({ length: nbJours }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Barre de navigation + filtre avec radiant styling */}
      <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 shadow-2xs flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Navigation mois */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200/60 dark:border-slate-700">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => naviguerMois(-1)}
              aria-label="Mois précédent"
              className="h-8 w-8 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-4 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 min-w-[150px] text-center">
              {moisLabel(moisAffiche)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => naviguerMois(1)}
              aria-label="Mois suivant"
              className="h-8 w-8 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filtre département */}
        <Select
          value={departementFiltre}
          onValueChange={(v) => setDepartementFiltre(v ?? "tous")}
        >
          <SelectTrigger className="w-[240px] rounded-xl font-semibold text-xs border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <SelectValue placeholder="Tous les départements" />
          </SelectTrigger>
          <SelectContent className="rounded-xl font-medium text-xs">
            <SelectItem value="tous">Tous les départements</SelectItem>
            {departements.map((dep) => (
              <SelectItem key={dep} value={dep}>
                {dep}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vue Desktop — grille calendrier */}
      <div className="hidden md:block">
        {employeesFiltres.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
            Aucun congé approuvé pour ce mois.
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border-collapse">
                <thead className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xs">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-300 border-b border-r border-slate-200 dark:border-slate-700 min-w-[180px] sticky left-0 bg-slate-100 dark:bg-slate-800 z-10">
                      Employé
                    </th>
                    {jours.map((j) => {
                      const dateObj = new Date(annee, moisNum - 1, j);
                      const jourSemaine = dateObj.getDay(); // 0=dim, 6=sam
                      const weekend = jourSemaine === 0 || jourSemaine === 6;
                      return (
                        <th
                          key={j}
                          className={`px-1 py-3 text-center font-bold border-b border-slate-200 dark:border-slate-700 w-8 min-w-[30px] ${
                            weekend ? "bg-slate-200/60 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {j}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {employeesFiltres.map((emp) => {
                    const joursCouverts = joursCouvertsMap.get(emp.employee_id) ?? new Map<string, string>();
                    return (
                      <tr key={emp.employee_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5 border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-white dark:bg-slate-900 z-10">
                          <p className="font-bold text-slate-900 dark:text-white truncate max-w-[160px]">{emp.employee_name}</p>
                          {emp.employee_departement && (
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium truncate max-w-[160px]">
                              {emp.employee_departement}
                            </p>
                          )}
                        </td>
                        {jours.map((j) => {
                          const dateKey = `${annee}-${String(moisNum).padStart(2, "0")}-${String(j).padStart(2, "0")}`;
                          const type = joursCouverts.get(dateKey);
                          const couleur = type ? (TYPE_COLORS[type] ?? DEFAULT_COLOR) : "";
                          const dateObj = new Date(annee, moisNum - 1, j);
                          const jourSemaine = dateObj.getDay();
                          const weekend = jourSemaine === 0 || jourSemaine === 6;
                          return (
                            <td
                              key={j}
                              className={`px-0.5 py-1 text-center border-l border-slate-100 dark:border-slate-800 ${weekend ? "bg-slate-50/80 dark:bg-slate-950/40" : ""}`}
                            >
                              {type && (
                                <div
                                  className={`mx-auto h-5 w-6 rounded-md text-[10px] flex items-center justify-center border transition-transform hover:scale-110 ${couleur}`}
                                  title={TYPE_LABELS[type] ?? type}
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Vue Mobile — liste compacte */}
      <div className="block md:hidden space-y-3">
        {congesFiltres.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-xs font-semibold text-slate-500 bg-white dark:bg-slate-900">
            Aucun congé approuvé pour ce mois.
          </div>
        ) : (
          congesFiltres.map((conge) => {
            const couleur = TYPE_COLORS[conge.type] ?? DEFAULT_COLOR;
            const debut = new Date(conge.date_debut).toLocaleDateString("fr-CI", {
              day: "2-digit",
              month: "short",
            });
            const finDate = new Date(conge.date_fin).toLocaleDateString("fr-CI", {
              day: "2-digit",
              month: "short",
            });
            return (
              <div
                key={conge.id}
                className={`rounded-2xl border p-4 flex items-start gap-3 shadow-2xs backdrop-blur-xs ${couleur}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate text-slate-900 dark:text-white">{conge.employee_name}</p>
                  {conge.employee_departement && (
                    <p className="text-xs font-medium opacity-80">{conge.employee_departement}</p>
                  )}
                  <p className="text-xs mt-1 font-semibold">
                    {TYPE_LABELS[conge.type] ?? conge.type} — {debut} au {finDate} ({conge.nb_jours}j)
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Légende Radiant */}
      <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 shadow-2xs">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Légende des types de congés</p>
        <div className="flex flex-wrap gap-2.5">
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <span
              key={type}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold transition-transform hover:scale-105 ${
                TYPE_COLORS[type] ?? DEFAULT_COLOR
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
