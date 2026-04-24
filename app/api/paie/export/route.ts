import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const periode = searchParams.get("periode"); // e.g. "2024-03"

    let query = supabase.from("bulletins_paie").select(`
      *,
      employee:employees(matricule, full_name, departement)
    `);

    if (periode) {
      query = query.eq("periode", periode);
    }

    const { data: bulletins, error } = await query;

    if (error) throw error;
    if (!bulletins || bulletins.length === 0) {
      return new NextResponse("Aucun bulletin trouvé pour la période", { status: 404 });
    }

    // CSV header
    // Matricule, Nom, Département, Période, Salaire Brut, ITS, CNPS Salarié, Avances, Autres Retenues, Net Primes, Salaire Net
    let csv = "Matricule;Employe;Departement;Periode;Salaire Brut;ITS;CNPS Salarie;Avances;Autres Retenues;Salaire Net\n";

    bulletins.forEach((b) => {
      const matricule = (b.employee as any)?.matricule || "";
      const nom = (b.employee as any)?.full_name || "";
      const dept = (b.employee as any)?.departement || "";
      
      csv += `${matricule};"${nom}";"${dept}";${b.periode};${b.salaire_brut};${b.its};${b.cnps_salarie};${b.avances};${b.autres_retenues};${b.salaire_net}\n`;
    });

    const filename = periode ? `journal_paie_${periode}.csv` : `journal_paie_complet.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (err: any) {
    console.error("Export error", err);
    return new NextResponse("Erreur lors de la génération de l'export", { status: 500 });
  }
}
