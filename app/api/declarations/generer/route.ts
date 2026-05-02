import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildDeclaration } from "../_builder";

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

/**
 * POST /api/declarations/generer
 * Construit la déclaration, l'archive en base et retourne le CSV en
 * téléchargement direct (Content-Disposition: attachment).
 */
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

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return NextResponse.json({ error: "Entreprise introuvable" }, { status: 403 });

  const result = await buildDeclaration(
    supabase,
    companyId as string,
    parsed.data.kind,
    parsed.data.periode
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  // Upsert en base
  const table = result.isSocial ? "social_declarations" : "tax_declarations";
  const insertData = result.isSocial
    ? {
        company_id: companyId as string,
        kind: result.kind,
        periode: result.periode,
        statut: "genere" as const,
        deadline: result.deadline.toISOString().slice(0, 10),
        date_generation: new Date().toISOString(),
        total_brut: result.totals.total_brut,
        total_cotisations: result.totals.total_cotisations,
        nb_salaries: result.totals.nb_salaries,
        penalite_calculee: result.totals.penalite,
        details: { generated_lines: result.totals.nb_salaries },
        created_by: user.id,
      }
    : {
        company_id: companyId as string,
        kind: result.kind,
        periode: result.periode,
        statut: "genere" as const,
        deadline: result.deadline.toISOString().slice(0, 10),
        date_generation: new Date().toISOString(),
        total_assiette: result.totals.total_assiette,
        total_retenu: result.totals.total_retenu,
        nb_salaries: result.totals.nb_salaries,
        penalite_calculee: result.totals.penalite,
        details: { generated_lines: result.totals.nb_salaries },
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

  await supabase.from("declaration_events").insert({
    company_id: companyId as string,
    kind: result.isSocial ? "social" : "tax",
    declaration_id: declaration.id,
    event: "GENERATED",
    metadata: {
      periode: result.periode,
      kind: result.kind,
      nb_salaries: result.totals.nb_salaries,
    },
    user_id: user.id,
  });

  const filename = `${result.kind}_${result.periode}_${(
    result.company.cnps_matricule ?? ""
  ).replace(/\s/g, "")}.csv`;

  return new NextResponse(result.csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Declaration-Id": declaration.id,
      "X-Total-Du": String(result.totals.total_du),
      "X-Penalty": String(result.totals.penalite),
    },
  });
}
