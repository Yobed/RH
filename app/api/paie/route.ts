import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { calculerITS, TAUX_CNPS_RETRAITE_SALARIE, PLAFOND_CNPS_MENSUEL, CMU_MENSUEL } from "@/lib/paie-ci";

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
  autres_retenues: z.number().min(0).default(0),
  avances: z.number().min(0).default(0),
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
    .from("profiles").select("company_id").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 403 });

  const d = parsed.data;

  // Total imposable (transport exclu — non assujetti ITS/CNPS)
  const total_imposable =
    d.salaire_brut +
    d.sursalaire +
    d.prime_anciennete +
    d.prime_exceptionnelle +
    d.prime_salissure +
    d.prime_depassement +
    d.prime_fonction;

  // Total gains = imposable + transport
  const total_gains = total_imposable + d.prime_transport;

  // CNPS salariale
  const base_cnps = Math.min(total_imposable, PLAFOND_CNPS_MENSUEL);
  const cnps_retraite = Math.round(base_cnps * TAUX_CNPS_RETRAITE_SALARIE);
  const cmu_sal = CMU_MENSUEL;
  const cnps_salarie = cnps_retraite + cmu_sal;

  // ITS
  const abattement = Math.round(total_imposable * 0.15);
  const base_its = Math.max(0, total_imposable - cnps_retraite - abattement);
  const its = calculerITS(base_its);

  // Net à payer
  const salaire_net = Math.max(
    0,
    total_gains - cnps_salarie - its - d.autres_retenues - d.avances
  );

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
      cnps_salarie,
      its,
      autres_retenues: d.autres_retenues,
      avances: d.avances,
      salaire_net,
    })
    .select()
    .single();

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
