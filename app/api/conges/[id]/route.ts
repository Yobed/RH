import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  action: z.enum(["valider_manager", "valider_rh", "refuser"]),
  motif: z.string().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Action invalide", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { action, motif } = parsed.data;

  // Récupérer le congé existant — RLS garantit l'accès company_id
  const { data: conge, error: fetchError } = await supabase
    .from("conges")
    .select("id, statut, nb_jours, date_debut, employee_id, company_id")
    .eq("id", params.id)
    .single();

  if (fetchError || !conge) {
    return NextResponse.json({ error: "Congé introuvable" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const statut = conge.statut ?? "en_attente";

  // Machine à états
  type UpdatePayload = {
    statut: string;
    validated_by_manager_id?: string;
    validated_by_manager_at?: string;
    validated_by_rh_id?: string;
    validated_by_rh_at?: string;
    refus_motif?: string | null;
  };

  let updatePayload: UpdatePayload | null = null;

  if (action === "valider_manager" && statut === "en_attente") {
    updatePayload = {
      statut: "valide_manager",
      validated_by_manager_id: user.id,
      validated_by_manager_at: now,
    };
  } else if (action === "valider_rh" && statut === "valide_manager") {
    updatePayload = {
      statut: "approuve",
      validated_by_rh_id: user.id,
      validated_by_rh_at: now,
    };
  } else if (
    action === "refuser" &&
    (statut === "en_attente" || statut === "valide_manager")
  ) {
    updatePayload = {
      statut: "refuse",
      refus_motif: motif ?? null,
    };
  } else {
    return NextResponse.json(
      { error: "Transition de statut invalide" },
      { status: 400 }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("conges")
    .update(updatePayload)
    .eq("id", params.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Si approbation RH finale → mettre à jour leave_balances.jours_pris
  if (action === "valider_rh" && conge.nb_jours > 0) {
    const annee = new Date(conge.date_debut).getFullYear();

    const { data: balance } = await supabase
      .from("leave_balances")
      .select("id, jours_pris, jours_acquis")
      .eq("employee_id", conge.employee_id)
      .eq("company_id", conge.company_id)
      .eq("annee", annee)
      .single();

    if (balance) {
      await supabase
        .from("leave_balances")
        .update({
          jours_pris: balance.jours_pris + conge.nb_jours,
          updated_at: now,
        })
        .eq("id", balance.id);
    } else {
      // Créer un enregistrement minimal si absent
      await supabase.from("leave_balances").insert({
        employee_id: conge.employee_id,
        company_id: conge.company_id,
        annee,
        jours_acquis: 0,
        jours_pris: conge.nb_jours,
      });
    }
  }

  return NextResponse.json(updated);
}
