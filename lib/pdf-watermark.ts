import jsPDF from "jspdf";

interface TimestampOptions {
  companyName?: string;
  generatedBy?: string;
  documentType?: string;
}

export function addTimestampCachet(doc: jsPDF, options: TimestampOptions = {}): void {
  const pageCount = doc.getNumberOfPages();
  const now = new Date();
  const dateStr = now.toLocaleString("fr-CI", {
    timeZone: "Africa/Abidjan",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const hash = Math.random().toString(36).substring(2, 8).toUpperCase();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Ligne de séparation
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);
    // Cachet
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    const left = options.companyName ? `${options.companyName} — ` : "";
    const center = options.documentType ? `${options.documentType} — ` : "";
    doc.text(`${left}${center}Généré le ${dateStr} — RH Manager CI`, 14, pageHeight - 9);
    doc.text(`Page ${i}/${pageCount} — Réf. ${hash}`, pageWidth - 14, pageHeight - 9, { align: "right" });
    doc.setTextColor(0, 0, 0);
  }
}

export function addDocumentHeader(
  doc: jsPDF,
  title: string,
  companyName: string,
  subtitle?: string
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  // Fond header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 28, "F");
  // Titre
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, 12, { align: "center" });
  // Sous-titre
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 210);
  doc.text(companyName + (subtitle ? ` — ${subtitle}` : ""), pageWidth / 2, 21, { align: "center" });
  // Reset couleurs
  doc.setTextColor(0, 0, 0);
}
