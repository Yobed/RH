import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Endpoint PUBLIC : le candidat signe son contrat via /signer/[id].
// La signature manuscrite (PNG) est stockée comme preuve, le candidat passe en « embauche ».
const BUCKET = "rh-documents";

const schema = z.object({
  candidate_id: z.string().uuid("Candidat invalide"),
  signature: z.string().startsWith("data:image/png;base64,", "Signature invalide"),
});

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
    .select("id, company_id, full_name, statut, notes_rh")
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

  return NextResponse.json({ ok: true }, { status: 201 });
}
