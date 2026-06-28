import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit";

const schema = z.object({
  statut: z.enum(["actif", "inactif", "suspendu"]),
});

// Changement de statut minimal et robuste (réactivation / suspension / archivage).
// Calqué sur l'archivage (DELETE) qui fonctionne : un simple UPDATE + audit.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const { error } = await supabase
    .from("employees")
    .update({ statut: parsed.data.statut })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAuditEvent({
    action: "update",
    entity_type: "employee",
    entity_id: params.id,
    details: { statut: parsed.data.statut },
  });

  return NextResponse.json({ success: true, statut: parsed.data.statut });
}
