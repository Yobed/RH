import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import jsPDF from 'jspdf';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    
    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer le company_id
    const { data: companyId } = await supabase.rpc("get_user_company_id");
    if (!companyId) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 403 });
    }

    const { id } = params;

    // Récupérer les détails de la procédure et de l'employé
    const { data: procedure, error } = await supabase
      .from('disciplinary_procedures')
      .select(`
        *,
        employees:employee_id (
          full_name,
          matricule,
          poste,
          department
        ),
        company:company_id (
          name,
          raison_sociale,
          adresse,
          ncc,
          cnps_matricule
        )
      `)
      .eq('id', id)
      .eq('company_id', companyId)
      .single();

    if (error || !procedure) {
      return NextResponse.json({ error: 'Procédure introuvable' }, { status: 404 });
    }

    const employee = procedure.employees;
    const company = procedure.company;
    const today = new Date().toLocaleDateString('fr-FR');
    
    // Initialisation du PDF
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // 1. En-tête Entreprise
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(company.raison_sociale || company.name, margin, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(company.adresse || "", margin, 25);
    doc.text(`N° CC : ${company.ncc || "—"} | N° CNPS : ${company.cnps_matricule || "—"}`, margin, 30);

    // 2. Titre du document
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    let title = "";
    if (procedure.type === 'DEMANDE_EXPLICATION') title = "DEMANDE D'EXPLICATIONS";
    else if (procedure.type === 'AVERTISSEMENT') title = "NOTIFICATION D'AVERTISSEMENT";
    else if (procedure.type === 'MISE_A_PIED') title = "NOTIFICATION DE MISE À PIED DISCIPLINAIRE";
    else if (procedure.type === 'LICENCIEMENT') title = "NOTIFICATION DE LICENCIEMENT";
    else title = `MESURE DISCIPLINAIRE : ${procedure.type.replace(/_/g, ' ')}`;
    
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, 50);
    doc.line((pageWidth - titleWidth) / 2, 52, (pageWidth + titleWidth) / 2, 52);

    // 3. Infos destinataire
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`À l'attention de : Monsieur/Madame ${employee.full_name}`, margin, 70);
    doc.text(`Matricule : ${employee.matricule || "—"}`, margin, 76);
    doc.text(`Poste : ${employee.poste || "—"}`, margin, 82);
    doc.text(`Service : ${employee.department || "—"}`, margin, 88);

    // 4. Corps du texte
    doc.setFontSize(12);
    let content = "";
    if (procedure.type === 'DEMANDE_EXPLICATION') {
      content = `Monsieur/Madame,\n\nIl nous a été donné de constater les faits suivants vous concernant :\n\n${procedure.motif}\n\nCes faits constituent un manquement à vos obligations professionnelles et aux dispositions du règlement intérieur de l'entreprise.\n\nEn conséquence, nous vous demandons de bien vouloir nous fournir vos explications écrites sur ces faits dans un délai de 48 heures à compter de la réception de la présente.`;
    } else if (procedure.type === 'AVERTISSEMENT') {
      content = `Monsieur/Madame,\n\nSuite à nos échanges concernant les faits suivants :\n\n${procedure.motif}\n\nVos explications n'ayant pas été jugées satisfaisantes, nous vous notifions par la présente un AVERTISSEMENT.\n\nNous espérons que cette mesure vous incitera à un changement d'attitude. Une récidive pourrait nous conduire à prendre des mesures plus sévères.`;
    } else if (procedure.type === 'MISE_A_PIED') {
      content = `Monsieur/Madame,\n\nSuite à la demande d'explications qui vous a été adressée et après analyse de vos justifications concernant les faits suivants :\n\n${procedure.motif}\n\nNous avons décidé de vous infliger une MISE À PIED DISCIPLINAIRE.\n\nL'exécution de votre contrat de travail sera suspendue sans rémunération pour la période définie par la direction.`;
    } else if (procedure.type === 'LICENCIEMENT') {
      content = `Monsieur/Madame,\n\nSuite à notre entretien préalable et après avoir examiné vos explications concernant les faits qui vous sont reprochés :\n\n${procedure.motif}\n\nNous vous informons par la présente de notre décision de procéder à votre LICENCIEMENT pour motif disciplinaire.`;
    } else {
      content = `Motifs de la mesure :\n\n${procedure.motif}`;
    }

    doc.text(content, margin, 110, { maxWidth: pageWidth - 2 * margin });

    // 5. Signature
    doc.text(`Fait à Abidjan, le ${today}`, margin, 200);
    doc.setFont("helvetica", "bold");
    doc.text("La Direction des Ressources Humaines", pageWidth - margin - 80, 220);

    // 6. Sauvegarde et Archivage
    const pdfArrayBuffer = doc.output("arraybuffer");
    const fileName = `disciplinaire_${procedure.type.toLowerCase()}_${employee.matricule || Date.now()}.pdf`;
    const path = `documents/${companyId}/${procedure.employee_id}/Disciplinaire/${Date.now()}_${fileName}`;

    // Upload vers Storage
    const { error: uploadError } = await supabase.storage
      .from("rh-documents")
      .upload(path, pdfArrayBuffer, {
        contentType: "application/pdf"
      });

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from("rh-documents").getPublicUrl(path);
      
      // Insertion dans la table documents (GED)
      await supabase.from("documents").insert({
        company_id: companyId,
        employee_id: procedure.employee_id,
        name: title,
        file_url: publicUrl,
        file_type: "application/pdf",
        file_size_kb: Math.round(pdfArrayBuffer.byteLength / 1024),
        famille: "Disciplinaire",
        metadata: { procedure_id: id, type: procedure.type }
      });
      
      // Mettre à jour le statut de la procédure pour indiquer que le document a été généré
      await supabase
        .from('disciplinary_procedures')
        .update({ status: 'DOCUMENT_GENERE' })
        .eq('id', id);
    }

    return new Response(pdfArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Erreur génération document:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

