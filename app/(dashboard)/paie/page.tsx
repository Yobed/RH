export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { PaieDialog } from "@/components/rh/PaieDialog";
import { PaieStatusButton } from "@/components/rh/PaieStatusButton";
import { Banknote, Printer } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Paie — RH Manager CI" };

const STATUT_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  brouillon: "outline",
  validé: "secondary",
  payé: "default",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n);

export default async function PaiePage() {
  const supabase = createServerClient();

  const [{ data: bulletins }, { data: employees }] = await Promise.all([
    supabase
      .from("bulletins_paie")
      .select(`id, periode, salaire_brut, cnps_salarie, its, autres_retenues, avances, salaire_net, statut,
               employees(full_name, poste, matricule)`)
      .order("periode", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("employees")
      .select("id, full_name, matricule, salaire_brut")
      .eq("statut", "actif")
      .order("full_name"),
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
            Calcul automatique CNPS (4,4%) + ITS — Droit ivoirien
          </p>
        </div>
        <PaieDialog employees={employees ?? []} />
      </div>

      {/* KPI mois courant */}
      {bulletinsMois.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Masse salariale nette</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{fmt(masseSalariale)}</p>
            <p className="text-xs text-muted-foreground">{bulletinsMois.length} bulletin(s) — {currentPeriode}</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total charges (CNPS + ITS)</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{fmt(masseCharges)}</p>
            <p className="text-xs text-muted-foreground">Retenues salariales</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Bulletins payés</p>
            <p className="mt-1 text-2xl font-bold">{bulletinsMois.filter((b) => b.statut === "payé").length}</p>
            <p className="text-xs text-muted-foreground">sur {bulletinsMois.length} ce mois</p>
          </div>
        </div>
      )}

      {/* Rappel légal */}
      <div className="rounded-lg border bg-blue-50 border-blue-200 p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Calcul automatique — Références légales</p>
        <div className="flex flex-wrap gap-4 text-xs">
          <span>🏛 CNPS salarié : <strong>4,4%</strong> du brut (retraite 3,2% + prévoyance 1,2%)</span>
          <span>💰 ITS : barème progressif (0% → 12% → 18% → 25% → 32%)</span>
          <span>📋 Abattement ITS : <strong>15%</strong> charges professionnelles</span>
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
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employé</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Période</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden md:table-cell">Brut</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden lg:table-cell">CNPS</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden lg:table-cell">ITS</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Net</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden md:table-cell">Action</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden lg:table-cell">Imprimer</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bulletins.map((b) => {
                  const emp = b.employees as unknown as { full_name: string; poste: string; matricule: string } | null;
                  return (
                    <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{emp?.full_name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{emp?.matricule}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">{b.periode}</td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">{fmt(b.salaire_brut)}</td>
                      <td className="px-4 py-3 text-right text-red-600 hidden lg:table-cell">− {fmt(b.cnps_salarie)}</td>
                      <td className="px-4 py-3 text-right text-red-600 hidden lg:table-cell">− {fmt(b.its)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">{fmt(b.salaire_net)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUT_VARIANT[b.statut ?? "brouillon"] ?? "outline"}>
                          {b.statut}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        <PaieStatusButton bulletinId={b.id} currentStatut={b.statut ?? "brouillon"} />
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <Link
                          href={`/paie/${b.id}/print`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <Printer className="h-3 w-3" />
                          PDF
                        </Link>
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
