import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { calculerJoursAcquis, calculerSoldeConges, SoldeConges } from "@/lib/conges-ci";

export const dynamic = 'force-dynamic';

/**
 * GET /api/conges/balance?employee_id=UUID&annee=YYYY
 * Retourne le solde de congés de l'employé pour l'année.
 * Si aucune ligne n'existe dans leave_balances, calcule à la volée.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const employee_id = url.searchParams.get("employee_id");
  const anneeParam = url.searchParams.get("annee");

  if (!employee_id) {
    return NextResponse.json({ error: "Paramètre employee_id requis" }, { status: 400 });
  }

  const annee = anneeParam ? parseInt(anneeParam, 10) : new Date().getFullYear();
  if (isNaN(annee)) {
    return NextResponse.json({ error: "Paramètre annee invalide" }, { status: 400 });
  }

  // Vérifier si une ligne existe en base
  const { data: existingBalance } = await supabase
    .from("leave_balances")
    .select("jours_acquis, jours_pris, solde, annee")
    .eq("employee_id", employee_id)
    .eq("annee", annee)
    .single();

  if (existingBalance) {
    const soldeConges: SoldeConges = {
      jours_acquis: existingBalance.jours_acquis,
      jours_pris: existingBalance.jours_pris,
      solde: existingBalance.solde,
      annee: existingBalance.annee,
    };
    return NextResponse.json(soldeConges);
  }

  // Pas de ligne : calculer à la volée et insérer (upsert)
  const { data: emp } = await supabase
    .from("employees")
    .select("date_embauche, company_id")
    .eq("id", employee_id)
    .single();

  if (!emp) {
    return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });
  }

  const joursAcquis = calculerJoursAcquis(emp.date_embauche, annee);

  // Calculer les jours pris (congés annuels approuvés pour l'année)
  const debutAnnee = `${annee}-01-01`;
  const finAnnee = `${annee}-12-31`;
  const { data: congesApprouves } = await supabase
    .from("conges")
    .select("nb_jours")
    .eq("employee_id", employee_id)
    .eq("type", "annuel")
    .eq("statut", "approuve")
    .gte("date_debut", debutAnnee)
    .lte("date_debut", finAnnee);

  const jours_pris = (congesApprouves ?? []).reduce((acc, c) => acc + c.nb_jours, 0);
  const solde = calculerSoldeConges(joursAcquis, jours_pris);

  // Upsert dans leave_balances
  await supabase.from("leave_balances").upsert(
    {
      company_id: emp.company_id,
      employee_id,
      annee,
      jours_acquis: joursAcquis,
      jours_pris,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id,employee_id,annee" }
  );

  const soldeConges: SoldeConges = {
    jours_acquis: joursAcquis,
    jours_pris,
    solde,
    annee,
  };
  return NextResponse.json(soldeConges);
}

const postSchema = z.object({
  employee_id: z.string().uuid(),
  annee: z.number().int().min(2000).max(2100),
});

/**
 * POST /api/conges/balance
 * Force le recalcul du solde (upsert). Utile pour cron mensuelle.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.issues }, { status: 400 });
  }

  const { employee_id, annee } = parsed.data;

  const { data: emp } = await supabase
    .from("employees")
    .select("date_embauche, company_id")
    .eq("id", employee_id)
    .single();

  if (!emp) {
    return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });
  }

  const joursAcquis = calculerJoursAcquis(emp.date_embauche, annee);

  const debutAnnee = `${annee}-01-01`;
  const finAnnee = `${annee}-12-31`;
  const { data: congesApprouves } = await supabase
    .from("conges")
    .select("nb_jours")
    .eq("employee_id", employee_id)
    .eq("type", "annuel")
    .eq("statut", "approuve")
    .gte("date_debut", debutAnnee)
    .lte("date_debut", finAnnee);

  const jours_pris = (congesApprouves ?? []).reduce((acc, c) => acc + c.nb_jours, 0);
  const solde = calculerSoldeConges(joursAcquis, jours_pris);

  const { error } = await supabase.from("leave_balances").upsert(
    {
      company_id: emp.company_id,
      employee_id,
      annee,
      jours_acquis: joursAcquis,
      jours_pris,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id,employee_id,annee" }
  );

  if (error) {
    return NextResponse.json({ error: "Erreur lors du recalcul" }, { status: 500 });
  }

  const soldeConges: SoldeConges = {
    jours_acquis: joursAcquis,
    jours_pris,
    solde,
    annee,
  };
  return NextResponse.json(soldeConges);
}

