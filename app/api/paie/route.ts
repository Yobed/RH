import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { calculerBulletinComplet } from "@/lib/paie-ci";

export const dynamic = 'force-dynamic';

const schema = z.object({
  employee_id: z.string().uuid("Employé requis"),
  periode: z.string().regex(/^\d{4}-\d{2}$/, "Format YYYY-MM requis"),
  salaire_brut: z.number().positive("Salaire brut requis"),          // Ligne 01 — Salaire catégoriel
  sursalaire: z.number().min(0).default(0),                          // Ligne 02 — Sursalaire
  prime_anciennete: z.number().min(0).default(0),                    // Ligne 03 — Auto calculé
  prime_exceptionnelle: z.number().min(0).default(0),                // Ligne 04
  prime_salissure: z.number().min(0).default(0),                     // Ligne 05
  prime_depassement: z.number().min(0).default(0),                   // Ligne 06
  prime_fonction: z.number().min(0).default(0),                      // Ligne 07
  prime_transport: z.number().min(0).default(0),                     // Ligne 08 — Non imposable
  heures_sup_h15: z.number().min(0).default(0),
  heures_sup_h50: z.number().min(0).default(0),
  heures_sup_h75: z.number().min(0).default(0),
  autres_retenues: z.number().min(0).default(0),
  avances: z.number().min(0).default(0),
  nb_jours_absence: z.number().min(0).max(31).default(0),
});

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("bulletins_paie")
    .select(`id, periode, salaire_brut, cnps_salarie, its, autres_retenues, avances, salaire_net, statut, created_at,
             employees(full_name, poste, matricule)`)
    .order("periode", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
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

  const { data: profile } = await supabase
    .from("profiles").select("company_id").eq("id", user.id).limit(1).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 403 });

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
    .insert({
      company_id: profile.company_id,
      employee_id: d.employee_id,
      periode: d.periode,
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
          h75: d.heures_sup_h75
        },
        heures_sup_montant: calc.heures_sup_montant,
        nb_jours_absence: d.nb_jours_absence,
        retenu_absence: calc.retenu_absence,
      }
    })
    .select()
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === "23505")
      return NextResponse.json({ error: "Un bulletin existe déjà pour cet employé et cette période" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit : création d'un bulletin de paie (non bloquant)
  if (data?.id) {
    await supabase.from("audit_logs").insert({
      action: "CREATE_BULLETIN",
      company_id: profile.company_id as string,
      user_id: user.id,
      resource: `bulletins_paie:${data.id}`,
    });
  }

  return NextResponse.json(data, { status: 201 });
}

