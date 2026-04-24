import jsPDF from "jspdf";
import "jspdf-autotable";
import { ResultatPaieComplet, LignesBulletin } from "./paie-ci";

export interface CompanyInfo {
  id: string;
  name: string;
  raison_sociale?: string | null;
  adresse?: string | null;
  ncc?: string | null;
  cnps_matricule?: string | null;
  convention_collective?: string | null;
  logo_url?: string | null;
}

// Extension de type pour jsPDF avec autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

/**
 * Utilitaires de base pour le design des documents RH
 */
const setupHeader = (doc: jsPDF, company: CompanyInfo | null, title: string) => {
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // En-tête Entreprise (Harmonisé)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(company?.raison_sociale || company?.name || "ENTREPRISE IVOIRIENNE", margin, 25);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(company?.adresse || "Abidjan, Côte d'Ivoire", margin, 31);
  doc.text(`N° CC : ${company?.ncc || "—"} | N° CNPS : ${company?.cnps_matricule || "—"}`, margin, 36);
  
  // Titre du document encadré
  const titleY = 55;
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59); // slate-800
  const titleWidth = doc.getTextWidth(title.toUpperCase());
  
  // Petit soulignement stylisé
  doc.setDrawColor(79, 70, 229); // indigo-600
  doc.setLineWidth(1.5);
  doc.line((pageWidth - titleWidth) / 2, titleY + 3, (pageWidth + titleWidth) / 2, titleY + 3);
  
  doc.text(title.toUpperCase(), (pageWidth - titleWidth) / 2, titleY);
  
  return titleY + 20;
};

const setupSignatures = (doc: jsPDF, labelL = "L'Employé", labelR = "L'Employeur") => {
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const sigY = pageHeight - 60;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  
  doc.text(labelL, margin + 10, sigY);
  doc.text("(Précédé de la mention 'Lu et approuvé')", margin, sigY + 5, { fontSize: 7 } as any);
  
  doc.text(labelR, pageWidth - margin - 70, sigY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Signature et Cachet", pageWidth - margin - 60, sigY + 10);
};

const setupReceipt = (doc: jsPDF) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("Accusé de réception par l'employé le : ___ / ___ / 202___", margin, pageHeight - 20);
    doc.text("Signature du réceptionnaire : ", margin + 100, pageHeight - 20);
};

/**
 * 1. Template : Demande d'Explications
 */
export const generateDemandeExplicationPDF = ({ procedure, employee, company }: any) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const margin = 20;
  const startY = setupHeader(doc, company, "Demande d'Explications");
  
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  
  // Date et Lieu
  doc.text(`Abidjan, le ${new Date().toLocaleDateString('fr-FR')}`, 140, 45);
  
  // Destinataire
  doc.setFont("helvetica", "bold");
  doc.text(`À Monsieur / Madame ${employee.full_name}`, margin, startY);
  doc.text(`Matricule : ${employee.matricule || "—"}`, margin, startY + 6);
  doc.text(`Fonction : ${employee.poste || "—"}`, margin, startY + 12);
  
  doc.setFont("helvetica", "normal");
  const bodyText = `Monsieur / Madame,\n\nIl nous a été donné de constater ce qui suit :\n\n${procedure.motif}\n\nCes faits, s'ils sont avérés, constituent un manquement grave à vos obligations contractuelles et aux dispositions du règlement intérieur.\n\nAussi, vous demandons-nous de bien vouloir nous fournir vos explications écrites sur ces faits dès réception de la présente, et au plus tard sous 48 heures.\n\nNous vous prions d'agréer, Monsieur / Madame, l'expression de nos salutations distinguées.`;
  
  doc.text(bodyText, margin, startY + 30, { maxWidth: 170, lineHeightFactor: 1.5 });
  
  doc.setFont("helvetica", "bold");
  doc.text("La Direction", 140, startY + 110);
  
  setupReceipt(doc);
  return doc;
};

/**
 * 2. Template : Notification de Sanction
 */
export const generateSanctionPDF = ({ procedure, employee, company }: any) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const margin = 20;
    const title = procedure.type === 'AVERTISSEMENT' ? "Notification d'Avertissement" : "Notification de Sanction";
    const startY = setupHeader(doc, company, title);
    
    doc.setFontSize(11);
    doc.text(`Abidjan, le ${new Date().toLocaleDateString('fr-FR')}`, 140, 45);
    
    doc.setFont("helvetica", "bold");
    doc.text(`À Monsieur / Madame ${employee.full_name}`, margin, startY);
    
    doc.setFont("helvetica", "normal");
    const intro = procedure.type === 'AVERTISSEMENT' 
        ? "Suite à la demande d'explications qui vous a été adressée le ___/___/___ et après analyse de vos justifications qui n'ont pas été jugées recevables, nous vous notifions par la présente un AVERTISSEMENT."
        : "Suite à l'entretien disciplinaire du ___/___/___ et au regard du caractère des faits reprochés, nous avons décidé de vous infliger la sanction suivante :";
    
    doc.text(intro, margin, startY + 20, { maxWidth: 170, lineHeightFactor: 1.4 });
    
    // Encadré de la sanction
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, startY + 45, 170, 30, "F");
    doc.setFont("helvetica", "bold");
    doc.text(procedure.type.replace(/_/g, " "), margin + 5, startY + 55);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(procedure.sanction_prise || "Détails de la sanction non spécifiés.", margin + 5, startY + 62, { maxWidth: 160 });
    
    doc.setFontSize(11);
    doc.text("Nous espérons que cette mesure vous incitera à une meilleure observation de vos devoirs professionnels.", margin, startY + 85, { maxWidth: 170 });
    
    doc.setFont("helvetica", "bold");
    doc.text("La Direction des Ressources Humaines", 120, startY + 110);
    
    setupReceipt(doc);
    return doc;
};

/**
 * 3. Template : Attestation de Travail/Salaire
 */
export const generateAttestationPDF = ({ employee, company, type = 'travail' }: { employee: any, company: CompanyInfo | null, type?: 'travail' | 'salaire' }) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const margin = 25;
    const title = type === 'salaire' ? "Attestation de Salaire" : "Attestation de Travail";
    const startY = setupHeader(doc, company, title);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("La Direction des Ressources Humaines certifie par la présente que :", margin, startY + 20);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Monsieur / Madame ${employee.full_name}`, margin, startY + 35);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const dateE = new Date(employee.date_embauche).toLocaleDateString('fr-FR');
    const poste = employee.poste || "Collaborateur";
    
    let content = "";
    if (type === "travail") {
      content = `Est employé(e) au sein de notre entreprise depuis le ${dateE} en qualité de ${poste}.\n\nL'intéressé(e) est à ce jour libre de tout engagement envers notre société.\n\nLa présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.`;
    } else {
      const salaireFmt = new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(employee.salaire_brut || 0);
      content = `Est employé(e) au sein de notre entreprise en qualité de ${poste}.\n\nSon salaire mensuel brut imposable s'élève à la somme de ${salaireFmt}.\n\nLa présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.`;
    }
    
    doc.text(content, margin, startY + 50, { maxWidth: 160, lineHeightFactor: 1.6 });
    
    doc.text(`Fait à Abidjan, le ${new Date().toLocaleDateString('fr-FR')}`, margin, startY + 120);
    
    doc.setFont("helvetica", "bold");
    doc.text("Le Responsable des Ressources Humaines", 110, startY + 140);
    
    return doc;
};

/**
 * 4. Template : Certificat de Travail
 */
export const generateCertificatPDF = ({ employee, company }: { employee: any, company: CompanyInfo | null }) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const margin = 25;
    const startY = setupHeader(doc, company, "Certificat de Travail");
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    
    const dateE = new Date(employee.date_embauche).toLocaleDateString('fr-FR');
    const dateS = new Date().toLocaleDateString('fr-FR'); // À remplacer par date_fin si dispo
    const poste = employee.poste || "Collaborateur";
    
    const content = `Nous soussignés, ${company?.raison_sociale || company?.name || "l'Employeur"}, certifions que :\n\n` +
        `Monsieur / Madame ${employee.full_name},\n` +
        `Matricule ${employee.matricule || "—"},\n\n` +
        `A fait partie de notre personnel du ${dateE} au ${dateS} en qualité de ${poste}.\n\n` +
        `Monsieur / Madame ${employee.full_name} nous quitte ce jour, libre de tout engagement.\n\n` +
        `En foi de quoi, le présent certificat lui est délivré pour servir et valoir ce que de droit.`;
    
    doc.text(content, margin, startY + 20, { maxWidth: 160, lineHeightFactor: 1.6 });
    
    doc.text(`Fait à Abidjan, le ${new Date().toLocaleDateString('fr-FR')}`, margin, startY + 110);
    
    doc.setFont("helvetica", "bold");
    doc.text("La Direction Générale", 110, startY + 130);
    
    return doc;
};

/**
 * 5. Template : Courrier de Licenciement
 */
export const generateLicenciementPDF = ({ employee, company, procedure }: { employee: any, company: CompanyInfo | null, procedure: any }) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const margin = 20;
    const startY = setupHeader(doc, company, "Notification de Licenciement");
    
    doc.setFontSize(11);
    doc.text(`Abidjan, le ${new Date().toLocaleDateString('fr-FR')}`, 140, 45);
    
    doc.setFont("helvetica", "bold");
    doc.text("OBJET : NOTIFICATION DE RUPTURE DE CONTRAT", margin, startY);
    
    doc.setFont("helvetica", "normal");
    doc.text(`À l'attention de Monsieur / Madame ${employee.full_name}`, margin, startY + 15);
    
    const body = `Monsieur / Madame,\n\nNous faisons suite à l'entretien que nous avons eu le ___/___/___ au cours duquel nous vous avons exposé les motifs qui nous amènent à envisager votre licenciement.\n\nPar la présente, nous avons le regret de vous notifier votre licenciement pour le motif suivant :\n\n${procedure.motif || "Motif non spécifié"}\n\nVotre contrat prendra fin à l'issue de votre période de préavis de ___ mois, soit le ___/___/___. Durant cette période, vous bénéficiez de deux (02) jours de liberté par semaine pour la recherche d'un nouvel emploi.\n\nÀ la fin de votre contrat, nous tiendrons à votre disposition votre certificat de travail, votre attestation de travail ainsi que votre solde de tout compte.\n\nNous vous prions d'agréer, Monsieur / Madame, l'expression de nos salutations distinguées.`;
    
    doc.text(body, margin, startY + 30, { maxWidth: 170, lineHeightFactor: 1.4 });
    
    doc.setFont("helvetica", "bold");
    doc.text("La Direction", 130, startY + 130);
    
    setupReceipt(doc);
    return doc;
};

/**
 * 4. Template : Fiche d'Evaluation Performance
 */
export const generateEvaluationPDF = ({ evaluation, employee, company }: any) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const margin = 20;
    const startY = setupHeader(doc, company, `Fiche d'Évaluation ${evaluation.type}`);
    
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    
    // Header infos
    doc.autoTable({
        startY: startY,
        head: [['EMPLOYÉ', 'PÉRIODE', 'DATE RÉALISATION', 'STATUT']],
        body: [[
            employee.full_name,
            evaluation.periode || "Année 2026",
            evaluation.date_realisation ? new Date(evaluation.date_realisation).toLocaleDateString('fr-FR') : "N/A",
            evaluation.statut
        ]],
        theme: 'grid',
        headStyles: { fillGray: 90, textColor: 255, fontStyle: 'bold' }
    });
    
    // Scores
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`SCORE GLOBAL : ${evaluation.score_global || 0} / 100`, margin, finalY);
    
    doc.setFontSize(11);
    doc.text("Synthèse de l'évaluateur :", margin, finalY + 15);
    doc.setFont("helvetica", "normal");
    doc.text(evaluation.commentaire || "Aucun commentaire renseigné.", margin, finalY + 22, { maxWidth: 170 });
    
    setupSignatures(doc, "Signature de l'Évalué", "Signature de l'Évaluateur");
    return doc;
};

/**
 * 5. Template : Bulletin de Paie (Standard CI)
 */
export const generatePaySlipPDF = ({ result, lines, employee, company, period }: { 
    result: ResultatPaieComplet; 
    lines: LignesBulletin; 
    employee: any; 
    company: any; 
    period: string;
}) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // En-tête Entreprise
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(company?.raison_sociale || company?.name || "ENTREPRISE IVOIRIENNE", margin, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const companyInfo = [
        company?.adresse || "Abidjan, Côte d'Ivoire",
        `NCC : ${company?.ncc || "—"} | CNPS : ${company?.cnps_matricule || "—"}`,
        `CC : ${company?.convention_collective || "Interprofessionnelle"}`
    ];
    companyInfo.forEach((text, i) => doc.text(text, margin, 25 + (i * 4)));

    // Titre Bulletin
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("BULLETIN DE PAIE", pageWidth / 2, 45, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Période : ${period}`, pageWidth / 2, 51, { align: "center" });

    // Bloc Employé (Encadré)
    doc.setDrawColor(200);
    doc.rect(110, 15, 85, 30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(employee.full_name.toUpperCase(), 115, 22);
    doc.setFont("helvetica", "normal");
    doc.text(`Matricule : ${employee.matricule || "—"}`, 115, 27);
    doc.text(`Emploi : ${employee.poste || "—"}`, 115, 32);
    doc.text(`Ancienneté : ${employee.date_embauche ? new Date(employee.date_embauche).toLocaleDateString() : "—"}`, 115, 37);

    // Corps du bulletin (Tableau)
    const fmt = (n: number) => n.toLocaleString('fr-FR');
    
    const body = [];
    
    // Gains
    body.push(["100", "Salarie de Base", "", "", fmt(lines.salaire_brut), ""]);
    if (lines.sursalaire) body.push(["101", "Sursalaire", "", "", fmt(lines.sursalaire), ""]);
    if (lines.prime_anciennete) body.push(["102", "Prime d'ancienneté", "", "", fmt(lines.prime_anciennete), ""]);
    if (lines.prime_transport) body.push(["103", "Indemnité de transport", "", "", fmt(lines.prime_transport), ""]);
    if (lines.prime_fonction) body.push(["104", "Prime de fonction", "", "", fmt(lines.prime_fonction), ""]);
    if (lines.prime_exceptionnelle) body.push(["105", "Gratification / 13e mois", "", "", fmt(lines.prime_exceptionnelle), ""]);
    if (result.heures_sup_montant > 0) body.push(["110", "Heures supplémentaires", "", "", fmt(result.heures_sup_montant), ""]);
    
    // Retenues
    if (result.retenu_absence > 0) body.push(["200", "Retenue absence", "", "", "", fmt(result.retenu_absence)]);
    body.push(["300", "CNPS Retraite (6.3%)", fmt(Math.min(result.total_imposable, 1647315)), "6.30%", "", fmt(result.cnps_retraite)]);
    body.push(["301", "CMU (Couverture Maladie)", "", "Fait", "", fmt(result.cmu)]);
    body.push(["400", "IS (Impôt sur Salaire)", fmt(result.total_imposable), "Barème", "", fmt(result.its)]);
    
    if (lines.avances) body.push(["500", "Avance sur salaire", "", "", "", fmt(lines.avances)]);
    if (lines.autres_retenues) body.push(["501", "Autres retenues", "", "", "", fmt(lines.autres_retenues)]);

    doc.autoTable({
        startY: 65,
        head: [['Code', 'Désignation', 'Base', 'Taux', 'Gains', 'Retenues']],
        body: body,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillGray: 90, textColor: 255, halign: 'center' },
        columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            2: { halign: 'right', cellWidth: 30 },
            3: { halign: 'center', cellWidth: 20 },
            4: { halign: 'right', cellWidth: 25 },
            5: { halign: 'right', cellWidth: 25 },
        }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totaux
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`TOTAL BRUT : ${fmt(result.total_brut)} FCFA`, 110, finalY);
    doc.text(`TOTAL RETENUES : ${fmt(result.total_retenues)} FCFA`, 110, finalY + 7);
    
    // Net à Payer (Grand Cru)
    doc.setFillColor(30, 41, 59);
    doc.rect(105, finalY + 12, 90, 15, "F");
    doc.setTextColor(255);
    doc.setFontSize(12);
    doc.text(`NET À PAYER : ${fmt(result.salaire_net)} FCFA`, 110, finalY + 22);

    // Mention Légale
    doc.setTextColor(100);
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    const mention = "Pour vous aider à faire valoir vos droits, conservez ce bulletin de paie sans limitation de durée.\nEn cas de contestation, l'employeur est tenu de fournir les éléments de preuve des sommes versées.";
    doc.text(mention, margin, doc.internal.pageSize.getHeight() - 25, { maxWidth: pageWidth - 30 });

    setupSignatures(doc, "L'Employé", "Le Gérant / DRH");
    return doc;
};

/**
 * 6. Template : Solde de Tout Compte (STC)
 */
export const generateSTCPDF = ({ stcResult, employee, company, params }: any) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const startY = setupHeader(doc, company, "RECU POUR SOLDE DE TOUT COMPTE");
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const content = `Je soussigné(e), Monsieur / Madame ${employee.full_name}, matricule ${employee.matricule || "—"}, demeurant à Abidjan, Côte d'Ivoire, reconnais avoir reçu ce jour de la part de la société ${company?.raison_sociale || company?.name || "l'Employeur"}, la somme brute totale de :`;
    
    doc.text(content, margin, startY + 15, { maxWidth: 170, lineHeightFactor: 1.5 });
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    const totalFmt = new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(stcResult.total_brut_stc);
    doc.text(totalFmt, pageWidth / 2, startY + 40, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Cette somme se décompose comme suit :", margin, startY + 55);

    const body = [
        ["Indemnité de licenciement", `${new Intl.NumberFormat("fr-CI").format(stcResult.indemnite_licenciement)} FCFA`],
        ["Indemnité de précarité (CDD)", `${new Intl.NumberFormat("fr-CI").format(stcResult.indemnite_precarite)} FCFA`],
        ["Indemnité compensatrice de congés", `${new Intl.NumberFormat("fr-CI").format(stcResult.indemnite_compensatrice_conges)} FCFA`],
        ["Indemnité de préavis", `${new Intl.NumberFormat("fr-CI").format(stcResult.indemnite_preavis)} FCFA`],
        ["TOTAL BRUT STC", `${new Intl.NumberFormat("fr-CI").format(stcResult.total_brut_stc)} FCFA`]
    ];

    doc.autoTable({
        startY: startY + 60,
        body: body,
        theme: 'grid',
        didParseCell: (data: any) => {
            if (data.row.index === 4) data.cell.styles.fontStyle = 'bold';
        }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    const discharge = "Ce reçu pour solde de tout compte est établi en application des articles du Code du Travail de Côte d'Ivoire. Sous réserve d'encaissement définitif de la somme précitée, il libère l'employeur de toute obligation contractuelle.";
    doc.setFontSize(9);
    doc.text(discharge, margin, finalY, { maxWidth: 170, lineHeightFactor: 1.4 });

    doc.text(`Fait à Abidjan, le ${new Date().toLocaleDateString('fr-FR')}`, margin, finalY + 30);
    
    setupSignatures(doc, "L'Employé (Lu et approuvé)", "L'Employeur (Cachet)");
    return doc;
};

/**
 * 7. Template : Livre de Paie (Report Mensuel)
 */
export const generatePayrollReportPDF = ({ bulletins, company, period }: any) => {
    const doc = new jsPDF("landscape") as jsPDFWithAutoTable;
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const startY = setupHeader(doc, company, `LIVRE DE PAIE - PÉRIODE : ${period}`);

    const tableBody = bulletins.map((b: any) => {
        const emp = b.employees;
        return [
            emp?.full_name || "—",
            emp?.matricule || "—",
            new Intl.NumberFormat("fr-CI").format(b.salaire_brut),
            new Intl.NumberFormat("fr-CI").format(b.cnps_salarie),
            new Intl.NumberFormat("fr-CI").format(b.its),
            new Intl.NumberFormat("fr-CI").format(b.salaire_net),
            b.statut.toUpperCase()
        ];
    });

    const totals = bulletins.reduce((acc: any, b: any) => ({
        brut: acc.brut + Number(b.salaire_brut),
        cnps: acc.cnps + Number(b.cnps_salarie),
        its: acc.its + Number(b.its),
        net: acc.net + Number(b.salaire_net)
    }), { brut: 0, cnps: 0, its: 0, net: 0 });

    tableBody.push([
        { content: 'TOTAL GÉNÉRAL', colSpan: 2, styles: { fontStyle: 'bold', fillGray: 240 } },
        { content: new Intl.NumberFormat("fr-CI").format(totals.brut), styles: { fontStyle: 'bold', fillGray: 240 } },
        { content: new Intl.NumberFormat("fr-CI").format(totals.cnps), styles: { fontStyle: 'bold', fillGray: 240 } },
        { content: new Intl.NumberFormat("fr-CI").format(totals.its), styles: { fontStyle: 'bold', fillGray: 240 } },
        { content: new Intl.NumberFormat("fr-CI").format(totals.net), styles: { fontStyle: 'bold', fillGray: 240 } },
        { content: '', styles: { fillGray: 240 } }
    ]);

    doc.autoTable({
        startY: startY + 5,
        head: [['EMPLOYÉ', 'MATRICULE', 'SALAIRE BRUT', 'CNPS 6.3%', 'I.T.S.', 'NET À PAYER', 'STATUT']],
        body: tableBody,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillGray: 40, textColor: 255 },
        columnStyles: {
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right', fontStyle: 'bold' }
        }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Certifié sincère et conforme, le livre de paie s'élève à un montant global de ${new Intl.NumberFormat("fr-CI").format(totals.net)} FCFA.`, margin, finalY);

    return doc;
};

/**
 * 6. Template : Convocation à Entretien Disciplinaire
 */
export const generateConvocationPDF = ({ employee, company, date_entretien, heure_entretien, lieu_entretien }: any) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const margin = 20;
    const startY = setupHeader(doc, company, "Convocation à Entretien Disciplinaire");
    
    doc.setFontSize(11);
    doc.text(`Abidjan, le ${new Date().toLocaleDateString('fr-FR')}`, 140, 45);
    
    doc.setFont("helvetica", "bold");
    doc.text(`À Monsieur / Madame ${employee.full_name}`, margin, startY);
    
    doc.setFont("helvetica", "normal");
    const body = `Monsieur / Madame,\n\nNous avons le regret de vous informer que nous envisageons de prendre une sanction disciplinaire à votre égard.\n\nEn application des dispositions légales, nous vous convoquons à un entretien préalable au cours duquel nous vous exposerons les motifs de notre décision et recueillerons vos explications.\n\nCet entretien se déroulera le :\n\n- DATE : ${date_entretien || "___/___/___"}\n- HEURE : ${heure_entretien || "___ : ___"}\n- LIEU : ${lieu_entretien || "Direction des Ressources Humaines"}\n\nConformément au Code du Travail, vous avez la possibilité de vous faire assister par un membre du personnel de l'entreprise ou d'un délégué syndical.\n\nNous vous prions d'agréer, Monsieur / Madame, l'expression de nos salutations distinguées.`;
    
    doc.text(body, margin, startY + 20, { maxWidth: 170, lineHeightFactor: 1.4 });
    
    doc.setFont("helvetica", "bold");
    doc.text("La Direction", 130, startY + 110);
    
    setupReceipt(doc);
    return doc;
};

/**
 * 7. Template : Contrat de Travail (Standard)
 */
export const generateContratPDF = ({ employee, company, type_contrat = 'CDI' }: any) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const margin = 20;
    const startY = setupHeader(doc, company, `CONTRAT DE TRAVAIL À DURÉE ${type_contrat === 'CDD' ? 'DÉTERMINÉE' : 'INDÉTERMINÉE'}`);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const intro = `ENTRE LES SOUSSIGNÉS :\n\n` +
        `La société ${company?.raison_sociale || company?.name || "l'Employeur"}, dont le siège est situé à ${company?.adresse || "Abidjan"}, représentée par son Gérant, Monsieur / Madame ____________________, ci-après dénommée "l'Employeur", d'une part ;\n\n` +
        `ET\n\n` +
        `Monsieur / Madame ${employee.full_name}, né(e) le ________________ à ________________, de nationalité ________________, résidant à ________________, titulaire de la CNI / Titre de Séjour n° ________________, ci-après dénommé(e) "l'Employé", d'autre part.\n\n` +
        `IL A ÉTÉ CONVENU CE QUI SUIT :`;

    doc.text(intro, margin, startY, { maxWidth: 170, lineHeightFactor: 1.3 });
    
    const sections = [
        ["ARTICLE 1 : ENGAGEMENT", `L'employé est engagé par l'employeur en qualité de ${employee.poste || "Collaborateur"} à compter du ${new Date(employee.date_embauche).toLocaleDateString('fr-FR')}.`],
        ["ARTICLE 2 : DURÉE", type_contrat === 'CDI' ? "Le présent contrat est conclu pour une durée indéterminée." : "Le présent contrat est conclu pour une durée déterminée de ________ mois."],
        ["ARTICLE 3 : RÉMUNÉRATION", `En contrepartie de ses services, l'employé percevra un salaire mensuel brut imposable de ${new Intl.NumberFormat("fr-CI").format(employee.salaire_brut || 0)} FCFA.`],
        ["ARTICLE 4 : CONGÉS", "L'employé a droit à un congé payé conformément aux dispositions du Code du Travail de Côte d'Ivoire."]
    ];

    doc.autoTable({
        startY: startY + 85,
        body: sections,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
    });
    
    const currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.text("Fait à Abidjan, le " + new Date().toLocaleDateString('fr-FR'), margin, currentY);
    
    setupSignatures(doc, "L'Employé", "L'Employeur");
    return doc;
};

/**
 * 8. Template : Fiche de Poste
 */
export const generateFichePostePDF = ({ employee, company, mission = "", responsabilites = [] }: any) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const margin = 20;
    const startY = setupHeader(doc, company, "Fiche de Poste");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`INTITULÉ : ${employee.poste || "Non défini"}`, margin, startY);
    doc.text(`TITULAIRE : ${employee.full_name}`, margin, startY + 8);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("MISSION GÉNÉRALE :", margin, startY + 20);
    doc.text(mission || "Contribuer au développement et au bon fonctionnement de l'entreprise par l'exécution rigoureuse des tâches confiées.", margin, startY + 26, { maxWidth: 170 });
    
    const tableBody = responsabilites.length > 0 
        ? responsabilites.map((r: string, i: number) => [i + 1, r])
        : [[1, "Exécuter les ordres de la hiérarchie"], [2, "Assurer la qualité du travail rendu"], [3, "Respecter le règlement intérieur"]];

    doc.autoTable({
        startY: startY + 45,
        head: [['#', 'RESPONSABILITÉS ET MISSIONS PRINCIPALES']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillGray: 80, textColor: 255 }
    });
    
    return doc;
};

/**
 * Utilitaires d'export
 */
export const exportPDF = (doc: jsPDF, fileName: string) => {
    doc.save(`${fileName}.pdf`);
};
