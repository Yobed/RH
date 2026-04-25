"use client";

import { calculerChargesPatronales } from "@/lib/paie-ci";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Banknote, Calculator, Briefcase, Landmark, ShieldCheck } from "lucide-react";

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

interface StatCardProps {
  label: string;
  value: number;
  sublabel: string;
  colorTheme: "emerald" | "rose" | "amber" | "violet" | "slate" | "sky";
  icon: React.ReactNode;
}

function StatCard({ label, value, sublabel, colorTheme, icon }: StatCardProps) {
  const themes = {
    emerald: "border-emerald-500 from-emerald-50 text-emerald-800 bg-emerald-100 text-emerald-600 value-emerald",
    rose: "border-rose-500 from-rose-50 text-rose-800 bg-rose-100 text-rose-600 value-slate",
    amber: "border-amber-500 from-amber-50 text-amber-800 bg-amber-100 text-amber-600 value-amber",
    violet: "border-violet-500 from-violet-50 text-violet-800 bg-violet-100 text-violet-600 value-violet",
    slate: "border-slate-500 from-slate-50 text-slate-800 bg-slate-100 text-slate-600 value-slate",
    sky: "border-sky-500 from-sky-50 text-sky-800 bg-sky-100 text-sky-600 value-sky",
  };

  const currentTheme = themes[colorTheme] || themes.slate;

  return (
    <div className={`rounded-xl border-l-4 ${currentTheme.split(' ')[0]} bg-gradient-to-br ${currentTheme.split(' ')[1]} to-white p-5 shadow-sm`}>
      <div className="flex items-start justify-between">
        <p className={`text-xs font-bold uppercase tracking-wider ${currentTheme.split(' ')[2]}`}>
          {label}
        </p>
        <div className={`rounded-full p-2 shadow-sm ${currentTheme.split(' ')[3]} ${currentTheme.split(' ')[4]}`}>
          {icon}
        </div>
      </div>
      <p className={`mt-3 text-3xl font-bold tracking-tight ${colorTheme === "emerald" ? "text-emerald-700" : (colorTheme === "amber" ? "text-amber-700" : (colorTheme === "violet" ? "text-violet-700" : "text-slate-800"))}`}>
        {fmt(value)}
      </p>
      <p className={`mt-1.5 text-xs font-medium ${currentTheme.split(' ')[4]}`}>
        {sublabel}
      </p>
    </div>
  );
}

interface MasseSalarialeDashboardProps {
  bulletins: BulletinRow[];
  periode: string;
  tauxAtMp?: number;
}

export function MasseSalarialeDashboard({
  bulletins,
  periode,
  tauxAtMp = 0.03, // Valeur par défaut de 3%
}: MasseSalarialeDashboardProps) {
  // Calcul des agrégats
  const totalBrut = bulletins.reduce((s, b) => s + Number(b.salaire_brut), 0);
  const totalNet = bulletins.reduce((s, b) => s + Number(b.salaire_net), 0);

  // Charges patronales calculées sur la base brute de chaque bulletin
  let totalChargesPatronales = 0;
  for (const b of bulletins) {
    const charges = calculerChargesPatronales(Number(b.salaire_brut), tauxAtMp);
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

  const dataDonut = [
    { name: "Net Salarié", value: totalNet, color: "#059669" }, // emerald-600
    { name: "Retenues Salariales", value: totalRetenuesSalariales, color: "#e11d48" }, // rose-600
    { name: "Charges Patronales", value: totalChargesPatronales, color: "#d97706" }, // amber-600
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Brut"
          value={totalBrut}
          sublabel={`${nbBulletins} bulletin(s) — ${periode}`}
          colorTheme="slate"
          icon={<Calculator className="h-4 w-4" />}
        />
        <StatCard
          label="Total Net à payer"
          value={totalNet}
          sublabel={`${nbPaies} payé(s) sur ${nbBulletins}`}
          colorTheme="emerald"
          icon={<Banknote className="h-4 w-4" />}
        />
        <StatCard
          label="Charges patronales"
          value={totalChargesPatronales}
          sublabel="Retraite, AT/MP, FDFP..."
          colorTheme="amber"
          icon={<Landmark className="h-4 w-4" />}
        />
        <StatCard
          label="Retenues salariales"
          value={totalRetenuesSalariales}
          sublabel="CNPS + CMU + ITS"
          colorTheme="rose"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <StatCard
          label="Coût employeur (Total)"
          value={coutTotalEmployeur}
          sublabel="Brut + Charges patronales"
          colorTheme="violet"
          icon={<Briefcase className="h-4 w-4" />}
        />
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-5 space-y-2 flex flex-col justify-center items-start shadow-sm">
          <p className="text-xs text-sky-700 uppercase tracking-wider font-bold">
            Coût moyen / salarié
          </p>
          <p className="text-2xl font-bold text-sky-800">
            {nbBulletins > 0 ? fmt(Math.round(coutTotalEmployeur / nbBulletins)) : "—"}
          </p>
          <p className="text-xs text-sky-600 font-medium tracking-wide">Sur la base de {nbBulletins} employés</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Répartition Graphique */}
        <div className="rounded-xl border bg-white shadow-sm p-6 flex flex-col justify-center min-h-[300px]">
          <h3 className="text-sm font-semibold mb-2 text-slate-800 uppercase tracking-wider text-center">
            Structure du Coût Employeur
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataDonut}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataDonut.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => typeof value === 'number' ? fmt(value) : value} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            {dataDonut.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800">{fmt(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Détail des charges patronales */}
        <div className="lg:col-span-2 rounded-xl border bg-white shadow-sm p-6 flex flex-col">
          <h3 className="text-sm font-semibold mb-6 flex items-center gap-2 text-slate-800 uppercase tracking-wider">
            <Landmark className="h-4 w-4 text-slate-600" />
            Détail des charges patronales CI (2026)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 flex-grow">
            <div className="flex flex-col border-b pb-3">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Retraite patronale (7,7%)</span>
              <span className="text-xl font-bold text-slate-800">
                {fmt(bulletins.reduce((s, b) => s + calculerChargesPatronales(Number(b.salaire_brut), tauxAtMp).retraite, 0))}
              </span>
            </div>
            <div className="flex flex-col border-b pb-3">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Prestations familiales (5%)</span>
              <span className="text-xl font-bold text-slate-800">
                {fmt(bulletins.reduce((s, b) => s + calculerChargesPatronales(Number(b.salaire_brut), tauxAtMp).familiales, 0))}
              </span>
            </div>
            <div className="flex flex-col border-b pb-3">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Accidents maternité (0,75%)</span>
              <span className="text-xl font-bold text-slate-800">
                {fmt(bulletins.reduce((s, b) => s + calculerChargesPatronales(Number(b.salaire_brut), tauxAtMp).maternite, 0))}
              </span>
            </div>
            <div className="flex flex-col border-b pb-3">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">AT/MP ({(tauxAtMp * 100).toFixed(1).replace('.0', '')}%)</span>
              <span className="text-xl font-bold text-slate-800">
                {fmt(bulletins.reduce((s, b) => s + calculerChargesPatronales(Number(b.salaire_brut), tauxAtMp).at_mp, 0))}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">FDFP (1%)</span>
              <span className="text-xl font-bold text-slate-800">
                {fmt(bulletins.reduce((s, b) => s + calculerChargesPatronales(Number(b.salaire_brut), tauxAtMp).fdfp, 0))}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">CMU patronale ({nbBulletins} × 1600)</span>
              <span className="text-xl font-bold text-slate-800">{fmt(nbBulletins * 1600)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau par salarié */}
      {bulletins.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-4 text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-slate-600" />
            Répartition par Salarié
          </h3>
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold text-slate-600">
                    Employé
                  </th>
                  <th className="px-5 py-4 text-right font-semibold text-slate-600 hidden md:table-cell">
                    Brut
                  </th>
                  <th className="px-5 py-4 text-right font-semibold text-amber-700 hidden lg:table-cell">
                    + Charges patron.
                  </th>
                  <th className="px-5 py-4 text-right font-semibold text-violet-800">
                    = Coût total
                  </th>
                  <th className="px-5 py-4 text-right font-semibold text-emerald-700 hidden md:table-cell">
                    Net salarié (Reçu)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bulletins.map((b) => {
                  const charges = calculerChargesPatronales(Number(b.salaire_brut), tauxAtMp);
                  const coutTotal = Number(b.salaire_brut) + charges.total;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{b.employees?.full_name ?? "—"}</p>
                        <p className="text-xs font-medium text-slate-600 mt-0.5">
                          {b.employees?.poste ?? ""}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-slate-600 hidden md:table-cell">
                        {fmt(Number(b.salaire_brut))}
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-amber-600 hidden lg:table-cell">
                        + {fmt(charges.total)}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-violet-700 text-base">
                        {fmt(coutTotal)}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-emerald-600 hidden md:table-cell text-base">
                        {fmt(Number(b.salaire_net))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                <tr>
                  <td className="px-5 py-4 font-bold text-slate-800 text-sm">TOTAL</td>
                  <td className="px-5 py-4 text-right font-bold text-slate-800 hidden md:table-cell">
                    {fmt(totalBrut)}
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-amber-700 hidden lg:table-cell">
                    + {fmt(totalChargesPatronales)}
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-violet-800 text-lg">
                    {fmt(coutTotalEmployeur)}
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-emerald-700 hidden md:table-cell text-lg">
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
