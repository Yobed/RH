import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  kind_class: z.enum(["social", "tax"]),
  numero_recepisse: z.string().min(1).max(80),
  fichier_url: z.string().url().nullable().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
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

  const table = parsed.data.kind_class === "social" ? "social_declarations" : "tax_declarations";

  const { data, error } = await supabase
    .from(table)
    .update({
      statut: "soumis",
      date_soumission: new Date().toISOString(),
      numero_recepisse: parsed.data.numero_recepisse,
      fichier_url: parsed.data.fichier_url ?? null,
    })
    .eq("id", params.id)
    .eq("company_id", companyId as string)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("declaration_events").insert({
    company_id: companyId as string,
    kind: parsed.data.kind_class,
    declaration_id: params.id,
    event: "SUBMITTED",
    metadata: { numero_recepisse: parsed.data.numero_recepisse },
    user_id: user.id,
  });

  return NextResponse.json(data);
}
