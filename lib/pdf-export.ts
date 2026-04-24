import jsPDF from "jspdf";
import "jspdf-autotable";

// Extension de type pour jsPDF avec autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n);

/**
 * Exporte une simulation de bulletin de paie au format PDF
 */
export function exportSimulationPDF(data: {
  salaireBrut: number;
  sursalaire: number;
  primeTransport: number;
  tauxAtMp: number;
  resultat: any;
  companyName?: string;
}) {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const pageWidth = doc.internal.pageSize.width;

  // Header
  doc.setFillColor(34, 197, 94); // Emerald 600
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("SIMULATION DE BULLETIN", pageWidth / 2, 25, { align: "center" });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const date = new Date().toLocaleDateString("fr-CI", { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Document généré le : ${date}`, 15, 50);
  if (data.companyName) doc.text(`Entreprise : ${data.companyName}`, 15, 55);

  // Section 1: Entrées
  doc.setFont("helvetica", "bold");
  doc.text("PARAMÈTRES DE LA SIMULATION", 15, 65);
  doc.setFont("helvetica", "normal");
  
  const entriesTable = [
    ["Salaire de Base", fmt(data.salaireBrut)],
    ["Sursalaire", fmt(data.sursalaire)],
    ["Indemnité Transport", fmt(data.primeTransport)],
    ["Taux AT/MP Patronal", `${(data.tauxAtMp * 100).toFixed(2)} %`],
  ];

  doc.autoTable({
    startY: 70,
    head: [["Libellé", "Valeur"]],
    body: entriesTable,
    theme: "grid",
    headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold' },
    styles: { fontSize: 9 }
  });

  // Section 2: Résultats Salariés (Retenues)
  const res = data.resultat;
  const retY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFont("helvetica", "bold");
  doc.text("DÉTAIL DU NET À PAYER (SALARIÉ)", 15, retY);
  
  const employeeTable = [
    ["Salaire Brut Total", "", fmt(res.total_brut)],
    ["Retraite CNPS (6.3%)", "-", fmt(res.cnps_retraite)],
    ["CMU Salariale", "-", fmt(res.cmu_salarie || res.cmu)],
    ["ITS (Impôt sur le Revenu)", "-", fmt(res.its)],
    ["TOTAL DES RETENUES", "", fmt(res.total_retenues)],
    ["NET À PAYER", "", fmt(res.salaire_net)],
  ];

  doc.autoTable({
    startY: retY + 5,
    body: employeeTable,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      2: { halign: "right", fontStyle: "bold" }
    },
    didParseCell: (dataCell: any) => {
      if (dataCell.row.index === 0) dataCell.cell.styles.fillColor = [248, 250, 252];
      if (dataCell.row.index === 5) {
        dataCell.cell.styles.fillColor = [236, 253, 245];
        dataCell.cell.styles.textColor = [5, 150, 105];
        dataCell.cell.styles.fontSize = 12;
      }
    }
  });

  // Section 3: Coût Employeur (TCO)
  const tcoY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFont("helvetica", "bold");
  doc.text("COÛT TOTAL EMPLOYEUR (TCO)", 15, tcoY);

  const patronal = res.charges_patronales || {};
  const tcoTable = [
    ["Brut Salarié", fmt(res.total_brut)],
    ["Retraite Patronale (7.7%)", fmt(patronal.retraite || 0)],
    ["Prestations Familiales (5%)", fmt(patronal.familiales || 0)],
    ["Accidents de Travail (AT/MP)", fmt(patronal.at_mp || 0)],
    ["FDFP (1%)", fmt(patronal.fdfp || 0)],
    ["CMU Patronale", fmt(patronal.cmu || 0)],
    ["COÛT TOTAL (TCO)", fmt(res.total_brut + (patronal.total || 0))],
  ];

  doc.autoTable({
    startY: tcoY + 5,
    body: tcoTable,
    theme: "grid",
    styles: { fontSize: 9 },
    columnStyles: {
      1: { halign: "right", fontStyle: "bold" }
    },
    didParseCell: (dataCell: any) => {
      if (dataCell.row.index === 6) {
        dataCell.cell.styles.fillColor = [254, 242, 242];
        dataCell.cell.styles.textColor = [185, 28, 28];
        dataCell.cell.styles.fontSize = 11;
      }
    }
  });

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("RH Manager CI - Logiciel de gestion RH conforme au droit ivoirien", pageWidth / 2, pageHeight - 10, { align: "center" });

  doc.save(`Simulation_Paie_${data.salaireBrut}_${new Date().getTime()}.pdf`);
}

/**
 * Exporte un Solde de Tout Compte au format PDF (Simule ce qui est fait en backend mais utilisable offline)
 */
export function exportSTCPDF(data: {
  employee: any;
  resultat: any;
  company: any;
}) {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const pageWidth = doc.internal.pageSize.width;

  // Header Design
  doc.setFillColor(34, 197, 94);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("SOLDE DE TOUT COMPTE", pageWidth / 2, 25, { align: "center" });

  // Parties
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("EMPLOYEUR :", 15, 55);
  doc.setFont("helvetica", "normal");
  doc.text(data.company?.raison_sociale || data.company?.name || "L'Employeur", 15, 60);
  
  doc.setFont("helvetica", "bold");
  doc.text("SALARIÉ :", 120, 55);
  doc.setFont("helvetica", "normal");
  doc.text(data.employee?.full_name || "Le Salarié", 120, 60);
  doc.text(`Matricule : ${data.employee?.matricule || "N/A"}`, 120, 65);

  // Tableau
  const rows = [
    ["Indemnité de Licenciement", fmt(data.resultat.indemnite_licenciement)],
    ["Indemnité de Précarité", fmt(data.resultat.indemnite_precarite)],
    ["Indemnité Comp. Congés", fmt(data.resultat.indemnite_compensatrice_conges)],
    ["Indemnité de Préavis", fmt(data.resultat.indemnite_preavis)],
    ["TOTAL BRUT STC", fmt(data.resultat.total_brut_stc)],
  ].filter(r => r[1] !== "0 \u00a0FCFA" && r[1] !== "0 FCFA");

  doc.autoTable({
    startY: 80,
    head: [["Rubrique", "Montant Brut"]],
    body: rows,
    headStyles: { fillColor: [34, 197, 94] },
    columnStyles: { 1: { halign: "right" } }
  });

  doc.save(`STC_${data.employee?.full_name || "Salarie"}.pdf`);
}
