import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = 'force-dynamic';

const contractSchema = z
  .object({
    employee_id: z.string().uuid("Employé obligatoire"),
    type_contrat: z.enum(["CDI", "CDD", "Stage", "Apprentissage"]),
    date_debut: z.string().min(1, "Date de début obligatoire"),
    date_fin: z.string().nullable().optional(),
    date_fin_essai: z.string().nullable().optional(),
    salaire_brut: z.coerce.number().min(0, "Salaire invalide"),
    renouvellement_count: z.coerce.number().int().min(0).default(0),
    // Nouveaux champs
    lieu_travail:           z.string().max(150).nullable().optional(),
    duree_hebdo:            z.coerce.number().min(0).max(60).default(40),
    description_poste:      z.string().nullable().optional(),
    convention_collective:  z.string().max(100).nullable().optional(),
    clause_non_concurrence: z.boolean().default(false),
    clause_confidentialite: z.boolean().default(false),
    avantages_nature:       z.string().nullable().optional(),
    motif_cdd:              z.string().nullable().optional(),
    signataire_nom:         z.string().max(100).nullable().optional(),
    date_signature:         z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (["CDD", "Stage", "Apprentissage"].includes(data.type_contrat)) {
        return !!data.date_fin;
      }
      return true;
    },
    {
      message: "Date de fin obligatoire pour CDD, Stage et Apprentissage",
      path: ["date_fin"],
    }
  );

export async function POST(req: Request) {
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

  const parsed = contractSchema.safeParse(body);
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

  // Vérification règles CDD ivoiriennes (Art. 14-15 CT-CI)
  if (parsed.data.type_contrat === "CDD") {
    // 1. Plafond 2 renouvellements (3 contrats CDD max sur le même employé)
    const { count } = await supabase
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", parsed.data.employee_id)
      .eq("type_contrat", "CDD");

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        {
          error:
            "Conversion CDI obligatoire. Cet employé a déjà atteint le maximum de 2 renouvellements CDD (Art. 15 CT-CI).",
        },
        { status: 422 }
      );
    }

    // 2. Plafond cumulé 24 mois — calculé via fonction Postgres
    const newDuration =
      parsed.data.date_fin && parsed.data.date_debut
        ? Math.max(
            0,
            (new Date(parsed.data.date_fin).getTime() -
              new Date(parsed.data.date_debut).getTime()) /
              (30.44 * 24 * 60 * 60 * 1000)
          )
        : 0;

    const { data: cumulMonths } = await supabase.rpc("get_cdd_cumul_months", {
      p_employee_id: parsed.data.employee_id,
    });
    const totalCumul = (Number(cumulMonths) || 0) + newDuration;

    if (totalCumul > 24) {
      return NextResponse.json(
        {
          error: `Le cumul des CDD pour cet employé atteindrait ${totalCumul.toFixed(1)} mois. Plafond légal : 24 mois (Art. 14 CT-CI). Conversion CDI requise.`,
        },
        { status: 422 }
      );
    }

    // 3. Motif obligatoire pour CDD
    if (!parsed.data.motif_cdd || parsed.data.motif_cdd.trim().length < 5) {
      return NextResponse.json(
        {
          error:
            "Le motif du CDD est obligatoire et doit être détaillé (Art. 14.2 CT-CI : remplacement, surcroît, saisonnier…).",
        },
        { status: 422 }
      );
    }
  }

  const { data, error } = await supabase
    .from("contracts")
    .insert({
      ...parsed.data,
      company_id: companyId as string,
      statut: "actif",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit Log
  await logAuditEvent({
    entity_type: "contract",
    entity_id: data.id,
    action: "create",
    details: {
      employee_id: parsed.data.employee_id,
      type_contrat: parsed.data.type_contrat,
      salaire_brut: parsed.data.salaire_brut
    },
    new_values: data
  });

  return NextResponse.json(data, { status: 201 });
}

