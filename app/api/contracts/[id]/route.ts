import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit";

const updateSchema = z
  .object({
    type_contrat: z.enum(["CDI", "CDD", "Stage", "Apprentissage"]).optional(),
    date_debut: z.string().min(1).optional(),
    date_fin: z.string().nullable().optional(),
    date_fin_essai: z.string().nullable().optional(),
    salaire_brut: z.coerce.number().min(0).optional(),
    renouvellement_count: z.coerce.number().int().min(0).optional(),
    statut: z.enum(["actif", "terminé", "suspendu"]).optional(),
    // Nouveaux champs
    lieu_travail:           z.string().max(150).nullable().optional(),
    duree_hebdo:            z.coerce.number().min(0).max(60).optional(),
    description_poste:      z.string().nullable().optional(),
    convention_collective:  z.string().max(100).nullable().optional(),
    clause_non_concurrence: z.boolean().optional(),
    clause_confidentialite: z.boolean().optional(),
    avantages_nature:       z.string().nullable().optional(),
    motif_cdd:              z.string().nullable().optional(),
    signataire_nom:         z.string().max(100).nullable().optional(),
    date_signature:         z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.date_fin && data.date_debut && data.date_fin <= data.date_debut) {
      ctx.addIssue({
        code: "custom",
        message: "La date de fin doit être après la date de début",
        path: ["date_fin"],
      });
    }
    if (data.date_fin_essai) {
      if (data.date_debut && data.date_fin_essai < data.date_debut) {
        ctx.addIssue({
          code: "custom",
          message: "La fin d'essai ne peut pas être avant la date de début",
          path: ["date_fin_essai"],
        });
      }
      if (data.date_fin && data.date_fin_essai > data.date_fin) {
        ctx.addIssue({
          code: "custom",
          message: "La fin d'essai dépasse la date de fin du contrat",
          path: ["date_fin_essai"],
        });
      }
    }
  });

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data: companyId, error: companyError } = await supabase.rpc("get_user_company_id");
  if (companyError || !companyId) {
    return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 403 });
  }

  // Get old values for audit
  const { data: oldData } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", params.id)
    .single();

  const { data, error } = await supabase
    .from("contracts")
    .update(parsed.data)
    .eq("id", params.id)
    .eq("company_id", companyId as string)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit Log
  await logAuditEvent({
    entity_type: "contract",
    entity_id: params.id,
    action: "update",
    details: { updated_fields: Object.keys(parsed.data) },
    old_values: oldData ?? undefined,
    new_values: data
  });

  return NextResponse.json(data);
}
