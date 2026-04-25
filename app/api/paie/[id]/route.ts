import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { calculerBulletinComplet } from "@/lib/paie-ci";

const statutSchema = z.object({
  statut: z.enum(["brouillon", "validé", "payé"]),
});

const editSchema = z.object({
  salaire_brut:         z.number().positive(),
  sursalaire:           z.number().min(0).default(0),
  prime_anciennete:     z.number().min(0).default(0),
  prime_exceptionnelle: z.number().min(0).default(0),
  prime_salissure:      z.number().min(0).default(0),
  prime_depassement:    z.number().min(0).default(0),
  prime_fonction:       z.number().min(0).default(0),
  prime_transport:      z.number().min(0).default(0),
  heures_sup_h15:       z.number().min(0).default(0),
  heures_sup_h50:       z.number().min(0).default(0),
  heures_sup_h75:       z.number().min(0).default(0),
  autres_retenues:      z.number().min(0).default(0),
  avances:              z.number().min(0).default(0),
  nb_jours_absence:     z.number().min(0).max(31).default(0),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("company_id").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const parsed = statutSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Statut invalide" }, { status: 400 });

  const { data, error } = await supabase
    .from("bulletins_paie")
    .update({ statut: parsed.data.statut })
    .eq("id", params.id)
    .eq("company_id", profile.company_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Seuls les brouillons sont modifiables
  const { data: existing } = await supabase
    .from("bulletins_paie")
    .select("statut, company_id")
    .eq("id", params.id)
    .single();

  if (!existing) return NextResponse.json({ error: "Bulletin introuvable" }, { status: 404 });
  if (existing.statut !== "brouillon")
    return NextResponse.json({ error: "Seuls les bulletins en brouillon peuvent être modifiés" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const parsed = editSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const d = parsed.data;
  const calc = calculerBulletinComplet({
    salaire_brut: d.salaire_brut,
    sursalaire: d.sursalaire,
    prime_anciennete: d.prime_anciennete,
    prime_exceptionnelle: d.prime_exceptionnelle,
    prime_salissure: d.prime_salissure,
    prime_depassement: d.prime_depassement,
    prime_fonction: d.prime_fonction,
    prime_transport: d.prime_transport,
    heures_sup: {
      h15: d.heures_sup_h15,
      h50: d.heures_sup_h50,
      h75: d.heures_sup_h75,
    },
    autres_retenues: d.autres_retenues,
    avances: d.avances,
    nb_jours_absence: d.nb_jours_absence,
  });

  const { data, error } = await supabase
    .from("bulletins_paie")
    .update({
      salaire_brut: d.salaire_brut,
      sursalaire: d.sursalaire,
      prime_anciennete: d.prime_anciennete,
      prime_exceptionnelle: d.prime_exceptionnelle,
      prime_salissure: d.prime_salissure,
      prime_depassement: d.prime_depassement,
      prime_fonction: d.prime_fonction,
      prime_transport: d.prime_transport,
      cnps_salarie: calc.cnps_salarie,
      its: calc.its,
      autres_retenues: d.autres_retenues,
      avances: d.avances,
      salaire_net: calc.salaire_net,
      details: {
        heures_sup: {
          h15: d.heures_sup_h15,
          h50: d.heures_sup_h50,
          h75: d.heures_sup_h75,
        },
        heures_sup_montant: calc.heures_sup_montant,
        nb_jours_absence: d.nb_jours_absence,
        retenu_absence: calc.retenu_absence,
      },
    })
    .eq("id", params.id)
    .eq("company_id", existing.company_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit : modification d'un bulletin de paie (non bloquant)
  await supabase.from("audit_logs").insert({
    action: "UPDATE_BULLETIN_STATUT",
    company_id: existing.company_id as string,
    user_id: user.id,
    resource: `bulletins_paie:${params.id}`,
  });

  return NextResponse.json(data);
}
