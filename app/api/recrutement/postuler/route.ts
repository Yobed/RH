import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Endpoint PUBLIC (aucune auth) : réception des candidatures spontanées via le
// lien d'une offre. company_id est dérivé de l'offre, jamais de l'utilisateur.
const BUCKET = "rh-documents";
const MAX_CV_BYTES = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_CV_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const fieldsSchema = z.object({
  job_id: z.string().uuid("Offre invalide"),
  full_name: z.string().trim().min(2, "Nom obligatoire").max(100),
  email: z.string().trim().email("Email invalide"),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  // Honeypot : les bots remplissent ce champ caché → on accepte sans rien créer.
  if ((form.get("website") as string)?.trim()) {
    return NextResponse.json({ ok: true });
  }

  const parsed = fieldsSchema.safeParse({
    job_id: form.get("job_id"),
    full_name: form.get("full_name"),
    email: form.get("email"),
    phone: form.get("phone") ?? "",
    message: form.get("message") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const cv = form.get("cv");
  if (!(cv instanceof File) || cv.size === 0) {
    return NextResponse.json({ error: "CV obligatoire" }, { status: 400 });
  }
  if (cv.size > MAX_CV_BYTES) {
    return NextResponse.json({ error: "CV trop volumineux (max 5 Mo)" }, { status: 400 });
  }
  if (!ALLOWED_CV_TYPES.has(cv.type)) {
    return NextResponse.json({ error: "Format accepté : PDF, DOC ou DOCX" }, { status: 400 });
  }

  const admin = createAdminClient();

  // L'offre doit exister et être ouverte pour accepter des candidatures.
  const { data: job } = await admin
    .from("job_postings")
    .select("id, company_id, statut")
    .eq("id", parsed.data.job_id)
    .single();

  if (!job) {
    return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
  }
  if (job.statut !== "ouvert") {
    return NextResponse.json({ error: "Cette offre n'accepte plus de candidatures" }, { status: 409 });
  }

  // Upload du CV (service-role) → URL publique (path non devinable via UUID).
  const path = `candidatures/${job.company_id}/${job.id}/${crypto.randomUUID()}_${sanitizeName(cv.name)}`;
  const bytes = new Uint8Array(await cv.arrayBuffer());
  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: cv.type, upsert: false });
  if (upErr) {
    return NextResponse.json({ error: "Échec de l'envoi du CV" }, { status: 500 });
  }
  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);

  const { error: insErr } = await admin.from("candidates").insert({
    company_id: job.company_id,
    job_id: job.id,
    full_name: parsed.data.full_name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    notes_rh: parsed.data.message || null,
    cv_url: urlData.publicUrl,
    statut: "nouveau",
  });
  if (insErr) {
    return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
