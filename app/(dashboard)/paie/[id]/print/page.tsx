import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/rh/PrintButton";

export const metadata = { title: "Bulletin de paie" };

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n);

function Row({ label, value, bold, red }: { label: string; value: string; bold?: boolean; red?: boolean }) {
  return (
    <tr className="border-b last:border-0">
      <td className={`py-1.5 pr-4 text-sm ${bold ? "font-semibold" : ""}`}>{label}</td>
      <td className={`py-1.5 text-right text-sm ${bold ? "font-bold" : ""} ${red ? "text-red-600" : ""}`}>{value}</td>
    </tr>
  );
}

export default async function PrintBulletinPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();

  const { data: bulletin } = await supabase
    .from("bulletins_paie")
    .select(`
      id, periode, salaire_brut, cnps_salarie, its, autres_retenues, avances, salaire_net, statut,
      employees(full_name, poste, matricule, date_embauche, departement)
    `)
    .eq("id", params.id)
    .single();

  if (!bulletin) notFound();

  const emp = bulletin.employees as unknown as {
    full_name: string;
    poste: string;
    matricule: string;
    date_embauche: string;
    departement: string | null;
  } | null;

  const totalRetenues = Number(bulletin.cnps_salarie) + Number(bulletin.its) + Number(bulletin.autres_retenues ?? 0) + Number(bulletin.avances ?? 0);

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Boutons (cachés à l'impression) */}
      <div className="mb-6 flex gap-3 print:hidden">
        <PrintButton />
        <a href="/paie" className="rounded-md border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors">
          ← Retour
        </a>
      </div>

      {/* Bulletin */}
      <div className="mx-auto max-w-2xl border rounded-lg p-8 print:border-0 print:p-0 print:max-w-full">
        {/* En-tête */}
        <div className="flex items-start justify-between border-b pb-4 mb-6">
          <div>
            <h1 className="text-xl font-bold">Bulletin de Paie</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Période : {bulletin.periode}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Statut</p>
            <p className="text-sm font-semibold capitalize">{bulletin.statut}</p>
          </div>
        </div>

        {/* Employé */}
        <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Employé</p>
            <p className="font-bold text-base">{emp?.full_name ?? "—"}</p>
            <p className="text-muted-foreground">{emp?.poste}</p>
            {emp?.departement && <p className="text-muted-foreground">{emp.departement}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Informations</p>
            <p><span className="text-muted-foreground">Matricule :</span> <span className="font-mono">{emp?.matricule}</span></p>
            {emp?.date_embauche && (
              <p><span className="text-muted-foreground">Embauche :</span> {new Date(emp.date_embauche).toLocaleDateString("fr-CI")}</p>
            )}
          </div>
        </div>

        {/* Tableau des éléments */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Éléments de rémunération</p>
          <table className="w-full">
            <thead>
              <tr className="border-b-2">
                <th className="py-2 text-left text-sm font-semibold">Libellé</th>
                <th className="py-2 text-right text-sm font-semibold">Montant</th>
              </tr>
            </thead>
            <tbody>
              <Row label="Salaire brut" value={fmt(bulletin.salaire_brut)} bold />
              <Row label="CNPS salarié (4,4%)" value={`− ${fmt(bulletin.cnps_salarie)}`} red />
              <Row label="ITS (barème progressif)" value={`− ${fmt(bulletin.its)}`} red />
              {Number(bulletin.autres_retenues ?? 0) > 0 && (
                <Row label="Autres retenues" value={`− ${fmt(bulletin.autres_retenues!)}`} red />
              )}
              {Number(bulletin.avances ?? 0) > 0 && (
                <Row label="Avances sur salaire" value={`− ${fmt(bulletin.avances!)}`} red />
              )}
            </tbody>
          </table>
        </div>

        {/* Net à payer */}
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">NET À PAYER</p>
            <p className="text-xs text-emerald-600 mt-0.5">Brut {fmt(bulletin.salaire_brut)} − Retenues {fmt(totalRetenues)}</p>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{fmt(bulletin.salaire_net)}</p>
        </div>

        {/* Références légales */}
        <div className="mt-6 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Bulletin établi conformément au Code du Travail ivoirien (Loi n°2015-532) et aux dispositions de la CNPS (DCMP).
            CNPS salarié : 4,4% — ITS : barème progressif avec abattement 15%.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Généré le {new Date().toLocaleDateString("fr-CI")} — RH Manager CI
          </p>
        </div>
      </div>
    </div>
  );
}
