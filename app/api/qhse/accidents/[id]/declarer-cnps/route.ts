import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

interface DeclarationBody {
  numero_cnps?: string | null;
  document_declaration_url?: string | null;
}

/**
 * POST /api/qhse/accidents/[id]/declarer-cnps
 *
 * Marque l'accident comme déclaré à la CNPS et trace l'horodatage —
 * obligation Art. 47 CT-CI : déclaration sous 48 heures.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: DeclarationBody = {};
  try {
    const json = (await req.json()) as DeclarationBody;
    body = json ?? {};
  } catch {
    body = {};
  }

  const { data, error } = await supabase
    .from("work_accidents")
    .update({
      statut_cnps: "declare",
      date_declaration_cnps: new Date().toISOString(),
      numero_cnps: body.numero_cnps ?? undefined,
      document_declaration_url: body.document_declaration_url ?? undefined,
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit (non bloquant)
  await logAuditEvent({
    action: "update",
    entity_type: "work_accidents",
    entity_id: params.id,
    details: {
      statut: "declare",
      numero_cnps: body.numero_cnps,
      document_url: body.document_declaration_url
    }
  });

  return NextResponse.json(data);
}
