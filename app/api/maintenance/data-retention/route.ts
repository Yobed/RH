import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/maintenance/data-retention
 *
 * Purge automatique des données dont la durée de conservation légale est expirée.
 * Doit être déclenché par Vercel Cron (`crons` dans vercel.json) ou n8n,
 * authentifié via le header `x-cron-secret` valant CRON_SECRET.
 *
 * Référentiel des durées : table `data_retention_policy`.
 *
 * - sanctions disciplinaires expirées (Art. 28.4 CT-CI : 2 ans après notification)
 * - candidats non retenus de plus de 2 ans (recommandation ARTCI)
 *
 * Les bulletins, contrats, accidents, dossiers médicaux ne sont jamais
 * supprimés — leur archivage est suivi via `date_archivage_prevue`.
 */
interface PurgeReport {
  ok: boolean;
  ranAt: string;
  disciplinary: { archived: number };
  candidates: { deleted: number };
  errors: string[];
}

export async function GET(req: Request): Promise<NextResponse> {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET non configuré" }, { status: 500 });
  }
  // Vercel Cron natif envoie Authorization: Bearer <CRON_SECRET>
  // Les appels manuels / n8n peuvent utiliser x-cron-secret
  const auth = req.headers.get("authorization") ?? "";
  const customHeader = req.headers.get("x-cron-secret") ?? "";
  const bearerOk = auth === `Bearer ${expected}`;
  const customOk = customHeader === expected;
  if (!bearerOk && !customOk) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supaUrl || !serviceKey) {
    return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 });
  }

  const supa = createClient(supaUrl, serviceKey);
  const errors: string[] = [];
  const today = new Date().toISOString().slice(0, 10);

  // 1. Marquer les sanctions disciplinaires éligibles à archivage (Art. 28.4)
  let disciplinaryArchived = 0;
  try {
    const { data, error } = await supa
      .from("disciplinary_procedures")
      .update({ statut: "ARCHIVE" })
      .lte("date_archivage_prevue", today)
      .neq("statut", "ARCHIVE")
      .select("id");
    if (error) throw error;
    disciplinaryArchived = (data ?? []).length;
  } catch (err) {
    errors.push(`disciplinary: ${err instanceof Error ? err.message : "erreur"}`);
  }

  // 2. Supprimer les candidatures rejetées de plus de 2 ans
  let candidatesDeleted = 0;
  try {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 2);
    const { data, error } = await supa
      .from("candidates")
      .delete()
      .lte("created_at", cutoff.toISOString())
      .in("statut", ["rejete", "refuse"])
      .select("id");
    if (error) throw error;
    candidatesDeleted = (data ?? []).length;
  } catch (err) {
    errors.push(`candidates: ${err instanceof Error ? err.message : "erreur"}`);
  }

  const report: PurgeReport = {
    ok: errors.length === 0,
    ranAt: new Date().toISOString(),
    disciplinary: { archived: disciplinaryArchived },
    candidates: { deleted: candidatesDeleted },
    errors,
  };

  return NextResponse.json(report);
}
