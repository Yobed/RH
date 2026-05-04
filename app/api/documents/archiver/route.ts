import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    const { 
      employee_id, 
      company_id,
      name,
      famille,
      pdf_base64
    } = await req.json();

    if (!employee_id || !pdf_base64) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // Convertir le base64 en buffer
    // On enlève le préfixe data:application/pdf;filename=generated.pdf;base64, si présent
    const base64Data = pdf_base64.split(",")[1] || pdf_base64;
    const buffer = Buffer.from(base64Data, "base64");

    // Nom du fichier
    const timestamp = new Date().getTime();
    const cleanName = name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
    const fileName = `${cleanName}_${timestamp}.pdf`;
    const filePath = `documents/${company_id}/${employee_id}/${famille}/${fileName}`;

    // Uploader sur Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("rh-documents")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        upsert: true
      });

    if (uploadError) {
      console.error("Erreur upload Storage:", uploadError);
      return NextResponse.json({ error: "Erreur lors de l'archivage dans le stockage" }, { status: 500 });
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from("rh-documents")
      .getPublicUrl(filePath);

    // Enregistrer dans la table GED (documents)
    const { data: documentData, error: docDbError } = await supabase
      .from("documents")
      .insert({
        company_id,
        employee_id,
        name,
        famille,
        file_url: urlData.publicUrl,
        file_type: "application/pdf",
        file_size_kb: Math.round(buffer.length / 1024)
      })
      .select()
      .single();

    if (docDbError) {
      console.error("Erreur DB documents:", docDbError);
      return NextResponse.json({ error: "Erreur lors de l'enregistrement en base de données" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Document archivé avec succès",
      document: documentData
    });

  } catch (error: any) {
    console.error("Erreur Archival Document:", error);
    return NextResponse.json({ error: error.message || "Erreur interne" }, { status: 500 });
  }
}

