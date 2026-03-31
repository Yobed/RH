import { calculerChargesPatronales } from "@/lib/paie-ci";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(n);

interface BulletinRow {
  id: string;
  periode: string;
  salaire_brut: number;
  cnps_salarie: number;
  its: number;
  salaire_net: number;
  sursalaire: number | null;
  prime_anciennete: number | null;
  prime_exceptionnelle: number | null;
  prime_salissure: number | null;
  prime_depassement: number | null;
  prime_fonction: number | null;
  prime_transport: number | null;
  statut: string | null;
  employees: { full_name: string; poste: string; matricule: string } | null;
}

interface StatCard {
  label: string;
  value: number;
  sublabel: string;
  colorClass: string;
}

function StatCard({ label, value, sublabel, colorClass }: StatCard) {
  return (
    <div className="rounded-lg border bg-white p-5 space-y-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
        {label}
      </p>
      <p className={`text-2xl font-bold ${colorClass}`}>{fmt(value)}</p>
      <p className="text-xs text-muted-foreground">{sublabel}</p>
    </div>
  );
}

interface MasseSalarialeDashboardProps {
  bulletins: BulletinRow[];
  periode: string;
}

export function MasseSalarialeDashboard({
  bulletins,
  periode,
}: MasseSalarialeDashboardProps) {
  // Calcul des agrégats
  const totalBrut = bulletins.reduce((s, b) => s + Number(b.salaire_brut), 0);
  const totalNet = bulletins.reduce((s, b) => s + Number(b.salaire_net), 0);

  // Charges patronales calculées sur la base brute de chaque bulletin
  let totalChargesPatronales = 0;
  for (const b of bulletins) {
    const charges = calculerChargesPatronales(Number(b.salaire_brut));
    totalChargesPatronales += charges.total;
  }

  // Coût total employeur = brut + charges patronales
  const coutTotalEmployeur = totalBrut + totalChargesPatronales;

  // Retenues salariales (CNPS salarié + ITS)
  const totalRetenuesSalariales = bulletins.reduce(
    (s, b) => s + Number(b.cnps_salarie) + Number(b.its),
    0
  );

  const nbBulletins = bulletins.length;
  const nbPaies = bulletins.filter((b) => b.statut === "payé").length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Brut"
          value={totalBrut}
          sublabel={`${nbBulletins} bulletin(s) — ${periode}`}
          colorClass="text-foreground"
        />
        <StatCard
          label="Total Net à payer"
          value={totalNet}
          sublabel={`${nbPaies} payé(s) sur ${nbBulletins}`}
          colorClass="text-emerald-700"
        />
        <StatCard
          label="Charges patronales CNPS"
          value={totalChargesPatronales}
          sublabel="Retraite 7,7% + Fam. 5% + Mat. 0,75% + AT 3% + FDFP 1% + CMU"
          colorClass="text-orange-600"
        />
        <StatCard
          label="Retenues salariales"
          value={totalRetenuesSalariales}
          sublabel="CNPS salarié 6,3% + CMU + ITS"
          colorClass="text-red-600"
        />
        <StatCard
          label="Coût total employeur"
          value={coutTotalEmployeur}
          sublabel="Brut + toutes charges patronales"
          colorClass="text-purple-700"
        />
        <div className="rounded-lg border bg-blue-50 border-blue-200 p-5 space-y-1">
          <p className="text-xs text-blue-700 uppercase tracking-wide font-medium">
            Masse salariale / salarié (moy.)
          </p>
          <p className="text-2xl font-bold text-blue-800">
            {nbBulletins > 0 ? fmt(Math.round(coutTotalEmployeur / nbBulletins)) : "—"}
          </p>
          <p className="text-xs text-blue-600">Coût moyen employeur par salarié</p>
        </div>
      </div>

      {/* Détail des charges patronales */}
      <div className="rounded-lg border bg-white p-4">
        <h3 className="text-sm font-semibold mb-3">
          Détail des charges patronales CI (Droit 2026)
        </h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Retraite patronale (7,7%)</span>
            <span className="font-medium">
              {fmt(
                bulletins.reduce((s, b) => {
                  const c = calculerChargesPatronales(Number(b.salaire_brut));
                  return s + c.retraite;
                }, 0)
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Prestations familiales (5%)</span>
            <span className="font-medium">
              {fmt(
                bulletins.reduce((s, b) => {
                  const c = calculerChargesPatronales(Number(b.salaire_brut));
                  return s + c.familiales;
                }, 0)
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Accidents maternité (0,75%)</span>
            <span className="font-medium">
              {fmt(
                bulletins.reduce((s, b) => {
                  const c = calculerChargesPatronales(Number(b.salaire_brut));
                  return s + c.maternite;
                }, 0)
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">AT/MP (3% taux moyen)</span>
            <span className="font-medium">
              {fmt(
                bulletins.reduce((s, b) => {
                  const c = calculerChargesPatronales(Number(b.salaire_brut));
                  return s + c.at_mp;
                }, 0)
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">FDFP (1%)</span>
            <span className="font-medium">
              {fmt(
                bulletins.reduce((s, b) => {
                  const c = calculerChargesPatronales(Number(b.salaire_brut));
                  return s + c.fdfp;
                }, 0)
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">CMU patronale ({nbBulletins} × 1 600 FCFA)</span>
            <span className="font-medium">{fmt(nbBulletins * 1600)}</span>
          </div>
        </div>
      </div>

      {/* Tableau par salarié */}
      {bulletins.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Coût par salarié — {periode}</h3>
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Employé
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden md:table-cell">
                    Brut
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden lg:table-cell">
                    Charges patron.
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Coût total
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden md:table-cell">
                    Net salarié
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bulletins.map((b) => {
                  const charges = calculerChargesPatronales(Number(b.salaire_brut));
                  const coutTotal = Number(b.salaire_brut) + charges.total;
                  return (
                    <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{b.employees?.full_name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.employees?.poste ?? ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        {fmt(Number(b.salaire_brut))}
                      </td>
                      <td className="px-4 py-3 text-right text-orange-600 hidden lg:table-cell">
                        + {fmt(charges.total)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-purple-700">
                        {fmt(coutTotal)}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-700 hidden md:table-cell">
                        {fmt(Number(b.salaire_net))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t bg-muted/30">
                <tr>
                  <td className="px-4 py-3 font-semibold text-sm">Total</td>
                  <td className="px-4 py-3 text-right font-semibold hidden md:table-cell">
                    {fmt(totalBrut)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-orange-600 hidden lg:table-cell">
                    + {fmt(totalChargesPatronales)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-purple-700">
                    {fmt(coutTotalEmployeur)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700 hidden md:table-cell">
                    {fmt(totalNet)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
