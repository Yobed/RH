export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { PaieDialog } from "@/components/rh/PaieDialog";
import { PaieStatusButton } from "@/components/rh/PaieStatusButton";
import Link from "next/link";
import { PaieExportButton } from "@/components/rh/PaieExportButton";
import { LivrePaieButton } from "@/components/rh/LivrePaieButton";

export const metadata = { title: "Paie — RH Manager CI" };

const StatutBadge = ({ statut }: { statut: string }) => {
  if (statut === "payé") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {statut}
      </span>
    );
  }
  if (statut === "validé") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        {statut}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      {statut}
    </span>
  );
};

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n);

const formatPeriode = (p: string) => {
  if (!p) return "";
  const [yyyy, mm] = p.split("-");
  const d = new Date(parseInt(yyyy), parseInt(mm) - 1);
  const m = d.toLocaleDateString("fr-CI", { month: "short" }).replace('.', '');
  return `${m} ${yyyy}`;
};

export default async function PaiePage() {
  const supabase = createServerClient();

  const [{ data: bulletins }, { data: employees }, { data: company }] = await Promise.all([
    supabase
      .from("bulletins_paie")
      .select(`id, periode, salaire_brut, cnps_salarie, its, autres_retenues, avances, salaire_net, statut,
               sursalaire, prime_anciennete, prime_exceptionnelle, prime_salissure,
               prime_depassement, prime_fonction, prime_transport, details,
               employee_id, employees(full_name, poste, matricule)`)
      .order("periode", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("employees")
      .select("id, full_name, matricule, salaire_brut, date_embauche, sursalaire, prime_exceptionnelle, prime_salissure, prime_depassement, prime_fonction, prime_transport")
      .eq("statut", "actif")
      .order("full_name"),
    supabase.from("companies").select("*").single(),
  ]);

  const currentPeriode = new Date().toISOString().slice(0, 7);
  const bulletinsMois = bulletins?.filter((b) => b.periode === currentPeriode) ?? [];
  const masseSalariale = bulletinsMois.reduce((s, b) => s + Number(b.salaire_net), 0);
  const masseCharges = bulletinsMois.reduce((s, b) => s + Number(b.cnps_salarie) + Number(b.its), 0);
  const nbPayes = bulletinsMois.filter((b) => b.statut === "payé").length;

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bulletins de Paie</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            CNPS retraite 6,3% + CMU 1 600 FCFA + ITS barème progressif — Droit ivoirien 2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PaieExportButton periode={currentPeriode} />
          <LivrePaieButton bulletins={bulletinsMois} company={company} periode={currentPeriode} />
          <PaieDialog employees={employees ?? []} company={company} />
        </div>
      </div>

      {/* KPI mois courant */}
      {bulletinsMois.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Masse salariale nette</p>
            <p className="mt-3 text-2xl font-bold text-slate-900 font-mono tabular-nums">{fmt(masseSalariale)}</p>
            <p className="mt-1 text-xs text-slate-400">{bulletinsMois.length} bulletin(s) · {currentPeriode}</p>
          </div>
          <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Total charges (CNPS + ITS)</p>
            <p className="mt-3 text-2xl font-bold text-slate-900 font-mono tabular-nums">{fmt(masseCharges)}</p>
            <p className="mt-1 text-xs text-slate-400">Retenues salariales du mois</p>
          </div>
          <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Bulletins payés</p>
            <p className="mt-3 text-2xl font-bold text-slate-900 font-mono tabular-nums">{nbPayes}</p>
            <p className="mt-1 text-xs text-slate-400">sur {bulletinsMois.length} ce mois</p>
          </div>
        </div>
      )}

      {/* Rappel légal */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-800">
        <p className="font-semibold mb-2">Calcul automatique — Références légales 2026</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
          <span>CNPS retraite salarié : <strong>6,3%</strong> (plafond 1 647 315 FCFA/mois)</span>
          <span>CMU (CNAM) salariale : <strong>1 600 FCFA</strong> forfait/mois</span>
          <span>ITS : barème progressif (0% → 12% → 18% → 25% → 32%)</span>
          <span>Abattement ITS : <strong>15%</strong> charges professionnelles</span>
          <span>Charges patronales : <strong>~{Math.round((0.05 + 0.0075 + 0.077 + 0.03 + 0.01) * 100)}%</strong> + CMU 1 600 FCFA</span>
          <span>FDFP : <strong>1%</strong> masse salariale</span>
        </div>
      </div>

      {/* Liste bulletins */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-3">Tous les bulletins</h2>

        {!bulletins || bulletins.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <p className="font-medium text-slate-400">Aucun bulletin de paie</p>
            <p className="mt-1 text-sm text-slate-400">Créez le premier bulletin du mois.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">Employé</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">Période</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-400 hidden lg:table-cell">Brut</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-400 hidden lg:table-cell">CNPS</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-400 hidden lg:table-cell">ITS</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-400">Net</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">Statut</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-400 min-w-[130px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bulletins.map((b) => {
                  const empRaw = b.employees;
                  const emp = Array.isArray(empRaw) ? empRaw[0] : empRaw;
                  const detailsObj = b.details as { heures_sup?: { h15: number, h50: number, h75: number }; nb_jours_absence?: number } | null;
                  return (
                    <tr key={b.id} className="group hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        <p className="font-semibold text-slate-800">{emp?.full_name ?? "—"}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{emp?.matricule}</p>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono tabular-nums text-xs uppercase tracking-wider text-slate-500">
                        {formatPeriode(b.periode)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right hidden lg:table-cell font-mono tabular-nums text-slate-500">{fmt(b.salaire_brut)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono tabular-nums text-rose-500 hidden lg:table-cell">− {fmt(b.cnps_salarie)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono tabular-nums text-rose-500 hidden lg:table-cell">− {fmt(b.its)}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold font-mono tabular-nums text-emerald-700">{fmt(b.salaire_net)}</td>
                      <td className="px-4 py-3 text-sm">
                        <StatutBadge statut={b.statut ?? "brouillon"} />
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {b.statut === "brouillon" && (
                            <PaieDialog
                              employees={employees ?? []}
                              company={company}
                              bulletin={{
                                id: b.id,
                                periode: b.periode,
                                employee_id: (b as Record<string, unknown>).employee_id as string,
                                employee_name: emp?.full_name ?? "—",
                                salaire_brut: Number(b.salaire_brut),
                                sursalaire: Number((b as Record<string, unknown>).sursalaire ?? 0),
                                prime_anciennete: Number((b as Record<string, unknown>).prime_anciennete ?? 0),
                                prime_exceptionnelle: Number((b as Record<string, unknown>).prime_exceptionnelle ?? 0),
                                prime_salissure: Number((b as Record<string, unknown>).prime_salissure ?? 0),
                                prime_depassement: Number((b as Record<string, unknown>).prime_depassement ?? 0),
                                prime_fonction: Number((b as Record<string, unknown>).prime_fonction ?? 0),
                                prime_transport: Number((b as Record<string, unknown>).prime_transport ?? 0),
                                heures_sup_h15: detailsObj?.heures_sup?.h15 ?? 0,
                                heures_sup_h50: detailsObj?.heures_sup?.h50 ?? 0,
                                heures_sup_h75: detailsObj?.heures_sup?.h75 ?? 0,
                                autres_retenues: Number(b.autres_retenues ?? 0),
                                avances: Number(b.avances ?? 0),
                                nb_jours_absence: detailsObj?.nb_jours_absence ?? 0,
                              }}
                            />
                          )}
                          <PaieStatusButton bulletinId={b.id} currentStatut={b.statut ?? "brouillon"} />
                          <Link
                            href={`/paie/${b.id}/print`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                          >
                            Imprimer
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
