import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  matricule: z.string().min(1).max(20).optional(),
  poste: z.string().min(2).max(100).optional(),
  date_embauche: z.string().optional(),
  genre: z.enum(["M", "F"]).nullable().optional(),
  date_naissance: z.string().nullable().optional(),
  departement: z.string().max(100).nullable().optional(),
  email: z.string().email("Email invalide").nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  type_contrat: z.enum(["CDI", "CDD", "Stage", "Apprentissage"]).nullable().optional(),
  salaire_brut: z.coerce.number().min(0).nullable().optional(),
  statut: z.enum(["actif", "inactif", "suspendu"]).optional(),
  civilite: z.string().max(10).nullable().optional(),
  nationalite: z.string().max(100).nullable().optional(),
  etat_civil: z.string().max(30).nullable().optional(),
  nb_enfants: z.coerce.number().int().min(0).nullable().optional(),
  niveau_etude: z.string().max(50).nullable().optional(),
  categorie: z.string().max(60).nullable().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("employees")
    .update(parsed.data)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Archivage (soft delete) — statut inactif
  const { error } = await supabase
    .from("employees")
    .update({ statut: "inactif" })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
