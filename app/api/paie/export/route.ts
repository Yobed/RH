import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/paie/export?periode=YYYY-MM
 * Exporte le journal de paie du mois sélectionné au format CSV.
 * Colonnes : Matricule, Nom, Salaire Brut, Heures Sup, Retenues CNPS, Retenues ITS,
 *            Retenues CMU, Charges Patronales, Salaire Net, Mode de paiement
 */
export async function GET(req: Request) {
  const supabase = createServerClient();

  // Authentification obligatoire
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Récupération du company_id via RLS
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();
  if (!profile) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 403 });
  }

  // Validation du paramètre période
  const { searchParams } = new URL(req.url);
  const periode = searchParams.get("periode");

  if (!periode || !/^\d{4}-\d{2}$/.test(periode)) {
    return NextResponse.json(
      { error: "Paramètre periode requis au format YYYY-MM" },
      { status: 400 }
    );
  }

  // Récupération des bulletins avec les infos employés
  const { data: bulletins, error } = await supabase
    .from("bulletins_paie")
    .select(
      `id, periode, salaire_brut, sursalaire,
       prime_anciennete, prime_exceptionnelle, prime_salissure,
       prime_depassement, prime_fonction, prime_transport,
       cnps_salarie, its, autres_retenues, avances, salaire_net,
       statut, details,
       employees(full_name, matricule, mode_paiement)`
    )
    .eq("periode", periode)
    .in("statut", ["validé", "en_attente", "payé"])
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!bulletins || bulletins.length === 0) {
    return NextResponse.json(
      { error: `Aucun bulletin trouvé pour la période ${periode}` },
      { status: 404 }
    );
  }

  // Calcul des charges patronales (approximatif pour le journal)
  // Charges patronales CNPS CI : ~17,55% + CMU 1 600 FCFA
  // familiales 5% (plaf 70 000) + maternité 0,75% + retraite 7,7% (plaf) + AT/MP 3% + FDFP 1%
  const PLAFOND_FAMILIALES = 70_000;
  const PLAFOND_CNPS = 1_647_315;
  const CMU_PATRONALE = 1_600;

  function calculerChargesPatronalesTotal(salaireBrut: number): number {
    const baseFamiliales = Math.min(salaireBrut, PLAFOND_FAMILIALES);
    const familiales = Math.round(baseFamiliales * 0.05);
    const maternite = Math.round(salaireBrut * 0.0075);
    const baseRetraite = Math.min(salaireBrut, PLAFOND_CNPS);
    const retraite = Math.round(baseRetraite * 0.077);
    const at_mp = Math.round(salaireBrut * 0.03);
    const fdfp = Math.round(salaireBrut * 0.01);
    return familiales + maternite + retraite + at_mp + CMU_PATRONALE + fdfp;
  }

  // Extraction du montant heures supplémentaires depuis le JSONB details
  function getHeuresSupMontant(details: unknown): number {
    if (!details || typeof details !== "object") return 0;
    const d = details as Record<string, unknown>;
    if (typeof d.heures_sup_montant === "number") return d.heures_sup_montant;
    return 0;
  }

  // Séparateur CSV : point-virgule (compatibilité Excel FR)
  const SEP = ";";

  // En-tête CSV
  const headers = [
    "Matricule",
    "Nom",
    "Salaire Brut",
    "Heures Sup",
    "Retenues CNPS",
    "Retenues ITS",
    "Retenues CMU",
    "Charges Patronales",
    "Salaire Net",
    "Mode de paiement",
  ];

  // Génération des lignes
  const lines: string[] = [];
  lines.push(headers.join(SEP));

  for (const b of bulletins) {
    const empRaw = b.employees;
    const emp = Array.isArray(empRaw) ? empRaw[0] : empRaw;

    // Extraire les parties de cnps_salarie : CNPS retraite = cnps_salarie - 1600 (CMU)
    const cnpsTotal = Number(b.cnps_salarie ?? 0);
    const cmu = Math.min(cnpsTotal, 1_600);
    const cnpsRetraite = cnpsTotal - cmu;

    const salaireBrut = Number(b.salaire_brut ?? 0);
    const chargesPatronales = calculerChargesPatronalesTotal(salaireBrut);
    const heuresSupMontant = getHeuresSupMontant(b.details);

    // Échapper les valeurs textuelles pour CSV
    const escapeCSV = (val: string | null | undefined): string => {
      const s = String(val ?? "");
      if (s.includes(SEP) || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const row = [
      escapeCSV(emp?.matricule),
      escapeCSV(emp?.full_name),
      salaireBrut,
      heuresSupMontant,
      cnpsRetraite,
      Number(b.its ?? 0),
      cmu,
      chargesPatronales,
      Number(b.salaire_net ?? 0),
      escapeCSV((emp as Record<string, unknown> | null)?.mode_paiement as string ?? "Virement"),
    ];

    lines.push(row.join(SEP));
  }

  // BOM UTF-8 pour compatibilité Excel Windows
  const BOM = "\uFEFF";
  const csvContent = BOM + lines.join("\r\n");

  // Nom de fichier suggéré
  const filename = `Journal_Paie_${periode.replace("-", "_")}.csv`;

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
