import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

const COLUMNS = [
  { header: "matricule", example: "EMP001" },
  { header: "full_name", example: "Koffi Jean-Baptiste" },
  { header: "genre", example: "M" },
  { header: "date_naissance", example: "15/06/1990" },
  { header: "date_embauche", example: "01/03/2022" },
  { header: "type_contrat", example: "CDI" },
  { header: "poste", example: "Comptable" },
  { header: "departement", example: "Finance" },
  { header: "categorie", example: "5" },
  { header: "salaire_brut", example: "350000" },
  { header: "statut", example: "actif" },
  { header: "email", example: "koffi.jean@entreprise.ci" },
  { header: "telephone", example: "0707070707" },
];

export async function GET() {
  const wb = XLSX.utils.book_new();

  // Feuille 1 — Template import
  const headers = COLUMNS.map((c) => c.header);
  const example = COLUMNS.map((c) => c.example);
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);

  // Largeur colonnes
  ws["!cols"] = COLUMNS.map(() => ({ wch: 22 }));

  XLSX.utils.book_append_sheet(wb, ws, "Employés");

  // Feuille 2 — Légende
  const legend = [
    ["Champ", "Description", "Valeurs acceptées", "Obligatoire"],
    ["matricule", "Identifiant unique employé", "Texte libre", "Non"],
    ["full_name", "Nom complet", "Texte libre", "Oui"],
    ["genre", "Genre", "M ou F", "Oui"],
    ["date_naissance", "Date de naissance", "DD/MM/YYYY ou YYYY-MM-DD", "Non"],
    ["date_embauche", "Date d'embauche", "DD/MM/YYYY ou YYYY-MM-DD", "Oui"],
    ["type_contrat", "Type de contrat", "CDI ou CDD", "Oui"],
    ["poste", "Intitulé du poste", "Texte libre", "Oui"],
    ["departement", "Département", "Texte libre", "Non"],
    ["categorie", "Catégorie professionnelle", "Chiffre ou texte", "Non"],
    ["salaire_brut", "Salaire brut mensuel (FCFA)", "Nombre entier", "Oui"],
    ["statut", "Statut du contrat", "actif ou inactif", "Non (défaut: actif)"],
    ["email", "Email professionnel", "Format email valide", "Non"],
    ["telephone", "Numéro de téléphone", "Texte libre", "Non"],
  ];
  const wsLegend = XLSX.utils.aoa_to_sheet(legend);
  wsLegend["!cols"] = [{ wch: 20 }, { wch: 30 }, { wch: 30 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsLegend, "Légende");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template_import_employes.xlsx"',
    },
  });
}
