/**
 * app/api/heures-sup/import/route.ts
 * POST /api/heures-sup/import
 *
 * Import en masse des heures supplémentaires depuis un fichier Excel.
 * Atomicité : si une erreur est détectée, aucune donnée n'est insérée.
 */

import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { parseExcelHS, validerLignesHS } from "@/lib/heures-sup-import";
import type { LigneValideeHS } from "@/lib/heures-sup-import";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

export async function POST(req: Request) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { data: companyId, error: cidErr } = await supabase.rpc("get_user_company_id");
    if (cidErr || !companyId) {
      return NextResponse.json({ error: "Entreprise introuvable" }, { status: 403 });
    }

    // ── Fichier ───────────────────────────────────────────────────────────
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Content-Type multipart/form-data requis" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Champ 'file' manquant" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max 5 Mo, reçu ${(file.size / 1024 / 1024).toFixed(1)} Mo)` },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // ── Parse ─────────────────────────────────────────────────────────────
    const parseResult = await parseExcelHS(buffer);
    if (parseResult.erreurs.length > 0) {
      return NextResponse.json(
        { error: "Erreurs de format", details: parseResult.erreurs },
        { status: 422 },
      );
    }

    // ── Employés actifs ───────────────────────────────────────────────────
    const { data: employees, error: empErr } = await supabase
      .from("employees")
      .select("id, matricule, full_name, salaire_brut")
      .eq("company_id", companyId)
      .eq("statut", "actif");

    if (empErr) return NextResponse.json({ error: "Erreur chargement employés" }, { status: 500 });

    // ── Validation métier ─────────────────────────────────────────────────
    const validation = validerLignesHS(parseResult.lignes, employees ?? []);
    if (validation.erreurs.length > 0) {
      return NextResponse.json(
        {
          error: "Validation échouée — aucune donnée importée",
          details: validation.erreurs,
          avertissements: validation.avertissements,
        },
        { status: 422 },
      );
    }

    // ── Import atomique ───────────────────────────────────────────────────
    const batchId = randomUUID();
    const valides = validation.valides;

    // 1. overtime_import_logs (traçabilité)
    const logsPayload = valides.map((v) => ({
      company_id:      companyId,
      import_batch_id: batchId,
      employee_id:     v.employee_id,
      matricule:       v.matricule,
      periode:         v.periode,
      h15:             v.h15,
      h50:             v.h50,
      h75:             v.h75,
      h100:            v.h100,
      montant_calcule: v.montant_calcule,
      commentaire:     v.commentaire ?? null,
      imported_by:     user.id,
    }));

    const { error: logErr } = await supabase.from("overtime_import_logs").insert(logsPayload);
    if (logErr) {
      console.error("[heures-sup/import] overtime_import_logs :", logErr);
      return NextResponse.json({ error: "Erreur insertion traçabilité" }, { status: 500 });
    }

    // 2. overtime_records — une ligne par palier non-nul
    type Palier = { key: "h15" | "h50" | "h75" | "h100"; category: string };
    const paliers: Palier[] = [
      { key: "h15",  category: "15%"  },
      { key: "h50",  category: "50%"  },
      { key: "h75",  category: "75%"  },
      { key: "h100", category: "100%" },
    ];

    const recordsPayload: object[] = [];
    for (const ligne of valides) {
      const date = `${ligne.periode}-01`;
      for (const { key, category } of paliers) {
        const heures = (ligne as LigneValideeHS)[key] as number;
        if (heures <= 0) continue;
        recordsPayload.push({
          company_id:      companyId,
          employee_id:     ligne.employee_id,
          date,
          hours_count:     heures,
          category,
          reason:          ligne.commentaire
            ? `Import Excel ${ligne.periode} — ${ligne.commentaire}`
            : `Import Excel ${ligne.periode}`,
          statut:          "approuve",
          import_batch_id: batchId,
        });
      }
    }

    if (recordsPayload.length > 0) {
      const { error: recErr } = await supabase.from("overtime_records").insert(recordsPayload);
      if (recErr) {
        // Rollback : supprimer les logs déjà insérés
        await supabase.from("overtime_import_logs").delete().eq("import_batch_id", batchId);
        console.error("[heures-sup/import] overtime_records :", recErr);
        return NextResponse.json({ error: "Erreur insertion heures — import annulé" }, { status: 500 });
      }
    }

    return NextResponse.json({
      success:         true,
      import_batch_id: batchId,
      nb_employes:     valides.length,
      nb_lignes_paie:  recordsPayload.length,
      avertissements:  validation.avertissements,
      periode:         valides[0]?.periode ?? null,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[heures-sup/import] Erreur :", msg);
    return NextResponse.json({ error: "Erreur serveur inattendue" }, { status: 500 });
  }
}
