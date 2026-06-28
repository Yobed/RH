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
  annuel:       "bg-teal-100 text-teal-800 border-teal-200",
  maladie:      "bg-orange-100 text-orange-800 border-orange-200",
  maternite:    "bg-pink-100 text-pink-800 border-pink-200",
  paternite:    "bg-sky-100 text-sky-800 border-sky-200",
  arret_maladie:"bg-red-100 text-red-800 border-red-200",
  sans_solde:   "bg-gray-100 text-gray-800 border-gray-200",
  exceptionnel: "bg-slate-100 text-slate-800 border-slate-200",
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

const DEFAULT_COLOR = "bg-slate-100 text-slate-800 border-slate-200";

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
    <div className="space-y-4">
      {/* Barre de navigation + filtre */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Navigation mois */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => naviguerMois(-1)}
            aria-label="Mois précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[180px] text-center font-semibold capitalize">
            {moisLabel(moisAffiche)}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => naviguerMois(1)}
            aria-label="Mois suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Filtre département */}
        <Select
          value={departementFiltre}
          onValueChange={(v) => setDepartementFiltre(v ?? "tous")}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Tous les départements" />
          </SelectTrigger>
          <SelectContent>
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
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Aucun congé approuvé pour ce mois.
          </div>
        ) : (
          <div className="rounded-lg border bg-white overflow-x-auto">
            <table className="min-w-full text-xs border-collapse">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground border-b border-r min-w-[160px] sticky left-0 bg-muted/50 z-10">
                    Employé
                  </th>
                  {jours.map((j) => {
                    const dateObj = new Date(annee, moisNum - 1, j);
                    const jourSemaine = dateObj.getDay(); // 0=dim, 6=sam
                    const weekend = jourSemaine === 0 || jourSemaine === 6;
                    return (
                      <th
                        key={j}
                        className={`px-1 py-2 text-center font-medium border-b w-8 min-w-[28px] ${
                          weekend ? "bg-muted/70 text-muted-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {j}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y">
                {employeesFiltres.map((emp) => {
                  const joursCouverts = joursCouvertsMap.get(emp.employee_id) ?? new Map<string, string>();
                  return (
                    <tr key={emp.employee_id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2 border-r sticky left-0 bg-white z-10">
                        <p className="font-medium truncate max-w-[140px]">{emp.employee_name}</p>
                        {emp.employee_departement && (
                          <p className="text-muted-foreground text-[10px] truncate max-w-[140px]">
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
                            className={`px-0.5 py-1 text-center border-l ${weekend ? "bg-muted/30" : ""}`}
                          >
                            {type && (
                              <div
                                className={`mx-auto h-5 w-6 rounded text-[10px] flex items-center justify-center border ${couleur}`}
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
        )}
      </div>

      {/* Vue Mobile — liste compacte */}
      <div className="block md:hidden space-y-2">
        {congesFiltres.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
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
                className={`rounded-lg border p-3 flex items-start gap-3 ${couleur}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{conge.employee_name}</p>
                  {conge.employee_departement && (
                    <p className="text-xs opacity-70">{conge.employee_departement}</p>
                  )}
                  <p className="text-xs mt-1">
                    {TYPE_LABELS[conge.type] ?? conge.type} — {debut} au {finDate} ({conge.nb_jours}j)
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Légende */}
      <div className="rounded-lg border bg-white p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Légende</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <span
              key={type}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
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
