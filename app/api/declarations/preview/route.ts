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
 * POST /api/declarations/preview
 * Retourne le contenu de la déclaration en JSON (colonnes + lignes + totaux)
 * SANS écrire en base ni générer de CSV. Permet la prévisualisation avant
 * confirmation de la génération.
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

  const result = await buildDeclaration(supabase, companyId as string, parsed.data.kind, parsed.data.periode);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  // On ne renvoie pas le CSV au preview pour réduire la charge
  return NextResponse.json({
    kind: result.kind,
    periode: result.periode,
    deadline: result.deadline.toISOString(),
    isSocial: result.isSocial,
    company: result.company,
    totals: result.totals,
    columns: result.columns,
    rows: result.rows,
  });
}
