/**
 * Moteur de rappels centralisé.
 *
 * Agrège les échéances depuis toutes les tables existantes
 * et les expose comme rappels typés. Aucune table dédiée n'est
 * matérialisée par ce module — chaque appel recalcule l'état
 * actuel à partir des sources de vérité.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type ReminderSeverity = "info" | "warn" | "danger" | "overdue";
export type ReminderCategory =
  | "declaration"
  | "contract"
  | "medical"
  | "discipline"
  | "cdd"
  | "accident"
  | "probation"
  | "leave_balance";

export interface Reminder {
  id: string;                  // composé : category-resourceId
  category: ReminderCategory;
  severity: ReminderSeverity;
  title: string;
  description: string;
  due_date: string | null;
  days_remaining: number | null;
  resource_type: string;
  resource_id: string;
  employee_id: string | null;
  href?: string;               // route applicative à ouvrir
}

const DAY = 86_400_000;

function severityFromDays(days: number, warnDays = 7, dangerDays = 3): ReminderSeverity {
  if (days < 0) return "overdue";
  if (days <= dangerDays) return "danger";
  if (days <= warnDays) return "warn";
  return "info";
}

function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("fr-CI", { day: "2-digit", month: "long", year: "numeric" });
}

export async function buildReminders(
  supabase: SupabaseClient,
  companyId: string
): Promise<Reminder[]> {
  const reminders: Reminder[] = [];
  const today = new Date();

  // 1) Déclarations sociales non soumises
  const { data: socials } = await supabase
    .from("social_declarations")
    .select("id, kind, periode, deadline, statut, total_cotisations")
    .eq("company_id", companyId)
    .neq("statut", "soumis")
    .order("deadline", { ascending: true })
    .limit(50);
  for (const d of socials ?? []) {
    const days = Math.ceil((new Date(d.deadline).getTime() - today.getTime()) / DAY);
    reminders.push({
      id: `social-${d.id}`,
      category: "declaration",
      severity: severityFromDays(days),
      title: `${d.kind} ${d.periode} à soumettre`,
      description: `Échéance le ${fmtDate(d.deadline)} · ${d.total_cotisations?.toLocaleString("fr-CI") ?? 0} FCFA dus`,
      due_date: d.deadline,
      days_remaining: days,
      resource_type: "social_declarations",
      resource_id: d.id,
      employee_id: null,
      href: "/declarations",
    });
  }

  // 2) Déclarations fiscales non soumises
  const { data: taxes } = await supabase
    .from("tax_declarations")
    .select("id, kind, periode, deadline, statut, total_retenu")
    .eq("company_id", companyId)
    .neq("statut", "soumis")
    .order("deadline", { ascending: true })
    .limit(50);
  for (const d of taxes ?? []) {
    const days = Math.ceil((new Date(d.deadline).getTime() - today.getTime()) / DAY);
    reminders.push({
      id: `tax-${d.id}`,
      category: "declaration",
      severity: severityFromDays(days),
      title: `${d.kind} ${d.periode} — bordereau DGI`,
      description: `Versement ITS · ${d.total_retenu?.toLocaleString("fr-CI") ?? 0} FCFA · échéance ${fmtDate(d.deadline)}`,
      due_date: d.deadline,
      days_remaining: days,
      resource_type: "tax_declarations",
      resource_id: d.id,
      employee_id: null,
      href: "/declarations",
    });
  }

  // 3) Accidents du travail non déclarés CNPS (deadline 48h)
  const { data: accidents } = await supabase
    .from("work_accidents")
    .select("id, employee_id, date_accident, deadline_declaration_cnps, employees(full_name)")
    .eq("company_id", companyId)
    .eq("statut_cnps", "non_declare")
    .order("deadline_declaration_cnps", { ascending: true })
    .limit(30);
  for (const a of accidents ?? []) {
    if (!a.deadline_declaration_cnps) continue;
    const days = Math.ceil(
      (new Date(a.deadline_declaration_cnps).getTime() - today.getTime()) / DAY
    );
    const empName =
      (a.employees as { full_name?: string } | null)?.full_name ?? "Salarié";
    reminders.push({
      id: `accident-${a.id}`,
      category: "accident",
      severity: severityFromDays(days, 1, 0),
      title: `Déclarer accident CNPS — ${empName}`,
      description: `Accident du ${fmtDate(a.date_accident)} · délai 48 h Art. 47 CT-CI`,
      due_date: a.deadline_declaration_cnps,
      days_remaining: days,
      resource_type: "work_accidents",
      resource_id: a.id,
      employee_id: a.employee_id,
      href: "/qhse",
    });
  }

  // 4) Visites médicales en retard ou à venir
  const todayStr = today.toISOString().slice(0, 10);
  const { data: visits } = await supabase
    .from("medical_visits")
    .select("id, employee_id, date_prochaine, type_visite, employees(full_name)")
    .eq("company_id", companyId)
    .not("date_prochaine", "is", null)
    .lte("date_prochaine", new Date(today.getTime() + 60 * DAY).toISOString().slice(0, 10))
    .order("date_prochaine", { ascending: true })
    .limit(50);
  for (const v of visits ?? []) {
    if (!v.date_prochaine) continue;
    const days = Math.ceil((new Date(v.date_prochaine).getTime() - today.getTime()) / DAY);
    const empName =
      (v.employees as { full_name?: string } | null)?.full_name ?? "Salarié";
    reminders.push({
      id: `medical-${v.id}`,
      category: "medical",
      severity: severityFromDays(days, 30, 14),
      title: `Visite médicale — ${empName}`,
      description: `Visite ${v.type_visite} prévue le ${fmtDate(v.date_prochaine)}`,
      due_date: v.date_prochaine,
      days_remaining: days,
      resource_type: "medical_visits",
      resource_id: v.id,
      employee_id: v.employee_id,
      href: "/qhse",
    });
  }

  // 5) Contrats CDD arrivant à terme dans 60j
  const { data: contracts } = await supabase
    .from("contracts")
    .select("id, employee_id, type_contrat, date_fin, date_fin_essai, statut, employees(full_name)")
    .eq("company_id", companyId)
    .eq("statut", "actif");
  for (const c of contracts ?? []) {
    const empName =
      (c.employees as { full_name?: string } | null)?.full_name ?? "Salarié";
    if (c.type_contrat === "CDD" && c.date_fin) {
      const days = Math.ceil((new Date(c.date_fin).getTime() - today.getTime()) / DAY);
      if (days <= 60) {
        reminders.push({
          id: `cdd-${c.id}`,
          category: "cdd",
          severity: severityFromDays(days, 30, 14),
          title: `Fin de CDD — ${empName}`,
          description: `Décision à prendre : renouvellement, conversion CDI ou non-renouvellement (échéance ${fmtDate(c.date_fin)})`,
          due_date: c.date_fin,
          days_remaining: days,
          resource_type: "contracts",
          resource_id: c.id,
          employee_id: c.employee_id,
          href: `/employes/${c.employee_id}`,
        });
      }
    }
    // Période d'essai : confirmation/rupture sous 7j avant la fin
    if (c.date_fin_essai) {
      const days = Math.ceil((new Date(c.date_fin_essai).getTime() - today.getTime()) / DAY);
      if (days <= 7 && days >= -3) {
        reminders.push({
          id: `probation-${c.id}`,
          category: "probation",
          severity: severityFromDays(days, 7, 3),
          title: `Fin de période d'essai — ${empName}`,
          description: `Confirmation/rupture à formaliser avant le ${fmtDate(c.date_fin_essai)}`,
          due_date: c.date_fin_essai,
          days_remaining: days,
          resource_type: "contracts",
          resource_id: c.id,
          employee_id: c.employee_id,
          href: `/employes/${c.employee_id}`,
        });
      }
    }
  }

  // 6) Sanctions disciplinaires non notifiées (Art. 28.2 — 60j)
  const { data: discs } = await supabase
    .from("disciplinary_procedures")
    .select("id, employee_id, type, date_incident, date_notification, statut, employees(full_name)")
    .eq("company_id", companyId)
    .neq("statut", "ARCHIVE")
    .is("date_notification", null)
    .not("date_incident", "is", null)
    .limit(40);
  for (const d of discs ?? []) {
    if (!d.date_incident) continue;
    const incident = new Date(d.date_incident);
    const deadline = new Date(incident);
    deadline.setDate(deadline.getDate() + 60);
    const days = Math.ceil((deadline.getTime() - today.getTime()) / DAY);
    const empName =
      (d.employees as { full_name?: string } | null)?.full_name ?? "Salarié";
    reminders.push({
      id: `discipline-${d.id}`,
      category: "discipline",
      severity: severityFromDays(days, 14, 7),
      title: `Notifier sanction — ${empName}`,
      description: `${d.type} · faits du ${fmtDate(d.date_incident)} · délai légal 60 j Art. 28.2`,
      due_date: deadline.toISOString().slice(0, 10),
      days_remaining: days,
      resource_type: "disciplinary_procedures",
      resource_id: d.id,
      employee_id: d.employee_id,
      href: "/disciplinaire",
    });
  }

  // tri global : par sévérité puis date
  const order: Record<ReminderSeverity, number> = { overdue: 0, danger: 1, warn: 2, info: 3 };
  reminders.sort((a, b) => {
    const s = order[a.severity] - order[b.severity];
    if (s !== 0) return s;
    return (a.days_remaining ?? 999) - (b.days_remaining ?? 999);
  });

  return reminders;
}
