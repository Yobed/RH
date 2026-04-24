export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { PaieDialog } from "@/components/rh/PaieDialog";
import { PaieStatusButton } from "@/components/rh/PaieStatusButton";
import { Banknote, Printer } from "lucide-react";
import Link from "next/link";
import { PaieExportButton } from "@/components/rh/PaieExportButton";
import { LivrePaieButton } from "@/components/rh/LivrePaieButton";

export const metadata = { title: "Paie — RH Manager CI" };

const StatutBadge = ({ statut }: { statut: string }) => {
  if (statut === "payé") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
        {statut}
      </span>
    );
  }
  if (statut === "validé") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse"></span>
        {statut}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 border border-slate-200 shadow-sm">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
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

  // KPI masse salariale du mois courant
  const currentPeriode = new Date().toISOString().slice(0, 7);
  const bulletinsMois = bulletins?.filter((b) => b.periode === currentPeriode) ?? [];
  const masseSalariale = bulletinsMois.reduce((s, b) => s + Number(b.salaire_net), 0);
  const masseCharges = bulletinsMois.reduce((s, b) => s + Number(b.cnps_salarie) + Number(b.its), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bulletins de Paie</h1>
          <p className="text-sm text-muted-foreground">
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
          <div className="rounded-xl border-l-4 border-emerald-500 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Masse salariale nette</p>
              <div className="rounded-full bg-emerald-100 p-2 shadow-sm">
                <Banknote className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-800 tracking-tight">{fmt(masseSalariale)}</p>
            <p className="mt-1.5 text-xs font-medium text-emerald-600 flex items-center gap-1">
              <span className="text-lg leading-none">↑</span> {bulletinsMois.length} bulletin(s) · {currentPeriode}
            </p>
          </div>
          <div className="rounded-xl border-l-4 border-rose-500 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">Total charges (CNPS+ITS)</p>
              <div className="rounded-full bg-rose-100 p-2 shadow-sm">
                <Banknote className="h-4 w-4 text-rose-600" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-800 tracking-tight">{fmt(masseCharges)}</p>
            <p className="mt-1.5 text-xs font-medium text-rose-600">Total retenues salariales</p>
          </div>
          <div className="rounded-xl border-l-4 border-sky-500 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold text-sky-800 uppercase tracking-wider">Bulletins Payés</p>
              <div className="rounded-full bg-sky-100 p-2 shadow-sm">
                <Banknote className="h-4 w-4 text-sky-600" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-800 tracking-tight">{bulletinsMois.filter((b) => b.statut === "payé").length}</p>
            <p className="mt-1.5 text-xs font-medium text-sky-600">sur {bulletinsMois.length} ce mois</p>
          </div>
        </div>
      )}

      {/* Rappel légal */}
      <div className="rounded-lg border bg-blue-50 border-blue-200 p-4 text-sm text-blue-800">
        <p className="font-medium mb-2">Calcul automatique — Références légales 2026</p>
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
        <div className="flex items-center gap-2 mb-3">
          <Banknote className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Tous les bulletins</h2>
        </div>

        {!bulletins || bulletins.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <Banknote className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium text-muted-foreground">Aucun bulletin de paie</p>
            <p className="mt-1 text-sm text-muted-foreground">Créez le premier bulletin du mois.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600">Employé</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600">Période</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-slate-600 hidden lg:table-cell">Brut</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-slate-600 hidden lg:table-cell">CNPS</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-slate-600 hidden lg:table-cell">ITS</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-slate-600">Net</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600">Statut</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-slate-600 min-w-[130px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bulletins.map((b) => {
                  const empRaw = b.employees;
                  const emp = Array.isArray(empRaw) ? empRaw[0] : empRaw;
                  const detailsObj = b.details as { heures_sup?: { h15: number, h50: number, h75: number }; nb_jours_absence?: number } | null;
                  return (
                    <tr key={b.id} className="group odd:bg-slate-50/50 hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{emp?.full_name ?? "—"}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{emp?.matricule}</p>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs font-medium uppercase text-slate-600 tracking-wider">
                        {formatPeriode(b.periode)}
                      </td>
                      <td className="px-5 py-4 text-right hidden lg:table-cell font-medium text-slate-500">{fmt(b.salaire_brut)}</td>
                      <td className="px-5 py-4 text-right font-medium text-rose-600 hidden lg:table-cell">− {fmt(b.cnps_salarie)}</td>
                      <td className="px-5 py-4 text-right font-medium text-rose-600 hidden lg:table-cell">− {fmt(b.its)}</td>
                      <td className="px-5 py-4 text-right font-bold text-emerald-700 text-base">{fmt(b.salaire_net)}</td>
                      <td className="px-5 py-4">
                        <StatutBadge statut={b.statut ?? "brouillon"} />
                      </td>
                      <td className="px-5 py-4 text-right">
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
                            className="inline-flex items-center gap-1.5 rounded-md border bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
                          >
                            <Printer className="h-3.5 w-3.5" />
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
