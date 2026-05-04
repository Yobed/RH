import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SMIG_CI = 75_000; // FCFA depuis 2023
// Charges patronales CI : ~21% du brut
const CHARGES_PATRONALES_RATE = 0.21;
const CHARGES_TOLERANCE = 0.05; // ±5 pts autorisés

export interface AnomaliePayroll {
  id: string;
  employee_id: string;
  employee_name: string;
  mois: string;
  type: "variation" | "smig" | "charges" | "doublon" | "inactif";
  description: string;
  valeur_attendue: number | null;
  valeur_observee: number | null;
  severite: "warning" | "erreur";
}

export async function GET() {
  try {
    const supabase = createServerClient();

    const [{ data: bulletins }, { data: employees }] = await Promise.all([
      supabase
        .from("bulletins_paie")
        .select(
          "id, employee_id, periode, salaire_brut, salaire_net, total_contributions"
        )
        .order("periode", { ascending: false })
        .limit(2000),
      supabase
        .from("employees")
        .select("id, full_name, statut"),
    ]);

    if (!bulletins || !employees) {
      return NextResponse.json({ error: "Données introuvables" }, { status: 500 });
    }

    const employeeMap = new Map(
      employees.map((e) => [e.id, { full_name: e.full_name, statut: e.statut }])
    );

    const anomalies: AnomaliePayroll[] = [];
    let anomalyIndex = 0;

    const nextId = () => `anomalie-${++anomalyIndex}`;

    // Regrouper par employé pour les vérifications temporelles
    const bulletinsByEmployee = new Map<
      string,
      { id: string; periode: string; salaire_brut: number; salaire_net: number; total_contributions: number }[]
    >();
    bulletins.forEach((b) => {
      const arr = bulletinsByEmployee.get(b.employee_id) ?? [];
      arr.push(b);
      bulletinsByEmployee.set(b.employee_id, arr);
    });

    // Détecter les doublons (même employé, même mois, 2+ bulletins)
    const seen = new Map<string, string>();
    bulletins.forEach((b) => {
      const key = `${b.employee_id}::${b.periode}`;
      if (seen.has(key)) {
        const emp = employeeMap.get(b.employee_id);
        anomalies.push({
          id: nextId(),
          employee_id: b.employee_id,
          employee_name: emp?.full_name ?? b.employee_id,
          mois: b.periode,
          type: "doublon",
          description: `Bulletin en doublon pour ${b.periode}`,
          valeur_attendue: 1,
          valeur_observee: 2,
          severite: "erreur",
        });
      } else {
        seen.set(key, b.id);
      }
    });

    bulletinsByEmployee.forEach((empBulletins, employeeId) => {
      const emp = employeeMap.get(employeeId);
      const empName = emp?.full_name ?? employeeId;

      // Trier du plus récent au plus ancien
      const sorted = [...empBulletins].sort((a, b) =>
        b.periode.localeCompare(a.periode)
      );

      sorted.forEach((bulletin, idx) => {
        const prev = sorted[idx + 1];

        // 1. Variation brute > 20% vs mois précédent
        if (prev && prev.salaire_brut > 0) {
          const delta =
            Math.abs(bulletin.salaire_brut - prev.salaire_brut) / prev.salaire_brut;
          if (delta > 0.2) {
            const pct = Math.round(delta * 100);
            anomalies.push({
              id: nextId(),
              employee_id: employeeId,
              employee_name: empName,
              mois: bulletin.periode,
              type: "variation",
              description: `Variation du salaire brut de ${pct}% vs mois précédent (${prev.periode})`,
              valeur_attendue: prev.salaire_brut,
              valeur_observee: bulletin.salaire_brut,
              severite: "warning",
            });
          }
        }

        // 2. Salaire < SMIG
        if (bulletin.salaire_brut > 0 && bulletin.salaire_brut < SMIG_CI) {
          anomalies.push({
            id: nextId(),
            employee_id: employeeId,
            employee_name: empName,
            mois: bulletin.periode,
            type: "smig",
            description: `Salaire brut (${bulletin.salaire_brut.toLocaleString("fr-CI")} FCFA) inférieur au SMIG (${SMIG_CI.toLocaleString("fr-CI")} FCFA)`,
            valeur_attendue: SMIG_CI,
            valeur_observee: bulletin.salaire_brut,
            severite: "erreur",
          });
        }

        // 3. Charges patronales incohérentes
        if (bulletin.salaire_brut > 0 && bulletin.total_contributions != null) {
          const expectedCharges = bulletin.salaire_brut * CHARGES_PATRONALES_RATE;
          const ratio = bulletin.total_contributions / bulletin.salaire_brut;
          const deviation = Math.abs(ratio - CHARGES_PATRONALES_RATE);
          if (deviation > CHARGES_TOLERANCE) {
            anomalies.push({
              id: nextId(),
              employee_id: employeeId,
              employee_name: empName,
              mois: bulletin.periode,
              type: "charges",
              description: `Charges patronales incohérentes : ratio observé ${Math.round(ratio * 100)}% (attendu ≈ ${Math.round(CHARGES_PATRONALES_RATE * 100)}%)`,
              valeur_attendue: Math.round(expectedCharges),
              valeur_observee: bulletin.total_contributions,
              severite: "warning",
            });
          }
        }

        // 4. Employé inactif avec bulletin de paie
        if (emp && emp.statut !== "actif") {
          anomalies.push({
            id: nextId(),
            employee_id: employeeId,
            employee_name: empName,
            mois: bulletin.periode,
            type: "inactif",
            description: `Bulletin émis pour un employé ${emp.statut}`,
            valeur_attendue: null,
            valeur_observee: null,
            severite: "erreur",
          });
        }
      });
    });

    return NextResponse.json({ data: anomalies });
  } catch (err) {
    console.error("[anomalies-paie] erreur", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
