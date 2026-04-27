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
  sursalaire:           z.coerce.number().min(0).nullable().optional(),
  prime_exceptionnelle: z.coerce.number().min(0).nullable().optional(),
  prime_salissure:      z.coerce.number().min(0).nullable().optional(),
  prime_depassement:    z.coerce.number().min(0).nullable().optional(),
  prime_fonction:       z.coerce.number().min(0).nullable().optional(),
  prime_transport:      z.coerce.number().min(0).nullable().optional(),
  motif_modification:   z.string().max(255).nullable().optional(),
});

const SALARY_FIELDS = [
  "salaire_brut", "sursalaire", "prime_exceptionnelle",
  "prime_salissure", "prime_depassement", "prime_fonction", "prime_transport",
] as const;

type SalarySnapshot = {
  company_id: string;
  salaire_brut: number | null;
  sursalaire: number | null;
  prime_exceptionnelle: number | null;
  prime_salissure: number | null;
  prime_depassement: number | null;
  prime_fonction: number | null;
  prime_transport: number | null;
};

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

  // Lire les valeurs salariales actuelles avant mise à jour
  const { data: current } = await supabase
    .from("employees")
    .select("company_id, salaire_brut, sursalaire, prime_exceptionnelle, prime_salissure, prime_depassement, prime_fonction, prime_transport")
    .eq("id", params.id)
    .limit(1)
    .maybeSingle();

  // Si au moins un champ salaire a changé → archiver l'ancienne situation
  if (current) {
    const snap = current as SalarySnapshot;
    const changed = SALARY_FIELDS.some(
      (f) => parsed.data[f] !== undefined && Number(parsed.data[f]) !== Number(snap[f] ?? 0)
    );
    if (changed) {
      await supabase.from("employee_salary_history").insert({
        company_id: snap.company_id,
        employee_id: params.id,
        date_effet: new Date().toISOString().slice(0, 10),
        salaire_brut: snap.salaire_brut,
        sursalaire: snap.sursalaire ?? 0,
        prime_exceptionnelle: snap.prime_exceptionnelle ?? 0,
        prime_salissure: snap.prime_salissure ?? 0,
        prime_depassement: snap.prime_depassement ?? 0,
        prime_fonction: snap.prime_fonction ?? 0,
        prime_transport: snap.prime_transport ?? 0,
        motif: parsed.data.motif_modification ?? "Modification manuelle",
      });
    }
  }

  // Ne pas stocker motif_modification dans la table employees
  const { motif_modification: _motif, ...updateData } = parsed.data;

  const { data, error } = await supabase
    .from("employees")
    .update(updateData)
    .eq("id", params.id)
    .select()
    .limit(1)
    .maybeSingle();

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
