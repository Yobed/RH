import { createServerClient } from "@/lib/supabase/server";
import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import {
  calculerBulletinComplet,
  calculerPrimeAnciennete,
  calculerProvision13e,
} from "@/lib/paie-ci";
import { logAuditEvent } from "@/lib/audit";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  periode: z.string().regex(/^\d{4}-\d{2}$/, "Format YYYY-MM"),
  preview: z.boolean().default(false),
});

interface EmployeeRow {
  id: string;
  full_name: string;
  matricule: string;
  date_embauche: string;
  salaire_brut: number | null;
  sursalaire: number | null;
  prime_exceptionnelle: number | null;
  prime_salissure: number | null;
  prime_depassement: number | null;
  prime_fonction: number | null;
  prime_transport: number | null;
}

interface LineSummary {
  employee_id: string;
  employee_name: string;
  matricule: string;
  salaire_brut: number;
  total_brut: number;
  net_to_pay: number;
  warnings: string[];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rl = checkRateLimit(req, { limit: 3, windowMs: 60_000, key: "generer-lot" });
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const { periode, preview } = parsed.data;

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Entreprise introuvable" }, { status: 403 });

  // 1) Salariés actifs avec un salaire de base
  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, matricule, date_embauche, salaire_brut, sursalaire, prime_exceptionnelle, prime_salissure, prime_depassement, prime_fonction, prime_transport")
    .eq("company_id", companyId as string)
    .eq("statut", "actif");

  const eligible = (employees ?? []).filter((e) => Number(e.salaire_brut ?? 0) > 0) as EmployeeRow[];
  if (eligible.length === 0) {
    return NextResponse.json({ error: "Aucun salarié actif éligible." }, { status: 422 });
  }

  // 2) Salariés ayant déjà un bulletin pour cette période
  const { data: existing } = await supabase
    .from("bulletins_paie")
    .select("employee_id")
    .eq("company_id", companyId as string)
    .eq("periode", periode);
  const alreadyExists = new Set((existing ?? []).map((b) => b.employee_id));

  // 3) Heures supplémentaires de la période
  const periodStart = `${periode}-01`;
  const periodEnd = `${periode}-31`;
  const { data: overtime } = await supabase
    .from("overtime_records")
    .select("employee_id, hours_count, category")
    .eq("company_id", companyId as string)
    .gte("date", periodStart)
    .lte("date", periodEnd);
  const otByEmp = new Map<string, { h15: number; h50: number; h75: number }>();
  for (const o of overtime ?? []) {
    const cur = otByEmp.get(o.employee_id) ?? { h15: 0, h50: 0, h75: 0 };
    if (o.category === "15%") cur.h15 += Number(o.hours_count);
    else if (o.category === "50%") cur.h50 += Number(o.hours_count);
    else if (o.category === "75%" || o.category === "100%") cur.h75 += Number(o.hours_count);
    otByEmp.set(o.employee_id, cur);
  }

  // 4) Absences non justifiées de la période
  const { data: conges } = await supabase
    .from("conges")
    .select("employee_id, nb_jours, type, statut, date_debut")
    .eq("company_id", companyId as string)
    .eq("statut", "approuve")
    .gte("date_debut", periodStart)
    .lte("date_debut", periodEnd);
  const absByEmp = new Map<string, number>();
  for (const c of conges ?? []) {
    const t = (c.type ?? "").toLowerCase();
    if (t === "sans_solde" || t === "absence" || t === "absence_non_payee") {
      absByEmp.set(c.employee_id, (absByEmp.get(c.employee_id) ?? 0) + Number(c.nb_jours));
    }
  }

  // 5) Construire les lignes
  const lines: LineSummary[] = [];
  let totalBrut = 0;
  let totalNet = 0;
  const toCreate: Array<Record<string, unknown>> = [];

  for (const emp of eligible) {
    const warnings: string[] = [];
    if (alreadyExists.has(emp.id)) {
      warnings.push("Bulletin déjà existant — sera ignoré");
    }
    const sb = Number(emp.salaire_brut ?? 0);
    const primeAnc = calculerPrimeAnciennete(sb, emp.date_embauche);
    const provision13 = calculerProvision13e(sb);
    const ot = otByEmp.get(emp.id) ?? { h15: 0, h50: 0, h75: 0 };
    const absJours = absByEmp.get(emp.id) ?? 0;

    const calc = calculerBulletinComplet({
      salaire_brut: sb,
      sursalaire: Number(emp.sursalaire ?? 0),
      prime_anciennete: primeAnc,
      prime_exceptionnelle: Number(emp.prime_exceptionnelle ?? provision13),
      prime_salissure: Number(emp.prime_salissure ?? 0),
      prime_depassement: Number(emp.prime_depassement ?? 0),
      prime_fonction: Number(emp.prime_fonction ?? 0),
      prime_transport: Number(emp.prime_transport ?? 0),
      heures_sup: ot,
      autres_retenues: 0,
      avances: 0,
      nb_jours_absence: absJours,
    });

    if (absJours > 0) warnings.push(`${absJours} j d'absence non payés`);
    const totalHs = ot.h15 + ot.h50 + ot.h75;
    if (totalHs > 0) warnings.push(`${totalHs} h supplémentaires`);

    lines.push({
      employee_id: emp.id,
      employee_name: emp.full_name,
      matricule: emp.matricule,
      salaire_brut: sb,
      total_brut: calc.gross_salary,
      net_to_pay: calc.net_to_pay,
      warnings,
    });
    totalBrut += calc.gross_salary;
    totalNet += calc.net_to_pay;

    if (!preview && !alreadyExists.has(emp.id)) {
      toCreate.push({
        company_id: companyId as string,
        employee_id: emp.id,
        periode,
        salaire_brut: sb,
        sursalaire: Number(emp.sursalaire ?? 0),
        prime_anciennete: primeAnc,
        prime_exceptionnelle: Number(emp.prime_exceptionnelle ?? provision13),
        prime_salissure: Number(emp.prime_salissure ?? 0),
        prime_depassement: Number(emp.prime_depassement ?? 0),
        prime_fonction: Number(emp.prime_fonction ?? 0),
        prime_transport: Number(emp.prime_transport ?? 0),
        cnps_salarie: calc.cnps_salarie,
        its: calc.its,
        autres_retenues: 0,
        avances: 0,
        salaire_net: calc.salaire_net,
        overtime_pay: calc.overtime_pay,
        gross_salary: calc.gross_salary,
        exempt_indemnity: calc.exempt_indemnity,
        fiscal_gross: calc.fiscal_gross,
        social_gross: calc.social_gross,
        tax_is: calc.tax_is,
        tax_cn: calc.tax_cn,
        tax_igr: calc.tax_igr,
        withholding_cnps: calc.withholding_cnps,
        total_contributions: calc.total_contributions,
        net_before_withholding: calc.net_before_withholding,
        net_to_pay: calc.net_to_pay,
        adjustment_m_minus_1: 0,
        negative_pay_adjustment: 0,
        negative_advance: 0,
        rounding_adjustment: 0,
        details: {
          heures_sup: ot,
          heures_sup_montant: calc.heures_sup_montant,
          nb_jours_absence: absJours,
          retenu_absence: calc.retenu_absence,
          generated_in_batch: true,
        },
      });
    }
  }

  if (preview) {
    return NextResponse.json({
      periode,
      total_brut: totalBrut,
      total_net: totalNet,
      nb_eligible: lines.length,
      nb_existing: lines.filter((l) => l.warnings.includes("Bulletin déjà existant — sera ignoré")).length,
      lines,
    });
  }

  // Insertion en lot
  if (toCreate.length === 0) {
    return NextResponse.json(
      { error: "Tous les bulletins existent déjà pour cette période." },
      { status: 422 }
    );
  }
  const { error: insErr } = await supabase.from("bulletins_paie").insert(toCreate);
  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  // AUDIT: Log batch payroll generation
  await logAuditEvent({
    action: "generate",
    entity_type: "bulletins_paie",
    entity_id: periode,
    details: {
      periode,
      nb_created: toCreate.length,
      total_brut: totalBrut,
      total_net: totalNet,
    }
  });

  return NextResponse.json({
    ok: true,
    periode,
    nb_created: toCreate.length,
    total_brut: totalBrut,
    total_net: totalNet,
  });
}
