import { createServerClient } from "@/lib/supabase/server";
import { requirePortailContext } from "@/lib/portail";
import { calculerJoursAcquis, calculerSoldeConges } from "@/lib/conges-ci";
import { CongesClient } from "./CongesClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes congés — Portail salarié" };

export default async function MesCongesPage() {
  const ctx = await requirePortailContext();
  const supabase = createServerClient();
  const year = new Date().getFullYear();

  const [{ data: emp }, { data: conges }, { data: balance }] = await Promise.all([
    supabase.from("employees").select("date_embauche").eq("id", ctx.employeeId).single(),
    supabase
      .from("conges")
      .select("id, type, date_debut, date_fin, nb_jours, statut, commentaire, created_at, refus_motif")
      .eq("employee_id", ctx.employeeId)
      .order("date_debut", { ascending: false }),
    supabase
      .from("leave_balances")
      .select("jours_acquis, jours_pris, solde, annee")
      .eq("employee_id", ctx.employeeId)
      .eq("annee", year)
      .maybeSingle(),
  ]);

  const joursAcquis = balance?.jours_acquis ?? calculerJoursAcquis(emp?.date_embauche ?? null, year);
  const joursPris = balance?.jours_pris ?? 0;
  const solde = balance?.solde ?? calculerSoldeConges(joursAcquis, joursPris);

  return (
    <CongesClient
      conges={(conges ?? []).map((c) => ({
        id: c.id,
        type: c.type,
        date_debut: c.date_debut,
        date_fin: c.date_fin,
        nb_jours: Number(c.nb_jours ?? 0),
        statut: c.statut ?? "en_attente",
        commentaire: c.commentaire,
        refus_motif: c.refus_motif,
        created_at: c.created_at,
      }))}
      solde={{ joursAcquis, joursPris, solde, annee: year }}
    />
  );
}
