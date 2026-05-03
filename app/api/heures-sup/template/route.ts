/**
 * app/api/heures-sup/template/route.ts
 * ─────────────────────────────────────────────────────────────
 * GET /api/heures-sup/template
 *
 * Génère et retourne un fichier Excel (.xlsx) servant de template
 * pour l'import en masse des heures supplémentaires.
 *
 * Contenu :
 *  - Onglet "Template" : en-têtes + 3 exemples + validation données
 *  - Onglet "Notices"  : barème légal Décret n°96-203
 */

import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

// Palette couleurs RH Manager
const COLOR_HEADER   = "1E293B"; // slate-900
const COLOR_ACCENT   = "3B82F6"; // blue-500
const COLOR_H15      = "EFF6FF"; // blue-50
const COLOR_H50      = "FFFBEB"; // amber-50
const COLOR_H75      = "F5F3FF"; // violet-50
const COLOR_H100     = "FFF1F2"; // rose-50
const COLOR_EXAMPLE  = "F8FAFC"; // slate-50
const COLOR_NOTICE   = "F1F5F9"; // slate-100

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const periodeDefaut = format(new Date(), "yyyy-MM");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "RH Manager CI";
    workbook.created = new Date();

    // ── Onglet 1 : Template ───────────────────────────────────────────────────
    const sheet = workbook.addWorksheet("Template", {
      pageSetup: { fitToPage: true, orientation: "landscape" },
    });

    // Largeurs des colonnes
    sheet.columns = [
      { key: "matricule",    width: 16 },
      { key: "nom_complet", width: 28 },
      { key: "periode",     width: 14 },
      { key: "h15",         width: 14 },
      { key: "h50",         width: 14 },
      { key: "h75",         width: 14 },
      { key: "h100",        width: 14 },
      { key: "commentaire", width: 32 },
    ];

    // En-têtes
    const headers = [
      { label: "matricule *",    col: "A", color: COLOR_HEADER, bg: COLOR_HEADER },
      { label: "nom_complet",    col: "B", color: COLOR_HEADER, bg: COLOR_HEADER },
      { label: "periode *",      col: "C", color: COLOR_HEADER, bg: COLOR_HEADER },
      { label: "h15",            col: "D", color: COLOR_H15,    bg: COLOR_ACCENT },
      { label: "h50",            col: "E", color: COLOR_H50,    bg: COLOR_ACCENT },
      { label: "h75",            col: "F", color: COLOR_H75,    bg: COLOR_ACCENT },
      { label: "h100",           col: "G", color: COLOR_H100,   bg: COLOR_ACCENT },
      { label: "commentaire",    col: "H", color: COLOR_HEADER, bg: COLOR_HEADER },
    ];

    const headerRow = sheet.getRow(1);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h.label;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + h.bg } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: false };
      cell.border = {
        bottom: { style: "medium", color: { argb: "FF64748B" } },
      };
    });
    headerRow.height = 30;

    // Ligne sous-titre (commentaires de colonnes)
    const subtitles = [
      "Matricule employé", "Nom et prénom", `Ex : ${periodeDefaut}`,
      "Heure +15%", "Heures +50%", "Heures +75%", "Heures +100%", "Remarque libre",
    ];
    const subtitleRow = sheet.getRow(2);
    subtitles.forEach((s, i) => {
      const cell = subtitleRow.getCell(i + 1);
      cell.value = s;
      cell.font = { italic: true, color: { argb: "FF94A3B8" }, size: 9 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      cell.alignment = { horizontal: "center" };
    });
    subtitleRow.height = 18;

    // Données exemple (3 lignes)
    const exemples = [
      ["EMP001", "KONAN Kouamé", periodeDefaut, 8,  0, 0, 0, "Pic d'activité"],
      ["EMP002", "BAMBA Fatoumata", periodeDefaut, 0, 4, 0, 0, "Nuit – 22h à 2h"],
      ["EMP003", "YAO Adjoua", periodeDefaut, 0, 0, 3, 2, "Dimanche 11 mai + nuit exceptionnelle"],
    ];

    exemples.forEach((ex, idx) => {
      const row = sheet.getRow(3 + idx);
      ex.forEach((val, i) => {
        const cell = row.getCell(i + 1);
        cell.value = val;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + COLOR_EXAMPLE } };
        cell.font = { color: { argb: "FF64748B" }, italic: true, size: 10 };
        cell.alignment = { horizontal: i < 3 ? "left" : "center" };
      });
      row.height = 20;
    });

    // Lignes de saisie vides (497 lignes pour 500 total)
    for (let r = 6; r <= 502; r++) {
      const row = sheet.getRow(r);
      // Fond alternant très léger
      const bgColor = r % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC";
      for (let c = 1; c <= 8; c++) {
        const cell = row.getCell(c);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
        cell.alignment = { horizontal: c <= 3 ? "left" : "center" };
        cell.font = { size: 10 };
        // Valeurs par défaut 0 pour les colonnes numériques
        if (c >= 4 && c <= 7) {
          cell.value = 0;
          cell.numFmt = "0.00";
        }
      }
      row.height = 18;
    }

    // Gel de la première ligne
    sheet.views = [{ state: "frozen", ySplit: 2, activeCell: "A3" }];

    // ── Onglet 2 : Notices ────────────────────────────────────────────────────
    const noticeSheet = workbook.addWorksheet("Notices");
    noticeSheet.columns = [{ width: 30 }, { width: 70 }];

    const addNoticeTitle = (text: string) => {
      const row = noticeSheet.addRow([text]);
      row.getCell(1).font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
      row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + COLOR_HEADER } };
      noticeSheet.mergeCells(`A${row.number}:B${row.number}`);
      row.height = 24;
    };

    const addNoticeRow = (label: string, value: string, bgHex = COLOR_NOTICE) => {
      const row = noticeSheet.addRow([label, value]);
      [1, 2].forEach((c) => {
        row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + bgHex } };
        row.getCell(c).font = { size: 10 };
        row.getCell(c).alignment = { wrapText: true, vertical: "top" };
      });
      row.getCell(1).font = { size: 10, bold: true };
      row.height = 20;
    };

    addNoticeTitle("📋 RH Manager CI — Template Import Heures Supplémentaires");
    noticeSheet.addRow([]);

    addNoticeTitle("Référence légale");
    addNoticeRow("Base légale", "Décret n°96-203 du 07 mars 1996 relatif aux conditions de travail, Art. 24 du Code du travail ivoirien");
    addNoticeRow("Heures mensuelles", "173,33 heures (référence de calcul du taux horaire de base)");
    addNoticeRow("Formule taux horaire", "Taux horaire = Salaire brut mensuel ÷ 173,33");
    noticeSheet.addRow([]);

    addNoticeTitle("Paliers de majoration");
    addNoticeRow("h15  (+15%)", "Heures effectuées entre la 41e et la 48e heure de la semaine. Coefficient : 1,15.", COLOR_H15);
    addNoticeRow("h50  (+50%)", "Heures au-delà de la 48e heure hebdomadaire OU heures de nuit (21h–5h). Coefficient : 1,50.", COLOR_H50);
    addNoticeRow("h75  (+75%)", "Heures effectuées le dimanche, les jours fériés, ou la nuit d'un dimanche/férié. Coefficient : 1,75.", COLOR_H75);
    addNoticeRow("h100 (+100%)", "Heures effectuées dans des conditions exceptionnelles prévues par accord d'entreprise (nuit + dimanche + férié cumulés). Coefficient : 2,00.", COLOR_H100);
    noticeSheet.addRow([]);

    addNoticeTitle("Exemple de calcul");
    addNoticeRow("Données", "Employé : salaire brut 350 000 FCFA → taux horaire = 350 000 ÷ 173,33 ≈ 2 019 FCFA/h");
    addNoticeRow("h15 × 8h", "2 019 × 1,15 × 8 = 18 575 FCFA");
    addNoticeRow("h50 × 4h", "2 019 × 1,50 × 4 = 12 114 FCFA");
    addNoticeRow("h75 × 3h", "2 019 × 1,75 × 3 = 10 600 FCFA");
    addNoticeRow("h100 × 2h", "2 019 × 2,00 × 2 = 8 076 FCFA");
    addNoticeRow("Total HS", "18 575 + 12 114 + 10 600 + 8 076 = 49 365 FCFA");
    noticeSheet.addRow([]);

    addNoticeTitle("Règles d'import");
    addNoticeRow("Colonnes obligatoires", "matricule, periode, h15, h50, h75, h100 (les autres sont optionnelles)");
    addNoticeRow("Format période", "YYYY-MM — ex : 2026-05 (une seule période par fichier)");
    addNoticeRow("Matricule", "Doit correspondre exactement au matricule enregistré dans le système");
    addNoticeRow("Valeurs numériques", "Décimales acceptées (ex : 2.5 pour 2h30). Utiliser le point comme séparateur décimal.");
    addNoticeRow("Atomicité", "En cas d'erreur sur une seule ligne, AUCUNE donnée ne sera importée. Corrigez toutes les erreurs avant de réimporter.");
    addNoticeRow("Doublon", "Si des heures existent déjà pour un employé sur la même période, contactez votre RH avant d'importer.");

    // ── Génération du buffer ──────────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `template_heures_sup_${periodeDefaut}.xlsx`;

    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[heures-sup/template] Erreur :", message);
    return NextResponse.json({ error: "Erreur génération template" }, { status: 500 });
  }
}
