import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildDefaultChecklist } from "@/lib/onboarding-template";

export const dynamic = "force-dynamic";

// Endpoint PUBLIC : le candidat signe son contrat via /signer/[id].
// À la signature : preuve stockée → candidat « embauche » → fiche employé créée
// (avec onboarding, événement de carrière et contrat), en miroir de /api/employees.
const BUCKET = "rh-documents";
const CONTRAT_ENUM = new Set(["CDI", "CDD", "Stage", "Apprentissage"]);

const schema = z.object({
  candidate_id: z.string().uuid("Candidat invalide"),
  signature: z.string().startsWith("data:image/png;base64,", "Signature invalide"),
});

// Matricule séquentiel par entreprise : CI-{année}-{NNN}
async function nextMatricule(admin: ReturnType<typeof createAdminClient>, companyId: string): Promise<string> {
  const prefix = `CI-${new Date().getFullYear()}-`;
  const { data } = await admin
    .from("employees")
    .select("matricule")
    .eq("company_id", companyId)
    .like("matricule", `${prefix}%`)
    .order("matricule", { ascending: false })
    .limit(1);
  let next = 1;
  if (data && data.length > 0) {
    const last = parseInt(String(data[0].matricule).replace(prefix, ""), 10);
    if (!isNaN(last)) next = last + 1;
  }
  return `${prefix}${String(next).padStart(3, "0")}`;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: candidate } = await admin
    .from("candidates")
    .select("id, company_id, full_name, email, phone, statut, notes_rh, job_id")
    .eq("id", parsed.data.candidate_id)
    .single();

  if (!candidate) {
    return NextResponse.json({ error: "Candidat introuvable" }, { status: 404 });
  }
  if (candidate.statut === "embauche") {
    return NextResponse.json({ error: "Contrat déjà signé" }, { status: 409 });
  }

  // Décodage du PNG (data URL → binaire) et stockage de la preuve.
  const base64 = parsed.data.signature.split(",")[1] ?? "";
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length === 0 || bytes.length > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  const signedAt = new Date();
  const dateStr = signedAt.toISOString().slice(0, 10); // YYYY-MM-DD
  const path = `contrats/${candidate.company_id}/${candidate.id}/signature_${signedAt.getTime()}.png`;
  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: "image/png", upsert: false });
  if (upErr) {
    return NextResponse.json({ error: "Échec de l'enregistrement de la signature" }, { status: 500 });
  }
  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);

  const note = `✍️ Contrat signé le ${signedAt.toLocaleDateString("fr-CI")} — ${urlData.publicUrl}`;
  const notes = candidate.notes_rh ? `${candidate.notes_rh}\n${note}` : note;

  const { error: updErr } = await admin
    .from("candidates")
    .update({ statut: "embauche", notes_rh: notes })
    .eq("id", candidate.id);
  if (updErr) {
    return NextResponse.json({ error: "Mise à jour impossible" }, { status: 500 });
  }

  // ── Création de la fiche employé (best-effort : la signature reste valide même si un
  //    effet de bord échoue ; on n'annule pas ce qui est déjà engagé). ────────────────
  let employeeId: string | null = null;
  let employeeWarning: string | null = null;
  try {
    // Idempotence : ne pas dupliquer si un employé existe déjà pour cet email.
    let exists = null;
    if (candidate.email) {
      const { data: dup } = await admin
        .from("employees")
        .select("id")
        .eq("company_id", candidate.company_id)
        .eq("email", candidate.email)
        .maybeSingle();
      exists = dup;
    }

    if (exists) {
      employeeId = exists.id;
    } else {
      const { data: job } = candidate.job_id
        ? await admin
            .from("job_postings")
            .select("titre, type_contrat, salaire_min")
            .eq("id", candidate.job_id)
            .single()
        : { data: null };

      const poste = job?.titre ?? "Poste à définir";
      const typeContrat =
        job?.type_contrat && CONTRAT_ENUM.has(job.type_contrat) ? job.type_contrat : null;
      const salaireBrut = job?.salaire_min ?? null;
      const matricule = await nextMatricule(admin, candidate.company_id);

      const { data: emp, error: empErr } = await admin
        .from("employees")
        .insert({
          company_id: candidate.company_id,
          full_name: candidate.full_name,
          matricule,
          poste,
          date_embauche: dateStr,
          email: candidate.email ?? null,
          phone: candidate.phone ?? null,
          type_contrat: typeContrat,
          salaire_brut: salaireBrut,
          statut: "actif",
        })
        .select("id")
        .single();

      if (empErr || !emp) {
        employeeWarning = "Fiche employé non créée automatiquement (à créer manuellement).";
      } else {
        employeeId = emp.id;
        // Effets de bord miroir de /api/employees (non bloquants).
        await admin.from("onboarding_checklists").insert({
          company_id: candidate.company_id,
          employee_id: emp.id,
          items: buildDefaultChecklist(),
        });
        await admin.from("career_events").insert({
          company_id: candidate.company_id,
          employee_id: emp.id,
          event_type: "embauche",
          date_event: dateStr,
          description: `Embauche : ${poste}${typeContrat ? ` (${typeContrat})` : ""} — via signature du contrat`,
          new_value: { poste, type_contrat: typeContrat, salaire_brut: salaireBrut },
        });
        if (typeContrat && salaireBrut != null && salaireBrut > 0) {
          await admin.from("contracts").insert({
            employee_id: emp.id,
            company_id: candidate.company_id,
            type_contrat: typeContrat,
            date_debut: dateStr,
            salaire_brut: salaireBrut,
            renouvellement_count: 0,
            statut: "actif",
          });
        }
      }
    }
  } catch {
    employeeWarning = "Fiche employé non créée automatiquement (à créer manuellement).";
  }

  return NextResponse.json({ ok: true, employee_id: employeeId, warning: employeeWarning }, { status: 201 });
}
