import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

const HEADERS = [
  "Matricule/Nom",
  "Jours de présence",
  "Salaire de base",
  "Sursalaire",
  "Prime d'ancienneté",
  "Indemnité de transport",
  "Indemnité congés payés",
  "Heures supplémentaires",
  "*** SALAIRE BRUT ***",
  "*** INDEMNITE EXONEREE ***",
  "*** BRUT FISCAL ***",
  "*** BRUT SOCIAL ***",
  "Impôts sur salaire (IS)",
  "Contribution nationale (CN)",
  "Impôt général sur revenu (IGR)",
  "Retenue CNPS",
  "*** TOTAL DES COTISATIONS ***",
  "*** NET AVANT RETENUE ***",
  "Reprise arrondi de paie (M-1)",
  "Reprise paie négative (M-1)",
  "Avance paie négative",
  "Arrondi de paie",
  "NET A PAYER",
];

const EXAMPLE_ROW = [
  "EMP001 KOFFI Jean",
  "26",
  "350000",
  "0",
  "15000",
  "20000",
  "0",
  "0",
  "385000",
  "20000",
  "365000",
  "365000",
  "0",
  "5475",
  "42000",
  "24255",
  "71730",
  "313270",
  "0",
  "0",
  "0",
  "0",
  "313270",
];

export async function GET() {
  const wb = XLSX.utils.book_new();

  // Feuille 1 — Paie Sage
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, EXAMPLE_ROW]);
  ws["!cols"] = HEADERS.map(() => ({ wch: 30 }));
  XLSX.utils.book_append_sheet(wb, ws, "Paie Sage");

  // Feuille 2 — Instructions
  const instructions = [
    ["Instructions pour l'import Sage Paie", ""],
    ["1.", "Exportez votre livre de paie depuis Sage Paie"],
    ["2.", "Copiez-collez vos données dans les colonnes de la feuille 'Paie Sage'"],
    ["3.", "Sauvegardez et importez ce fichier via la page Import Paie Sage"],
    ["Colonnes obligatoires:", "Salaire de base, NET A PAYER"],
    ["Colonnes optionnelles:", "Toutes les autres colonnes (22 colonnes Sage complètes)"],
    [
      "Note header:",
      "Si vous importez un fichier Sage natif, le système détecte automatiquement la ligne d'en-tête",
    ],
  ];
  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions["!cols"] = [{ wch: 25 }, { wch: 65 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-import-sage.xlsx"',
    },
  });
}
