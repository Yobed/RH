import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import jsPDF from "jspdf";
import { generateAttestationPDF } from "@/lib/pdf-templates";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { employeeId, type, shouldArchive } = await req.json();
    const supabase = createServerClient();

    // 1. Récupération des données
    const { data: emp, error: empError } = await supabase
      .from("employees")
      .select("*, companies(*)")
      .eq("id", employeeId)
      .single();

    if (empError || !emp) {
      return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });
    }

    const company = (emp as any).companies;
    
    // 2. Generation via Central Library
    const doc = generateAttestationPDF({ 
        employee: emp, 
        company: company, 
        type: type 
    });

    const title = type === "salaire" ? "ATTESTATION DE SALAIRE" : "ATTESTATION DE TRAVAIL";
    const fileName = `attestation_${type}_${emp.matricule || Date.now()}.pdf`;

    // 6. Export / Archiving
    const pdfArrayBuffer = doc.output("arraybuffer");

    if (shouldArchive) {
      const { data: companyId } = await supabase.rpc("get_user_company_id");
      
      const path = `documents/${companyId}/${employeeId}/Autre/${Date.now()}_${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("rh-documents")
        .upload(path, pdfArrayBuffer, {
          contentType: "application/pdf"
        });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from("rh-documents").getPublicUrl(path);
        
        await supabase.from("documents").insert({
          company_id: companyId,
          employee_id: employeeId,
          name: title,
          file_url: publicUrl,
          file_type: "application/pdf",
          file_size_kb: Math.round(pdfArrayBuffer.byteLength / 1024),
          famille: "Autre"
        });
      }
    }
    
    return new Response(pdfArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error("PDF Export Error:", error);
    return NextResponse.json({ error: "Erreur lors de la génération du PDF" }, { status: 500 });
  }
}


