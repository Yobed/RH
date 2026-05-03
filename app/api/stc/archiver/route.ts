import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = 'force-dynamic';

// Extension de type pour jsPDF avec autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    const { 
      employee_id, 
      resultat, 
      parametres 
    } = await req.json();

    if (!employee_id || !resultat) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // Récupérer les infos de l'employé et de l'entreprise
    console.log("Archivage STC pour employee_id:", employee_id);
    
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("*, companies(*)")
      .eq("id", employee_id)
      .limit(1)
      .maybeSingle();

    console.log("Données employé récupérées:", JSON.stringify(employee, null, 2));

    if (empError || !employee) {
      console.error("Employé non trouvé:", empError);
      return NextResponse.json({ error: `Employé non trouvé (${employee_id})` }, { status: 404 });
    }

    const company = employee.companies;
    console.log("Données entreprise récupérées via jointure:", JSON.stringify(company, null, 2));

    if (!company) {
      console.error("DEBUG: company_id de l'employé:", employee.company_id);
      return NextResponse.json({ 
        error: "Entreprise introuvable pour cet employé",
        details: { company_id: employee.company_id, full_name: employee.full_name }
      }, { status: 404 });
    }

    // Créer le PDF
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.width;

    // Design & Header
    doc.setFillColor(34, 197, 94); // Emerald 500
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("SOLDE DE TOUT COMPTE", pageWidth / 2, 25, { align: "center" });

    // Infos Entreprise & Employé
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ENTREPRISE :", 15, 55);
    doc.setFont("helvetica", "normal");
    doc.text(company.raison_sociale || company.name, 15, 60);
    doc.text(company.adresse || "Côte d'Ivoire", 15, 65);
    if (company.cnps_matricule) doc.text(`CNPS : ${company.cnps_matricule}`, 15, 70);

    doc.setFont("helvetica", "bold");
    doc.text("EMPLOYÉ :", 120, 55);
    doc.setFont("helvetica", "normal");
    doc.text(employee.full_name, 120, 60);
    doc.text(`Matricule : ${employee.matricule}`, 120, 65);
    doc.text(`Type de contrat : ${employee.type_contrat || 'N/A'}`, 120, 70);
    let formattedDateEmb = "";
    if (employee.date_embauche) {
      try {
        const [y, m, dStr] = employee.date_embauche.split("-");
        if (y && m && dStr) {
          formattedDateEmb = `${dStr.substring(0, 2)}/${m}/${y}`;
        } else {
          formattedDateEmb = new Date(employee.date_embauche).toLocaleDateString("fr-CI");
        }
      } catch {
        formattedDateEmb = new Date(employee.date_embauche).toLocaleDateString("fr-CI");
      }
      doc.text(`Date d'embauche : ${formattedDateEmb}`, 120, 75);
    }

    // Tableau des Indemnités
    const tableRows = [];
    
    if (employee.type_contrat === 'CDD') {
      tableRows.push(["Indemnité de précarité (3%)", `${new Intl.NumberFormat("fr-CI").format(resultat.indemnite_precarite)} FCFA`]);
    } else {
      tableRows.push(["Indemnité de licenciement", `${new Intl.NumberFormat("fr-CI").format(resultat.indemnite_licenciement)} FCFA`]);
    }

    tableRows.push(["Indemnité compensatrice de congés payés", `${new Intl.NumberFormat("fr-CI").format(resultat.indemnite_compensatrice_conges)} FCFA`]);
    tableRows.push(["Indemnité de préavis", `${new Intl.NumberFormat("fr-CI").format(resultat.indemnite_preavis)} FCFA`]);

    autoTable(doc, {
      startY: 90,
      head: [["Désignation des indemnités", "Montant Brut"]],
      body: tableRows,
      theme: "striped",
      headStyles: { fillColor: [34, 197, 94], textColor: 255 }, // Emerald 500
      columnStyles: {
        0: { fontStyle: "bold" },
        1: { halign: "right", fontStyle: "bold" }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Total
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.rect(15, finalY, pageWidth - 30, 15, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL BRUT DU SOLDE DE TOUT COMPTE :", 20, finalY + 10);
    doc.text(`${new Intl.NumberFormat("fr-CI").format(resultat.total_brut_stc)} FCFA`, pageWidth - 20, finalY + 10, { align: "right" });

    // Mentions légales
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    const mentions = "Je soussigné(e), " + employee.full_name + ", reconnais avoir reçu de la société " + (company.raison_sociale || company.name) + " la somme totale mentionnée ci-dessus, en paiement de mon solde de tout compte.\n\nCe montant m'est versé pour solde de tout compte, en paiement des salaires, indemnités et accessoires de salaire de toute nature qui m'étaient dus à ce jour du fait de l'exécution et de la rupture de mon contrat de travail.";
    doc.text(mentions, 15, finalY + 25, { maxWidth: pageWidth - 30 });

    // Signatures
    const sigY = finalY + 60;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Signature de l'Employeur", 40, sigY, { align: "center" });
    doc.text("Signature de l'Employé", pageWidth - 40, sigY, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text("(Précédée de la mention 'Lu et approuvé')", pageWidth - 40, sigY + 5, { align: "center" });

    // Générer le PDF en Buffer
    const pdfOutput = doc.output("arraybuffer");
    const buffer = Buffer.from(pdfOutput);

    // Nom du fichier
    const fileName = `STC_${employee.full_name.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`;
    const filePath = `documents/${company.id}/${employee.id}/Paie/${fileName}`;

    // Uploader sur Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("rh-documents")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        upsert: true
      });

    if (uploadError) {
      console.error("Erreur upload Storage:", uploadError);
      return NextResponse.json({ error: "Erreur lors de l'archivage du document" }, { status: 500 });
    }

    // Enregistrer dans la table GED (documents)
    const { data: documentData, error: docDbError } = await supabase
      .from("documents")
      .insert({
        company_id: company.id,
        employee_id: employee.id,
        name: `Solde de Tout Compte - ${employee.full_name}`,
        famille: "Paie",
        file_url: filePath,
        file_type: "application/pdf",
        file_size_kb: Math.round(buffer.length / 1024)
      })
      .select()
      .limit(1)
      .maybeSingle();

    if (docDbError) {
      console.error("Erreur DB documents:", docDbError);
      return NextResponse.json({ error: "Erreur lors de l'enregistrement en base de données" }, { status: 500 });
    }

    // Audit Log
    await logAuditEvent({
      entity_type: "stc",
      entity_id: employee.id,
      action: "CREATE",
      details: {
        employee_name: employee.full_name,
        total_brut: resultat.total_brut_stc,
        document_id: documentData.id
      },
      new_values: documentData
    });

    return NextResponse.json({ 
      success: true, 
      message: "Document STC généré et archivé avec succès",
      document: documentData
    });

  } catch (error: any) {
    console.error("Erreur STC Document:", error);
    return NextResponse.json({ error: error.message || "Erreur interne" }, { status: 500 });
  }
}

