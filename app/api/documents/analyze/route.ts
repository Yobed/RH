import { createServerClient } from "@/lib/supabase/server";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  document_id: z.string().uuid(),
  persist: z.boolean().optional().default(true),
});

interface ExtractedFields {
  type_document?: string;
  resume?: string;
  champs?: Record<string, string | number | null>;
  alertes?: string[];
  pieces_complementaires_suggerees?: string[];
}

function buildPrompt(famille: string | null, employeName: string): string {
  const familleLine = famille ? `Famille documentaire : ${famille}` : "Famille documentaire : inconnue (à déduire).";
  return `Tu es un assistant RH expert du droit du travail ivoirien.
Tu analyses un document RH du dossier de l'employé "${employeName}".
${familleLine}

Extrais TOUTES les informations utiles selon la famille du document.
Selon le type, les champs pertinents peuvent inclure :
- Contrat / Avenant : type_contrat (CDI/CDD/Stage/Convention), date_debut, date_fin, periode_essai, salaire_brut_fcfa, poste, lieu_travail, duree_hebdo, signataires
- CNI / Passeport : numero, date_emission, date_expiration, lieu_naissance, date_naissance, nationalite
- Diplômes / CV : etablissement, diplome, annee_obtention, mention, specialite
- Casier judiciaire : numero, date_emission, date_validite, mentions
- Extrait de naissance : date_naissance, lieu_naissance, numero_acte
- Certificat de travail : employeur, poste, date_debut, date_fin, motif_depart
- Médical : type_examen, medecin, date, aptitude, restrictions
- Paie : periode, salaire_brut, salaire_net, cotisations
- Disciplinaire : type_sanction, date_faits, date_sanction, motif
- Formation : organisme, intitule, date_debut, date_fin, duree_heures, certifiant

Détecte aussi les ALERTES (document expiré, signatures manquantes, incohérence de date, document non conforme au Code du Travail CI loi 2015-532).

Réponds STRICTEMENT en JSON valide (sans markdown, sans texte autour) :
{
  "type_document": "string — type précis détecté",
  "resume": "string — 1-2 phrases en français",
  "champs": { "cle_snake_case": "valeur ou null" },
  "alertes": ["string"],
  "pieces_complementaires_suggerees": ["string"]
}`;
}

async function fetchAsBase64(url: string): Promise<{ data: string; mediaType: string }> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Téléchargement du fichier échoué (HTTP ${res.status}).`);
  const mediaType = res.headers.get("content-type") ?? "application/octet-stream";
  const buf = Buffer.from(await res.arrayBuffer());
  return { data: buf.toString("base64"), mediaType };
}

function isPdf(mediaType: string, url: string): boolean {
  return mediaType.includes("pdf") || /\.pdf(\?.*)?$/i.test(url);
}

function isImage(mediaType: string, url: string): boolean {
  if (mediaType.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(url);
}

function normalizeImageType(mediaType: string, url: string): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  const lower = mediaType.toLowerCase();
  if (lower.includes("png")) return "image/png";
  if (lower.includes("gif")) return "image/gif";
  if (lower.includes("webp")) return "image/webp";
  if (lower.includes("jpeg") || lower.includes("jpg")) return "image/jpeg";
  if (/\.png(\?.*)?$/i.test(url)) return "image/png";
  if (/\.gif(\?.*)?$/i.test(url)) return "image/gif";
  if (/\.webp(\?.*)?$/i.test(url)) return "image/webp";
  return "image/jpeg";
}

export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 }); }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });

  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .select("id, name, famille, file_url, file_type, employee_id, company_id")
    .eq("id", parsed.data.document_id)
    .single();
  if (docErr || !doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  let employeName = "(non rattaché)";
  if (doc.employee_id) {
    const { data: emp } = await supabase
      .from("employees")
      .select("full_name")
      .eq("id", doc.employee_id)
      .single();
    if (emp) employeName = emp.full_name;
  }

  let fileBase64: string;
  let mediaType: string;
  try {
    const fetched = await fetchAsBase64(doc.file_url);
    fileBase64 = fetched.data;
    mediaType = doc.file_type ?? fetched.mediaType;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  const prompt = buildPrompt(doc.famille, employeName);

  type ContentBlock =
    | { type: "text"; text: string }
    | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }
    | { type: "image"; source: { type: "base64"; media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp"; data: string } };

  const content: ContentBlock[] = [];

  if (isPdf(mediaType, doc.file_url)) {
    content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: fileBase64 } });
  } else if (isImage(mediaType, doc.file_url)) {
    content.push({ type: "image", source: { type: "base64", media_type: normalizeImageType(mediaType, doc.file_url), data: fileBase64 } });
  } else {
    return NextResponse.json(
      { error: `Type de fichier non supporté pour l'analyse IA (${mediaType}). Convertissez en PDF ou image.` },
      { status: 415 }
    );
  }
  content.push({ type: "text", text: prompt });

  let extracted: ExtractedFields;
  try {
    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content }],
    });
    const first = msg.content[0];
    if (first.type !== "text") throw new Error("Réponse Claude inattendue.");
    const cleaned = first.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    extracted = JSON.parse(cleaned) as ExtractedFields;
  } catch (e) {
    return NextResponse.json({ error: `Analyse IA échouée : ${(e as Error).message}` }, { status: 500 });
  }

  if (parsed.data.persist) {
    await supabase
      .from("documents")
      .update({
        ai_extracted_data: extracted,
        ai_summary: extracted.resume ?? null,
        ai_analyzed_at: new Date().toISOString(),
      })
      .eq("id", doc.id);
  }

  return NextResponse.json({ success: true, extracted });
}
