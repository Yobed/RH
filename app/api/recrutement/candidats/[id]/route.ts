import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit";

const schema = z.object({
  statut: z.enum(["nouveau", "en_cours", "shortlist", "entretien", "offre", "embauche", "refus"]),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  // Récupérer l'ancienne version pour l'audit
  const { data: oldData } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", params.id)
    .single();

  const { data, error } = await supabase
    .from("candidates")
    .update({ statut: parsed.data.statut })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // AUDIT
  await logAuditEvent({
    action: "update",
    entity_type: "candidate",
    entity_id: params.id,
    old_values: oldData || undefined,
    new_values: data,
  });
  return NextResponse.json(data);
}
