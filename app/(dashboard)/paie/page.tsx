export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { PageShell, PageHeader } from "@/components/ui/page-shell";
import { PaieDialog } from "@/components/rh/PaieDialog";
import { PaieStatusButton } from "@/components/rh/PaieStatusButton";
import Link from "next/link";
import { PaieExportButton } from "@/components/rh/PaieExportButton";
import { LivrePaieButton } from "@/components/rh/LivrePaieButton";
import { PaieFilters } from "@/components/rh/PaieFilters";
import { EmptyState } from "@/components/ui/empty-state";
import { BulletinTable } from "@/components/paie/BulletinTable";
import { Banknote } from "lucide-react";

export const metadata = { title: "Paie — RH Manager CI" };

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n);

export default async function PaiePage({
  searchParams,
}: {
  searchParams: { mois?: string; annee?: string; page?: string; sort?: string; dir?: string };
}) {
  const supabase = createServerClient();
  const { mois, annee, page = "1", sort, dir = "asc" } = searchParams;
  
  const currentPage = parseInt(page, 10);
  const itemsPerPage = 10;
  const from = (currentPage - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;

  const now = new Date();
  const defaultPeriode = now.toISOString().slice(0, 7);
  const currentPeriode = annee && mois ? `${annee}-${mois}` : defaultPeriode;

  // Data for KPIs and Livre de Paie (full data for current period)
  const { data: bulletinsMois } = await supabase
    .from("bulletins_paie")
    .select(`id, periode, salaire_brut, cnps_salarie, its, autres_retenues, avances, salaire_net, statut,
             sursalaire, prime_anciennete, prime_exceptionnelle, prime_salissure,
             prime_depassement, prime_fonction, prime_transport, vacation_allowance, details,
             gross_salary, fiscal_gross, social_gross, tax_cn, tax_igr, withholding_cnps,
             total_contributions, net_before_withholding, net_to_pay,
             employee_id, employees(full_name, poste, matricule)`)
    .eq("periode", currentPeriode);

  // Paginated data for the main table
  let query = supabase
    .from("bulletins_paie")
    .select(`id, periode, salaire_brut, cnps_salarie, its, autres_retenues, avances, salaire_net, statut,
             sursalaire, prime_anciennete, prime_exceptionnelle, prime_salissure,
             prime_depassement, prime_fonction, prime_transport, vacation_allowance, details,
             gross_salary, fiscal_gross, social_gross, tax_cn, tax_igr, withholding_cnps,
             total_contributions, net_before_withholding, net_to_pay,
             employee_id, employees!inner(full_name, poste, matricule)`, { count: "exact" })
    .range(from, to);

  if (annee && mois) {
    query = query.eq("periode", `${annee}-${mois}`);
  } else if (annee) {
    query = query.gte("periode", `${annee}-01`).lte("periode", `${annee}-12`);
  } else if (mois) {
    query = query.ilike("periode", `%-${mois}`);
  }

  if (sort) {
    if (sort === "full_name") {
      query = query.order("full_name", { foreignTable: "employees", ascending: dir === "asc" });
    } else {
      query = query.order(sort, { ascending: dir === "asc" });
    }
  } else {
    query = query.order("periode", { ascending: false }).order("created_at", { ascending: false });
  }

  const [{ data: bulletins, count }, { data: employees }, { data: company }] = await Promise.all([
    query,
    supabase
      .from("employees")
      .select("id, full_name, matricule, salaire_brut, date_embauche, sursalaire, prime_exceptionnelle, prime_salissure, prime_depassement, prime_fonction, prime_transport")
      .eq("statut", "actif")
      .order("full_name"),
    supabase.from("companies").select("*").limit(1).maybeSingle(),
  ]);

  const bulletinsMoisSafe = bulletinsMois ?? [];
  const masseSalariale = bulletinsMoisSafe.reduce((s, b) => s + Number((b as Record<string, unknown>).net_to_pay ?? b.salaire_net), 0);
  const masseCharges = bulletinsMoisSafe.reduce((s, b) => s + Number((b as Record<string, unknown>).total_contributions ?? (Number(b.cnps_salarie) + Number(b.its))), 0);
  const nbPayes = bulletinsMoisSafe.filter((b) => b.statut === "payé").length;

  return (
    <PageShell>
      <PageHeader
        title="Bulletins de Paie"
        description="CNPS retraite 6,3% + CMU 1 600 FCFA + ITS unifié (barème progressif − RICF) — Réforme 2024 CI"
        help="Les bulletins de salaire de vos collaborateurs : le net à payer est calculé à partir du brut, des cotisations CNPS et de l'ITS (impôt sur les salaires) selon le barème ivoirien."
        actions={
          <>
            <PaieExportButton periode={currentPeriode} />
            <LivrePaieButton bulletins={bulletinsMoisSafe} company={company} periode={currentPeriode} />
            <PaieDialog employees={employees ?? []} company={company} />
          </>
        }
      />

      {/* Filters */}
      <PaieFilters />

      {/* KPI mois courant */}
      {bulletinsMoisSafe.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Masse salariale nette</p>
            <p className="mt-3 text-2xl font-bold text-slate-900 font-mono tabular-nums">{fmt(masseSalariale)}</p>
            <p className="mt-1 text-xs text-slate-600">{bulletinsMoisSafe.length} bulletin(s) · {currentPeriode}</p>
          </div>
          <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Total cotisations (CNPS + ITS)</p>
            <p className="mt-3 text-2xl font-bold text-slate-900 font-mono tabular-nums">{fmt(masseCharges)}</p>
            <p className="mt-1 text-xs text-slate-600">*** TOTAL DES COTISATIONS *** du mois</p>
          </div>
          <div className="rounded-2xl border border-slate-100/80 bg-white shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Bulletins payés</p>
            <p className="mt-3 text-2xl font-bold text-slate-900 font-mono tabular-nums">{nbPayes}</p>
            <p className="mt-1 text-xs text-slate-600">sur {bulletinsMoisSafe.length} ce mois</p>
          </div>
        </div>
      )}

      {/* Rappel légal */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-800">
        <p className="font-semibold mb-2">Calcul automatique — Références légales 2026</p>
        <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2 md:grid-cols-3">
          <span>CNPS retraite salarié : <strong>6,3%</strong> (plafond 3 375 000 FCFA/mois)</span>
          <span>CMU (CNAM) salariale : <strong>1 600 FCFA</strong> forfait/mois</span>
          <span>ITS : barème progressif (0% → 16% → 21% → 24% → 28% → 32%) − RICF</span>
          <span>Abattement ITS : <strong>15%</strong> charges professionnelles</span>
          <span>Charges patronales : <strong>~{Math.round((0.05 + 0.0075 + 0.077 + 0.03 + 0.01) * 100)}%</strong> + CMU 1 600 FCFA</span>
          <span>TFC (FDFP) : <strong>1,2%</strong> + Taxe Apprentissage : <strong>0,4%</strong></span>
        </div>
      </div>

      {/* Liste bulletins */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-3">Tous les bulletins</h2>

        {!bulletins || bulletins.length === 0 ? (
          <EmptyState
            icon={<Banknote className="h-14 w-14 text-slate-300" />}
            title="Aucun bulletin de paie"
            description="Créez le premier bulletin du mois pour commencer."
            action={
              <PaieDialog employees={employees ?? []} company={company} />
            }
          />
        ) : (
          <BulletinTable bulletins={bulletins} employees={employees ?? []} company={company} totalCount={count ?? 0} />
        )}
      </div>
    </PageShell>
  );
}
