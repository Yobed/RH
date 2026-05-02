import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  REFORME_2026,
  computeDeadline,
  computePenaltyCnps,
  generateDipeCsv,
  generateDisaCsv,
  generateItsCsv,
  buildItsLineFromBulletin,
  type DipeLigneSalarie,
  type DisaLigneSalarie,
} from "@/lib/compliance-2026-ci";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    kind: z.enum(["DIPE", "DISA", "DASC", "ITS_MENSUEL", "ITS_ANNUEL"]),
    periode: z.string().regex(/^\d{4}(-\d{2})?$/, "Format invalide (YYYY ou YYYY-MM)"),
  })
  .refine(
    (d) => {
      const isMonthly = d.kind === "DIPE" || d.kind === "ITS_MENSUEL";
      return isMonthly ? d.periode.length === 7 : d.periode.length === 4;
    },
    { message: "Période incompatible avec le type de déclaration" }
  );

interface BulletinRow {
  employee_id: string;
  periode: string;
  salaire_brut: number;
  fiscal_gross: number | null;
  social_gross: number | null;
  cnps_salarie: number;
  withholding_cnps: number | null;
  prime_transport: number | null;
}

interface EmployeeRow {
  id: string;
  matricule: string;
  full_name: string;
  num_cnps: string | null;
  date_naissance: string | null;
  date_embauche: string | null;
  ncc?: string | null;
}

export async function POST(req: Request): Promise<NextResponse> {
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
  const { kind, periode } = parsed.data;

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Entreprise introuvable" }, { status: 403 });

  const { data: company } = await supabase
    .from("companies")
    .select("name, raison_sociale, cnps_matricule, ncc, taux_at_mp")
    .eq("id", companyId as string)
    .single();

  // Récupérer les bulletins pertinents
  const isMonthly = kind === "DIPE" || kind === "ITS_MENSUEL";
  const bulletinFilter = isMonthly ? periode : `${periode}-`;

  const { data: bulletins } = await supabase
    .from("bulletins_paie")
    .select("employee_id, periode, salaire_brut, fiscal_gross, social_gross, cnps_salarie, withholding_cnps, prime_transport")
    .eq("company_id", companyId as string)
    .like("periode", isMonthly ? bulletinFilter : `${bulletinFilter}%`);

  if (!bulletins || bulletins.length === 0) {
    return NextResponse.json(
      { error: `Aucun bulletin trouvé pour la période ${periode}.` },
      { status: 422 }
    );
  }

  const employeeIds = Array.from(new Set(bulletins.map((b) => b.employee_id)));
  const { data: employees } = await supabase
    .from("employees")
    .select("id, matricule, full_name, num_cnps, date_naissance, date_embauche")
    .in("id", employeeIds);

  const empById = new Map<string, EmployeeRow>(
    (employees ?? []).map((e) => [e.id, e as EmployeeRow])
  );

  const tauxAtMp = Number(company?.taux_at_mp ?? REFORME_2026.cnps.at_mp_patronal_default);
  const isSocial = kind === "DIPE" || kind === "DISA" || kind === "DASC";

  let csv: string;
  let totalBrut = 0;
  let totalCotisations = 0;
  let nbSalaries = 0;
  let totalAssiette = 0;
  let totalRetenu = 0;

  if (kind === "DIPE") {
    const lignes: DipeLigneSalarie[] = bulletins.map((b: BulletinRow) => {
      const emp = empById.get(b.employee_id);
      const baseCnps = Math.min(Number(b.fiscal_gross ?? b.salaire_brut), REFORME_2026.cnps.plafond_mensuel);
      const cnpsSal = Math.round(baseCnps * REFORME_2026.cnps.retraite_salarie);
      const cnpsPat = Math.round(baseCnps * REFORME_2026.cnps.retraite_patronal);
      const familiales = Math.round(Number(b.salaire_brut) * REFORME_2026.cnps.familiales_patronal);
      const maternite = Math.round(Number(b.salaire_brut) * REFORME_2026.cnps.maternite_patronal);
      const atMp = Math.round(Number(b.salaire_brut) * tauxAtMp);
      const cmuSal = REFORME_2026.cnps.cmu_forfait_mensuel;
      const cmuPat = REFORME_2026.cnps.cmu_forfait_mensuel;

      totalBrut += Number(b.salaire_brut);
      totalCotisations += cnpsSal + cnpsPat + familiales + maternite + atMp + cmuSal + cmuPat;
      nbSalaries++;

      return {
        matricule: emp?.matricule ?? "",
        num_cnps: emp?.num_cnps ?? null,
        full_name: emp?.full_name ?? "",
        salaire_brut: Number(b.salaire_brut),
        salaire_imposable: Number(b.fiscal_gross ?? b.salaire_brut),
        base_cnps: baseCnps,
        cnps_retraite_salarie: cnpsSal,
        cnps_retraite_patronal: cnpsPat,
        cnps_familiales: familiales,
        cnps_maternite: maternite,
        cnps_at_mp: atMp,
        cmu_salarie: cmuSal,
        cmu_patronal: cmuPat,
      };
    });

    csv = generateDipeCsv({
      periode,
      numero_cnps_employeur: company?.cnps_matricule ?? null,
      raison_sociale: company?.raison_sociale ?? company?.name ?? "Entreprise",
      ncc: company?.ncc ?? null,
      lignes,
    });
  } else if (kind === "DISA" || kind === "DASC") {
    // Annuel : agrège les bulletins par employé pour l'année
    const aggByEmp = new Map<string, { brut: number; cnps_sal: number; cnps_pat: number; jours: number }>();
    for (const b of bulletins as BulletinRow[]) {
      const cur = aggByEmp.get(b.employee_id) || { brut: 0, cnps_sal: 0, cnps_pat: 0, jours: 0 };
      const brut = Number(b.salaire_brut);
      const baseCnps = Math.min(Number(b.fiscal_gross ?? brut), REFORME_2026.cnps.plafond_mensuel);
      cur.brut += brut;
      cur.cnps_sal += Math.round(baseCnps * REFORME_2026.cnps.retraite_salarie);
      cur.cnps_pat += Math.round(baseCnps * REFORME_2026.cnps.retraite_patronal);
      cur.jours += 22; // 22 jours ouvrables / mois
      aggByEmp.set(b.employee_id, cur);
    }

    const lignes: DisaLigneSalarie[] = Array.from(aggByEmp.entries()).map(([empId, agg]) => {
      const emp = empById.get(empId);
      totalBrut += agg.brut;
      totalCotisations += agg.cnps_sal + agg.cnps_pat;
      nbSalaries++;
      return {
        matricule: emp?.matricule ?? "",
        num_cnps: emp?.num_cnps ?? null,
        full_name: emp?.full_name ?? "",
        date_naissance: emp?.date_naissance ?? null,
        date_embauche: emp?.date_embauche ?? null,
        date_sortie: null,
        total_brut_annuel: agg.brut,
        total_cnps_salarie: agg.cnps_sal,
        total_cnps_patronal: agg.cnps_pat,
        jours_travailles: agg.jours,
      };
    });

    csv = generateDisaCsv({
      annee: periode,
      numero_cnps_employeur: company?.cnps_matricule ?? null,
      raison_sociale: company?.raison_sociale ?? company?.name ?? "Entreprise",
      ncc: company?.ncc ?? null,
      lignes,
    });
  } else {
    // ITS_MENSUEL ou ITS_ANNUEL
    const lignes = bulletins.map((b: BulletinRow) => {
      const emp = empById.get(b.employee_id);
      const brutImposable = Number(b.fiscal_gross ?? b.salaire_brut) - Number(b.prime_transport ?? 0);
      const cnpsRetraite = Math.round(
        Math.min(brutImposable, REFORME_2026.cnps.plafond_mensuel) *
          REFORME_2026.cnps.retraite_salarie
      );
      const ligne = buildItsLineFromBulletin({
        matricule: emp?.matricule ?? "",
        full_name: emp?.full_name ?? "",
        ncc_employe: null,
        brut_imposable: brutImposable,
        cnps_retraite: cnpsRetraite,
      });
      totalAssiette += brutImposable;
      totalRetenu += ligne.its + ligne.contribution_nationale;
      nbSalaries++;
      return ligne;
    });

    csv = generateItsCsv({
      periode,
      ncc_employeur: company?.ncc ?? null,
      raison_sociale: company?.raison_sociale ?? company?.name ?? "Entreprise",
      lignes,
    });
  }

  const deadline = computeDeadline(kind, periode);
  const totalDu = isSocial ? totalCotisations : totalRetenu;
  const penalty = computePenaltyCnps(totalDu, deadline);

  // Upsert en base
  const table = isSocial ? "social_declarations" : "tax_declarations";
  const insertData = isSocial
    ? {
        company_id: companyId as string,
        kind,
        periode,
        statut: "genere" as const,
        deadline: deadline.toISOString().slice(0, 10),
        date_generation: new Date().toISOString(),
        total_brut: totalBrut,
        total_cotisations: totalCotisations,
        nb_salaries: nbSalaries,
        penalite_calculee: penalty,
        details: { generated_lines: nbSalaries },
        created_by: user.id,
      }
    : {
        company_id: companyId as string,
        kind,
        periode,
        statut: "genere" as const,
        deadline: deadline.toISOString().slice(0, 10),
        date_generation: new Date().toISOString(),
        total_assiette: totalAssiette,
        total_retenu: totalRetenu,
        nb_salaries: nbSalaries,
        penalite_calculee: penalty,
        details: { generated_lines: nbSalaries },
        created_by: user.id,
      };

  const { data: declaration, error: insErr } = await supabase
    .from(table)
    .upsert(insertData, { onConflict: "company_id,kind,periode" })
    .select()
    .single();

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  // Audit
  await supabase.from("declaration_events").insert({
    company_id: companyId as string,
    kind: isSocial ? "social" : "tax",
    declaration_id: declaration.id,
    event: "GENERATED",
    metadata: { periode, kind, nb_salaries: nbSalaries },
    user_id: user.id,
  });

  // Retour CSV en téléchargement direct
  const filename = `${kind}_${periode}_${(company?.cnps_matricule ?? "").replace(/\s/g, "")}.csv`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Declaration-Id": declaration.id,
      "X-Total-Du": String(totalDu),
      "X-Penalty": String(penalty),
    },
  });
}
