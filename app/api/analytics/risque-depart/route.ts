import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface RisqueDepart {
  employee_id: string;
  full_name: string;
  poste: string;
  departement: string;
  score: number;
  niveau: "faible" | "modere" | "eleve" | "critique";
  facteurs: string[];
}

function getNiveau(score: number): RisqueDepart["niveau"] {
  if (score >= 70) return "critique";
  if (score >= 45) return "eleve";
  if (score >= 20) return "modere";
  return "faible";
}

export async function GET() {
  try {
    const supabase = createServerClient();

    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const twoYearsAgo = new Date(now);
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const in60Days = new Date(now);
    in60Days.setDate(in60Days.getDate() + 60);

    const [
      { data: employees },
      { data: bulletins },
      { data: evaluations },
      { data: conges },
      { data: contracts },
      { data: contentieux },
      { data: formations },
    ] = await Promise.all([
      supabase
        .from("employees")
        .select("id, full_name, poste, departement, date_embauche, statut")
        .eq("statut", "actif"),
      supabase
        .from("bulletins_paie")
        .select("employee_id, periode, salaire_brut")
        .order("periode", { ascending: false }),
      supabase
        .from("evaluations")
        .select("employee_id, score_global, date_realisation")
        .eq("statut", "valide")
        .order("date_realisation", { ascending: false }),
      supabase
        .from("conges")
        .select("employee_id, nb_jours, date_debut")
        .eq("statut", "approuve")
        .gte("date_debut", oneYearAgo.toISOString().slice(0, 10)),
      supabase
        .from("contracts")
        .select("employee_id, type_contrat, date_fin, statut")
        .eq("statut", "actif"),
      supabase
        .from("legal_cases")
        .select("employee_id, statut")
        .in("statut", ["ouvert", "en_cours"]),
      supabase
        .from("formation_inscriptions")
        .select("employee_id, created_at")
        .order("created_at", { ascending: false }),
    ]);

    if (!employees) {
      return NextResponse.json({ error: "Données employés introuvables" }, { status: 500 });
    }

    // Index par employee_id pour performance
    const evalsByEmployee = new Map<string, { score_global: number; date_realisation: string }[]>();
    (evaluations ?? []).forEach((e) => {
      const arr = evalsByEmployee.get(e.employee_id) ?? [];
      arr.push(e);
      evalsByEmployee.set(e.employee_id, arr);
    });

    const bulletinsByEmployee = new Map<string, { salaire_brut: number; periode: string }[]>();
    (bulletins ?? []).forEach((b) => {
      const arr = bulletinsByEmployee.get(b.employee_id) ?? [];
      arr.push(b);
      bulletinsByEmployee.set(b.employee_id, arr);
    });

    const congesByEmployee = new Map<string, number>();
    (conges ?? []).forEach((c) => {
      const total = congesByEmployee.get(c.employee_id) ?? 0;
      congesByEmployee.set(c.employee_id, total + (c.nb_jours ?? 0));
    });

    const contractByEmployee = new Map<string, { type_contrat: string; date_fin: string | null }>();
    (contracts ?? []).forEach((c) => {
      contractByEmployee.set(c.employee_id, c);
    });

    const contentieuxEmployees = new Set<string>(
      (contentieux ?? []).map((c) => c.employee_id)
    );

    const lastFormationByEmployee = new Map<string, string>();
    (formations ?? []).forEach((f) => {
      if (!lastFormationByEmployee.has(f.employee_id)) {
        lastFormationByEmployee.set(f.employee_id, f.created_at);
      }
    });

    const results: RisqueDepart[] = employees.map((emp) => {
      let score = 0;
      const facteurs: string[] = [];

      // Ancienneté < 1 an : +15 pts
      if (emp.date_embauche) {
        const embauche = new Date(emp.date_embauche);
        const ancienneteMs = now.getTime() - embauche.getTime();
        const ancienneteAns = ancienneteMs / (365.25 * 24 * 3600 * 1000);
        if (ancienneteAns < 1) {
          score += 15;
          facteurs.push("Ancienneté < 1 an");
        }
      }

      // Pas d'augmentation depuis 2+ ans : +20 pts
      const empBulletins = (bulletinsByEmployee.get(emp.id) ?? [])
        .sort((a, b) => b.periode.localeCompare(a.periode));
      if (empBulletins.length >= 2) {
        const recent = empBulletins.slice(0, 3);
        const old = empBulletins.filter((b) => b.periode < twoYearsAgo.toISOString().slice(0, 7));
        if (old.length > 0) {
          const avgRecent = recent.reduce((s, b) => s + b.salaire_brut, 0) / recent.length;
          const avgOld = old.slice(0, 3).reduce((s, b) => s + b.salaire_brut, 0) / Math.min(old.length, 3);
          if (avgOld > 0 && (avgRecent - avgOld) / avgOld < 0.02) {
            score += 20;
            facteurs.push("Aucune augmentation depuis 2+ ans");
          }
        }
      }

      // Dernier score évaluation < 60 : +15 pts
      const empEvals = evalsByEmployee.get(emp.id) ?? [];
      if (empEvals.length > 0) {
        const lastEval = empEvals[0];
        // score_global est sur 5 en base, on normalise sur 100
        const scoreOn100 = (lastEval.score_global / 5) * 100;
        if (scoreOn100 < 60) {
          score += 15;
          facteurs.push(`Score évaluation faible (${Math.round(scoreOn100)}/100)`);
        }
      }

      // Absences fréquentes > 15 jours/an : +20 pts
      const totalAbsences = congesByEmployee.get(emp.id) ?? 0;
      if (totalAbsences > 15) {
        score += 20;
        facteurs.push(`Absences fréquentes (${totalAbsences}j/an)`);
      }

      // Contrat CDD expirant < 60j : +25 pts
      const contrat = contractByEmployee.get(emp.id);
      if (contrat?.type_contrat === "CDD" && contrat.date_fin) {
        const dateFin = new Date(contrat.date_fin);
        if (dateFin <= in60Days && dateFin >= now) {
          score += 25;
          facteurs.push(`CDD expirant dans < 60 jours (${contrat.date_fin})`);
        }
      }

      // Contentieux ouvert : +30 pts
      if (contentieuxEmployees.has(emp.id)) {
        score += 30;
        facteurs.push("Contentieux ouvert");
      }

      // Aucune formation depuis 1+ an : +10 pts
      const lastFormation = lastFormationByEmployee.get(emp.id);
      if (!lastFormation || new Date(lastFormation) < oneYearAgo) {
        score += 10;
        facteurs.push("Aucune formation depuis 1+ an");
      }

      // Plafonner à 100
      const finalScore = Math.min(score, 100);

      return {
        employee_id: emp.id,
        full_name: emp.full_name,
        poste: emp.poste ?? "",
        departement: emp.departement ?? "",
        score: finalScore,
        niveau: getNiveau(finalScore),
        facteurs,
      };
    });

    // Trier par score décroissant
    results.sort((a, b) => b.score - a.score);

    return NextResponse.json({ data: results });
  } catch (err) {
    console.error("[risque-depart] erreur", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
