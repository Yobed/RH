import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePortailContext } from "@/lib/portail";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  type: z.enum(["annuel", "maladie", "maternite", "paternite", "sans_solde", "exceptionnel"]),
  date_debut: z.string().min(1),
  date_fin: z.string().min(1),
  nb_jours: z.coerce.number().positive(),
  commentaire: z.string().max(500).optional(),
});

export async function POST(req: Request): Promise<NextResponse> {
  const ctx = await requirePortailContext();
  const supabase = createServerClient();

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("conges")
    .insert({
      ...parsed.data,
      employee_id: ctx.employeeId,
      company_id: ctx.companyId,
      statut: "en_attente",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
