/**
 * Gestion formalisée des ruptures de contrat — Droit ivoirien
 *
 * Types pris en charge :
 *   - licenciement_faute_simple, licenciement_faute_grave, licenciement_economique
 *   - demission, rupture_conventionnelle
 *   - fin_cdd, fin_periode_essai, deces, depart_retraite
 *
 * Base légale : Art. 16-18 (CDD) / Art. 34, 73-76 (CDI) Code du Travail ivoirien
 *               Décret n°96-201 du 7 mars 1996 (indemnités de licenciement)
 */

import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { calculerSoldeDeCompte } from "@/lib/paie-ci";
import { logAuditEvent } from "@/lib/audit";
import { buildDefaultOffboardingChecklist } from "@/lib/offboarding-template";

export const dynamic = 'force-dynamic';

const ruptureSchema = z.object({
  type_rupture: z.enum([
    "licenciement_faute_simple",
    "licenciement_faute_grave",
    "licenciement_economique",
    "demission",
    "rupture_conventionnelle",
    "fin_cdd",
    "fin_periode_essai",
    "deces",
    "depart_retraite",
  ]),
  date_notification: z.string().min(1, "Date de notification obligatoire"),
  date_fin_preavis: z.string().nullable().optional(),
  date_sortie_effective: z.string().min(1, "Date de sortie obligatoire"),
  motif_detaille: z.string().max(2000).nullable().optional(),
  // Paramètres pour calcul STC
  jours_conges_restants: z.number().min(0).default(0),
  jours_preavis_non_effectues: z.number().min(0).int().default(0),
  salaire_moyen_12_mois: z.number().min(0).optional(),
  somme_salaires_bruts_cdd: z.number().min(0).optional(),
});

type Params = { params: { id: string } };

// GET — récupérer les ruptures d'un employé
export async function GET(_req: Request, { params }: Params) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("ruptures")
    .select("*")
    .eq("employee_id", params.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — créer une rupture + calculer le STC
export async function POST(req: Request, { params }: Params) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("company_id, role").eq("id", user.id).limit(1).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 403 });

  // Seuls RH et admin peuvent créer une rupture
  if (!["admin", "responsable_rh"].includes(profile.role)) {
    return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const parsed = ruptureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  // Récupérer les infos employé pour calcul STC
  const { data: emp, error: empErr } = await supabase
    .from("employees")
    .select("type_contrat, date_embauche, salaire_brut, statut")
    .eq("id", params.id)
    .limit(1)
    .maybeSingle();

  if (empErr || !emp) return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });

  const d = parsed.data;

  // Calcul ancienneté
  const dateEmbauche = emp.date_embauche ? new Date(emp.date_embauche) : null;
  const dateSortie = new Date(d.date_sortie_effective);
  const ancienneteAnnees = dateEmbauche
    ? (dateSortie.getTime() - dateEmbauche.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    : 0;

  const salaireMoyen = d.salaire_moyen_12_mois ?? (emp.salaire_brut ?? 0);
  const typeContrat: "CDD" | "CDI" = (emp.type_contrat === "CDD") ? "CDD" : "CDI";

  // Certaines ruptures n'ouvrent pas droit à l'indemnité de licenciement
  const aDroitIndemniteLicenciement = [
    "licenciement_faute_simple",
    "licenciement_economique",
    "rupture_conventionnelle",
    "depart_retraite",
  ].includes(d.type_rupture);

  const stc = calculerSoldeDeCompte({
    type_contrat: typeContrat,
    salaire_moyen_12_mois: aDroitIndemniteLicenciement ? salaireMoyen : 0,
    somme_salaires_bruts_cdd: d.somme_salaires_bruts_cdd,
    anciennete_annees: ancienneteAnnees,
    jours_conges_restants: d.jours_conges_restants,
    jours_preavis_non_effectues: d.jours_preavis_non_effectues,
    salaire_mensuel_actuel: emp.salaire_brut ?? 0,
  });

  const { data: rupture, error: insertErr } = await supabase
    .from("ruptures")
    .insert({
      company_id: profile.company_id,
      employee_id: params.id,
      type_rupture: d.type_rupture,
      date_notification: d.date_notification,
      date_fin_preavis: d.date_fin_preavis ?? null,
      date_sortie_effective: d.date_sortie_effective,
      motif_detaille: d.motif_detaille ?? null,
      anciennete_annees: Math.round(ancienneteAnnees * 100) / 100,
      jours_conges_restants: d.jours_conges_restants,
      jours_preavis_non_effectues: d.jours_preavis_non_effectues,
      salaire_moyen_12_mois: salaireMoyen,
      indemnite_licenciement: stc.indemnite_licenciement,
      indemnite_precarite: stc.indemnite_precarite,
      indemnite_compensatrice: stc.indemnite_compensatrice_conges,
      indemnite_preavis: stc.indemnite_preavis,
      total_stc: stc.total_brut_stc,
      statut: "brouillon",
      created_by: user.id,
    })
    .select()
    .limit(1)
    .maybeSingle();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Mettre le salarié en inactif si rupture définitive
  const rupturesDefinitives = [
    "licenciement_faute_simple", "licenciement_faute_grave", "licenciement_economique",
    "demission", "rupture_conventionnelle", "fin_cdd", "fin_periode_essai",
    "deces", "depart_retraite",
  ];
  if (rupturesDefinitives.includes(d.type_rupture)) {
    await supabase
      .from("employees")
      .update({ statut: "inactif" })
      .eq("id", params.id);
  }

  // Auto-création de la checklist d'offboarding si elle n'existe pas
  if (rupture?.id) {
    const { data: existingChecklist } = await supabase
      .from("offboarding_checklists")
      .select("id")
      .eq("employee_id", params.id)
      .limit(1)
      .maybeSingle();

    if (!existingChecklist) {
      await supabase.from("offboarding_checklists").insert({
        company_id: profile.company_id,
        employee_id: params.id,
        rupture_id: rupture.id,
        date_sortie_prevue: d.date_sortie_effective,
        items: buildDefaultOffboardingChecklist(),
      });
    } else {
      // Si checklist existe, on la lie à cette rupture
      await supabase
        .from("offboarding_checklists")
        .update({ rupture_id: rupture.id, date_sortie_prevue: d.date_sortie_effective })
        .eq("id", existingChecklist.id);
    }

    // Crée aussi un career_event "depart"
    await supabase.from("career_events").insert({
      company_id: profile.company_id,
      employee_id: params.id,
      event_type: "depart",
      date_event: d.date_sortie_effective,
      description: `Départ — ${d.type_rupture.replace(/_/g, " ")}`,
      new_value: { type_rupture: d.type_rupture, date_sortie: d.date_sortie_effective },
      created_by: user.id,
    });
  }

  await logAuditEvent({
    action: "create",
    entity_type: "ruptures",
    entity_id: rupture?.id,
    details: {
      employee_id: params.id,
      type_rupture: d.type_rupture,
      date_sortie: d.date_sortie_effective,
      total_stc: stc.total_brut_stc,
    },
  });

  return NextResponse.json({ rupture, stc }, { status: 201 });
}

// PATCH — mettre à jour le statut (brouillon → notifié → signé → soldé)
export async function PATCH(req: Request, { params }: Params) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const patchSchema = z.object({
    rupture_id: z.string().uuid(),
    statut: z.enum(["brouillon", "notifie", "signe", "solde"]),
    documents: z.array(z.unknown()).optional(),
  });

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ruptures")
    .update({ statut: parsed.data.statut, documents: parsed.data.documents, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.rupture_id)
    .eq("employee_id", params.id)
    .select()
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditEvent({
    action: "update",
    entity_type: "ruptures",
    entity_id: parsed.data.rupture_id,
    details: { statut: parsed.data.statut },
  });

  return NextResponse.json(data);
}
