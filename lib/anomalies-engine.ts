/**
 * Détection automatique d'anomalies dans les données RH.
 * Aucune table dédiée — calcul en temps réel à partir de l'existant.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { format, subMonths } from "date-fns";

export type AnomalySeverity = "critical" | "warning" | "info";

export interface Anomaly {
  id: string;
  severity: AnomalySeverity;
  type: string;
  title: string;
  description: string;
  count: number;
  href?: string;
  examples?: string[];
}

export async function detectAnomalies(
  supabase: SupabaseClient,
  companyId: string
): Promise<Anomaly[]> {
  const out: Anomaly[] = [];
  const now = new Date();

  // 1) Salariés actifs sans bulletin pour le mois courant
  const currentMonth = format(now, "yyyy-MM");
  const { data: actifs } = await supabase
    .from("employees")
    .select("id, full_name")
    .eq("company_id", companyId)
    .eq("statut", "actif");

  if (actifs && actifs.length > 0) {
    const { data: bulletinsMonth } = await supabase
      .from("bulletins_paie")
      .select("employee_id")
      .eq("company_id", companyId)
      .eq("periode", currentMonth);

    const withBulletin = new Set((bulletinsMonth ?? []).map((b) => b.employee_id));
    const missing = actifs.filter((e) => !withBulletin.has(e.id));
    if (missing.length > 0) {
      out.push({
        id: "missing-bulletins",
        severity: "warning",
        type: "paie",
        title: `${missing.length} bulletin${missing.length > 1 ? "s" : ""} manquant${missing.length > 1 ? "s" : ""} (${currentMonth})`,
        description: "Salariés actifs sans bulletin de paie pour le mois en cours.",
        count: missing.length,
        examples: missing.slice(0, 5).map((e) => e.full_name),
        href: "/paie",
      });
    }
  }

  // 2) CDD avec cumul approchant les 24 mois
  const { data: cdds } = await supabase
    .from("contracts")
    .select("employee_id, type_contrat, date_debut, date_fin, statut, employees(full_name)")
    .eq("company_id", companyId)
    .eq("type_contrat", "CDD");
  const cumulByEmp = new Map<string, { cumul: number; name: string }>();
  for (const c of cdds ?? []) {
    const start = new Date(c.date_debut).getTime();
    const end = c.date_fin ? new Date(c.date_fin).getTime() : Date.now();
    const months = Math.max(0, (end - start) / (30.44 * 86_400_000));
    const cur = cumulByEmp.get(c.employee_id) ?? {
      cumul: 0,
      name: (c.employees as { full_name?: string } | null)?.full_name ?? "",
    };
    cur.cumul += months;
    cumulByEmp.set(c.employee_id, cur);
  }
  const cddRisk = Array.from(cumulByEmp.entries()).filter(([, v]) => v.cumul >= 18);
  if (cddRisk.length > 0) {
    out.push({
      id: "cdd-risk",
      severity: "critical",
      type: "contrat",
      title: `${cddRisk.length} CDD proches du plafond 24 mois`,
      description:
        "Cumul des CDD ≥ 18 mois. Conversion en CDI obligatoire au-delà de 24 mois (Art. 14 CT-CI).",
      count: cddRisk.length,
      examples: cddRisk
        .slice(0, 5)
        .map(([, v]) => `${v.name} (${v.cumul.toFixed(1)} mois)`),
      href: "/contrats",
    });
  }

  // 3) Bulletins avec variation > 30 % vs M-1
  const prevMonth = format(subMonths(now, 1), "yyyy-MM");
  const { data: bulletinsCurrPrev } = await supabase
    .from("bulletins_paie")
    .select("employee_id, periode, salaire_brut, employees(full_name)")
    .eq("company_id", companyId)
    .in("periode", [currentMonth, prevMonth]);

  const byEmp = new Map<string, { curr?: number; prev?: number; name: string }>();
  for (const b of bulletinsCurrPrev ?? []) {
    const cur = byEmp.get(b.employee_id) ?? {
      name: (b.employees as { full_name?: string } | null)?.full_name ?? "",
    };
    if (b.periode === currentMonth) cur.curr = Number(b.salaire_brut);
    else cur.prev = Number(b.salaire_brut);
    byEmp.set(b.employee_id, cur);
  }
  const variations = Array.from(byEmp.entries()).filter(
    ([, v]) =>
      v.curr !== undefined &&
      v.prev !== undefined &&
      v.prev > 0 &&
      Math.abs((v.curr - v.prev) / v.prev) > 0.3
  );
  if (variations.length > 0) {
    out.push({
      id: "salary-variations",
      severity: "warning",
      type: "paie",
      title: `${variations.length} variation${variations.length > 1 ? "s" : ""} salariale${variations.length > 1 ? "s" : ""} > 30 %`,
      description: "Écarts notables entre le bulletin du mois et celui du mois précédent.",
      count: variations.length,
      examples: variations.slice(0, 5).map(([, v]) => {
        const delta = v.prev! > 0 ? Math.round(((v.curr! - v.prev!) / v.prev!) * 100) : 0;
        return `${v.name} (${delta > 0 ? "+" : ""}${delta} %)`;
      }),
      href: "/paie",
    });
  }

  // 4) Salariés actifs sans contrat actif
  const { data: actifsAll } = await supabase
    .from("employees")
    .select("id, full_name")
    .eq("company_id", companyId)
    .eq("statut", "actif");
  const { data: activeContracts } = await supabase
    .from("contracts")
    .select("employee_id")
    .eq("company_id", companyId)
    .eq("statut", "actif");
  const withContract = new Set((activeContracts ?? []).map((c) => c.employee_id));
  const missingContract = (actifsAll ?? []).filter((e) => !withContract.has(e.id));
  if (missingContract.length > 0) {
    out.push({
      id: "missing-contract",
      severity: "critical",
      type: "contrat",
      title: `${missingContract.length} salarié${missingContract.length > 1 ? "s" : ""} sans contrat actif`,
      description:
        "Risque de requalification verbale et impossibilité de prouver les conditions d'engagement.",
      count: missingContract.length,
      examples: missingContract.slice(0, 5).map((e) => e.full_name),
      href: "/contrats",
    });
  }

  // 5) Visites médicales en retard
  const todayStr = now.toISOString().slice(0, 10);
  const { data: medOverdue } = await supabase
    .from("medical_visits")
    .select("id, employees(full_name)")
    .eq("company_id", companyId)
    .lt("date_prochaine", todayStr);
  if (medOverdue && medOverdue.length > 0) {
    out.push({
      id: "medical-overdue",
      severity: "warning",
      type: "medical",
      title: `${medOverdue.length} visite${medOverdue.length > 1 ? "s" : ""} médicale${medOverdue.length > 1 ? "s" : ""} en retard`,
      description: "Conformité Art. 41 CT-CI · risque de contestation prud'homale.",
      count: medOverdue.length,
      examples: medOverdue
        .slice(0, 5)
        .map((m) => (m.employees as { full_name?: string } | null)?.full_name ?? ""),
      href: "/qhse",
    });
  }

  // 6) Accidents non déclarés CNPS dépassant 48h
  const cutoff = new Date(now.getTime() - 48 * 3600 * 1000).toISOString();
  const { data: accUndecl } = await supabase
    .from("work_accidents")
    .select("id, employees(full_name)")
    .eq("company_id", companyId)
    .eq("statut_cnps", "non_declare")
    .lt("date_accident", cutoff);
  if (accUndecl && accUndecl.length > 0) {
    out.push({
      id: "accidents-undeclared",
      severity: "critical",
      type: "qhse",
      title: `${accUndecl.length} accident${accUndecl.length > 1 ? "s" : ""} non déclaré${accUndecl.length > 1 ? "s" : ""} (>48 h)`,
      description: "Obligation Art. 47 CT-CI dépassée — risque amende CNPS.",
      count: accUndecl.length,
      examples: accUndecl
        .slice(0, 5)
        .map((a) => (a.employees as { full_name?: string } | null)?.full_name ?? ""),
      href: "/qhse",
    });
  }

  // Tri par sévérité
  const order: Record<AnomalySeverity, number> = { critical: 0, warning: 1, info: 2 };
  out.sort((a, b) => order[a.severity] - order[b.severity]);
  return out;
}
