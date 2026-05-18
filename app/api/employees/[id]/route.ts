import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit";

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
  photo_url: z.string().url("URL photo invalide").max(1000).nullable().optional(),
  sursalaire:           z.coerce.number().min(0).nullable().optional(),
  prime_exceptionnelle: z.coerce.number().min(0).nullable().optional(),
  prime_salissure:      z.coerce.number().min(0).nullable().optional(),
  prime_depassement:    z.coerce.number().min(0).nullable().optional(),
  prime_fonction:       z.coerce.number().min(0).nullable().optional(),
  prime_transport:      z.coerce.number().min(0).nullable().optional(),
  motif_modification:   z.string().max(255).nullable().optional(),
  // Nouveaux champs
  lieu_naissance:         z.string().max(100).nullable().optional(),
  num_cni:                z.string().max(30).nullable().optional(),
  date_expiration_cni:    z.string().nullable().optional(),
  adresse:                z.string().max(255).nullable().optional(),
  situation_logement:     z.string().max(30).nullable().optional(),
  rib:                    z.string().max(50).nullable().optional(),
  mobile_money:           z.string().max(30).nullable().optional(),
  contact_urgence_nom:    z.string().max(100).nullable().optional(),
  contact_urgence_tel:    z.string().max(20).nullable().optional(),
  anciennete_anterieure:  z.coerce.number().int().min(0).nullable().optional(),
  groupe_sanguin:         z.string().max(5).nullable().optional(),
  convention_collective:  z.string().max(100).nullable().optional(),
  site_travail:           z.string().max(100).nullable().optional(),
  nb_personnes_charge:    z.coerce.number().int().min(0).nullable().optional(),
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

  // Lire les valeurs actuelles avant mise à jour pour l'audit
  const { data: current } = await supabase
    .from("employees")
    .select("*")
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

  // AUDIT: Log employee update
  await logAuditEvent({
    action: "update",
    entity_type: "employee",
    entity_id: params.id,
    old_values: current || undefined,
    new_values: data,
    details: parsed.data.motif_modification ? { motif: parsed.data.motif_modification } : undefined
  });

  // Auto-création d'événements de carrière sur changements majeurs
  if (current && data) {
    const today = new Date().toISOString().slice(0, 10);
    const motif = parsed.data.motif_modification ?? null;
    type CareerEventInsert = {
      company_id: string;
      employee_id: string;
      event_type: string;
      date_event: string;
      description: string;
      old_value: Record<string, unknown> | null;
      new_value: Record<string, unknown> | null;
      created_by: string;
    };
    const events: CareerEventInsert[] = [];

    const pushEvent = (
      eventType: string,
      description: string,
      oldVal: Record<string, unknown>,
      newVal: Record<string, unknown>
    ) => {
      events.push({
        company_id: current.company_id,
        employee_id: params.id,
        event_type: eventType,
        date_event: today,
        description: motif ? `${description} — ${motif}` : description,
        old_value: oldVal,
        new_value: newVal,
        created_by: user.id,
      });
    };

    if (parsed.data.poste !== undefined && parsed.data.poste !== current.poste) {
      pushEvent(
        "changement_poste",
        `Changement de poste : ${current.poste ?? "—"} → ${parsed.data.poste}`,
        { poste: current.poste },
        { poste: parsed.data.poste }
      );
    }

    if (parsed.data.departement !== undefined && parsed.data.departement !== current.departement) {
      pushEvent(
        "mutation",
        `Mutation : ${current.departement ?? "—"} → ${parsed.data.departement ?? "—"}`,
        { departement: current.departement },
        { departement: parsed.data.departement }
      );
    }

    if (parsed.data.categorie !== undefined && parsed.data.categorie !== current.categorie) {
      pushEvent(
        "promotion",
        `Changement de catégorie : ${current.categorie ?? "—"} → ${parsed.data.categorie ?? "—"}`,
        { categorie: current.categorie },
        { categorie: parsed.data.categorie }
      );
    }

    if (
      parsed.data.salaire_brut !== undefined &&
      parsed.data.salaire_brut !== null &&
      Number(parsed.data.salaire_brut) !== Number(current.salaire_brut ?? 0)
    ) {
      const oldS = Number(current.salaire_brut ?? 0);
      const newS = Number(parsed.data.salaire_brut);
      pushEvent(
        "augmentation",
        `${newS >= oldS ? "Augmentation" : "Ajustement"} salaire : ${oldS.toLocaleString("fr-FR")} → ${newS.toLocaleString("fr-FR")} FCFA`,
        { salaire_brut: oldS },
        { salaire_brut: newS }
      );
    }

    if (events.length > 0) {
      // Insertion non bloquante : on log mais on ne fait pas échouer la requête
      await supabase.from("career_events").insert(events);
    }
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

  // AUDIT: Log employee archival
  await logAuditEvent({
    action: "archive",
    entity_type: "employee",
    entity_id: params.id,
    details: { status: "inactif" }
  });

  return NextResponse.json({ success: true });
}
