import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = 'force-dynamic';
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string; numpages: number }>; // CommonJS interop

export const runtime = "nodejs";

// Découpe un texte long en chunks de ~1500 caractères sur les sauts de ligne
function chunkText(text: string, maxChars = 1500): string[] {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length + 2 > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export async function POST(req: Request) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Vérification rôle admin — seuls les admins peuvent alimenter la base RAG partagée
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json(
      { error: "Accès réservé aux administrateurs" },
      { status: 403 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formulaire invalide" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const source = (formData.get("source") as string | null)?.trim();
  const titre = (formData.get("titre") as string | null)?.trim();

  if (!file || !source || !titre) {
    return NextResponse.json(
      { error: "Fichier, source et titre sont obligatoires" },
      { status: 400 }
    );
  }

  if (file.size > 52_428_800) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 50 Mo)" }, { status: 413 });
  }

  const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");

  // ── 1. Upload vers Supabase Storage ────────────────────────
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `legal/${Date.now()}_${safeFileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const { error: storageError } = await supabase.storage
    .from("legal-documents")
    .upload(storagePath, fileBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (storageError) {
    return NextResponse.json(
      { error: `Erreur stockage : ${storageError.message}` },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("legal-documents").getPublicUrl(storagePath);

  // ── 2. Extraction du texte ──────────────────────────────────
  let extractedText = "";
  let chunksInserted = 0;

  if (isPdf) {
    try {
      const parsed = await pdfParse(fileBuffer);
      extractedText = parsed.text;
    } catch {
      // PDF non lisible — on insère quand même avec une notice
      extractedText = `[Document PDF — extraction automatique impossible. Fichier disponible : ${publicUrl}]`;
    }
  } else {
    // Fichier Word ou autre — texte brut non extractible côté serveur
    extractedText = `[Document non-PDF — extraction automatique non disponible. Fichier disponible : ${publicUrl}]`;
  }

  // ── 3. Découpage en chunks + insertion dans legal_documents ─
  const chunks = chunkText(extractedText);
  let lastInsertedId: string | null = null;

  for (let i = 0; i < chunks.length; i++) {
    const chunkTitre =
      chunks.length === 1 ? titre : `${titre} (partie ${i + 1}/${chunks.length})`;

    const { data: insertedChunk, error: insertError } = await supabase.from("legal_documents").insert({
      source,
      titre: chunkTitre,
      contenu: chunks[i],
      company_id: null, // partagé entre tous les tenants
    }).select("id").single();

    if (!insertError) {
      chunksInserted++;
      if (i === 0 && insertedChunk?.id) lastInsertedId = insertedChunk.id as string;
    }
  }

  // ── 4. Log d'audit après upload RAG réussi ──────────────────
  if (chunksInserted > 0) {
    await logAuditEvent({
      action: "upload",
      entity_type: "legal_documents",
      entity_id: lastInsertedId ?? "unknown",
      details: {
        titre,
        source,
        chunksInserted,
        storagePath
      }
    });
  }

  return NextResponse.json({
    message: `Document indexé : ${chunksInserted} chunk(s) inséré(s) dans le RAG`,
    chunks: chunksInserted,
    storage_path: storagePath,
    public_url: publicUrl,
  });
}

// GET — liste les documents juridiques indexés
export async function GET() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("legal_documents")
    .select("id, titre, source, created_at")
    .is("company_id", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE — supprime un document du RAG par id
export async function DELETE(req: Request) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = (await req.json()) as { id?: string };
  if (!id) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  const { error } = await supabase
    .from("legal_documents")
    .delete()
    .eq("id", id)
    .is("company_id", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
