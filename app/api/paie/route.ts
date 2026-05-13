import { createServerClient } from "@/lib/supabase/server";
import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { calculerBulletinComplet } from "@/lib/paie-ci";
import { logAuditEvent } from "@/lib/audit";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

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
  vacation_allowance: z.number().min(0).default(0),                  // Indemnité congés payés — Sage
  prime_logement: z.number().min(0).default(0),                      // Prime de logement — exonérée
  prime_responsabilite: z.number().min(0).default(0),                // Prime de responsabilité — imposable
  remboursement_frais: z.number().min(0).default(0),                 // Remboursement frais — exonéré
  heures_normales: z.number().min(0).default(173.33),
  heures_sup_h15: z.number().min(0).default(0),
  heures_sup_h50: z.number().min(0).default(0),
  heures_sup_h75: z.number().min(0).default(0),
  heures_nuit: z.number().min(0).default(0),       // Heures de nuit (21h–5h) — majoration 75%
  heures_dimanche: z.number().min(0).default(0),   // Heures dimanche — majoration 75%
  heures_ferie: z.number().min(0).default(0),      // Heures jours fériés — majoration 75%
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

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, { limit: 20, windowMs: 60_000, key: "bulletin-post" });
  if (!rl.success) return rateLimitResponse(rl.resetAt);

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

  // Récupérer la situation familiale pour le quotient familial ITS
  const { data: empFamille } = await supabase
    .from("employees")
    .select("etat_civil, nb_enfants")
    .eq("id", d.employee_id)
    .limit(1)
    .maybeSingle();

  // Récupérer les primes paramétrables du contrat (actives, dans leur fenêtre)
  const periodeFirstDay = `${d.periode}-01`;
  const { data: primesRows } = await supabase
    .from("contract_primes")
    .select("libelle, montant, imposable, actif, date_debut, date_fin")
    .eq("employee_id", d.employee_id)
    .eq("actif", true);

  const primes_contrat = (primesRows ?? [])
    .filter((p) => !p.date_debut || p.date_debut <= periodeFirstDay)
    .filter((p) => !p.date_fin || p.date_fin >= periodeFirstDay)
    .map((p) => ({
      libelle: p.libelle as string,
      montant: Number(p.montant) || 0,
      imposable: Boolean(p.imposable),
    }));

  const calc = calculerBulletinComplet({
    salaire_brut: d.salaire_brut,
    sursalaire: d.sursalaire,
    prime_anciennete: d.prime_anciennete,
    prime_exceptionnelle: d.prime_exceptionnelle,
    prime_salissure: d.prime_salissure,
    prime_depassement: d.prime_depassement,
    prime_fonction: d.prime_fonction,
    prime_transport: d.prime_transport,
    vacation_allowance: d.vacation_allowance,
    prime_logement: d.prime_logement,
    prime_responsabilite: d.prime_responsabilite,
    remboursement_frais: d.remboursement_frais,
    heures_normales: d.heures_normales,
    heures_sup: {
      h15: d.heures_sup_h15,
      h50: d.heures_sup_h50,
      h75: d.heures_sup_h75,
    },
    heures_nuit: d.heures_nuit,
    heures_dimanche: d.heures_dimanche,
    heures_ferie: d.heures_ferie,
    autres_retenues: d.autres_retenues,
    avances: d.avances,
    nb_jours_absence: d.nb_jours_absence,
    etat_civil: empFamille?.etat_civil ?? null,
    nb_enfants: empFamille?.nb_enfants ?? null,
    primes_contrat,
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
      vacation_allowance: d.vacation_allowance,
      prime_logement: d.prime_logement,
      prime_responsabilite: d.prime_responsabilite,
      remboursement_frais: d.remboursement_frais,
      heures_normales: d.heures_normales,
      cnps_salarie: calc.cnps_salarie,
      its: calc.its,
      autres_retenues: d.autres_retenues,
      avances: d.avances,
      salaire_net: calc.salaire_net,
      // Colonnes Sage 22
      overtime_pay: calc.overtime_pay,
      gross_salary: calc.gross_salary,
      exempt_indemnity: calc.exempt_indemnity,
      fiscal_gross: calc.fiscal_gross,
      social_gross: calc.social_gross,
      tax_is: calc.tax_is,
      tax_cn: calc.tax_cn,
      tax_igr: calc.tax_igr,
      withholding_cnps: calc.withholding_cnps,
      total_contributions: calc.total_contributions,
      net_before_withholding: calc.net_before_withholding,
      net_to_pay: calc.net_to_pay,
      adjustment_m_minus_1: 0,
      negative_pay_adjustment: 0,
      negative_advance: d.avances,
      rounding_adjustment: 0,
      details: {
        heures_sup: {
          h15: d.heures_sup_h15,
          h50: d.heures_sup_h50,
          h75: d.heures_sup_h75,
          nuit: d.heures_nuit,
          dimanche: d.heures_dimanche,
          ferie: d.heures_ferie,
        },
        heures_sup_montant: calc.heures_sup_montant,
        nb_jours_absence: d.nb_jours_absence,
        retenu_absence: calc.retenu_absence,
        // Snapshot des primes paramétrables appliquées au bulletin
        primes_contrat,
        primes_imposables_total: calc.primes_imposables_total ?? 0,
        primes_non_imposables_total: calc.primes_non_imposables_total ?? 0,
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
    await logAuditEvent({
      action: "create",
      entity_type: "bulletin_paie",
      entity_id: data.id,
      details: { periode: d.periode },
      new_values: data,
    });
  }

  return NextResponse.json(data, { status: 201 });
}

