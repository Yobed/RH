import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { requirePortailContext } from "@/lib/portail";
import { FileText, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes bulletins — Portail salarié" };

const fcfa = (n: number): string =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n ?? 0);

export default async function MesBulletins() {
  const ctx = await requirePortailContext();
  const supabase = createServerClient();

  const { data: bulletins } = await supabase
    .from("bulletins_paie")
    .select("id, periode, salaire_brut, salaire_net, net_to_pay, total_contributions, exempt_indemnity")
    .eq("employee_id", ctx.employeeId)
    .order("periode", { ascending: false });

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">Mes bulletins de paie</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
          Historique complet de vos bulletins. Cliquez sur une ligne pour
          télécharger l'imprimé.
        </p>
      </header>

      {!bulletins || bulletins.length === 0 ? (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-12 text-center">
          <FileText className="h-7 w-7 text-slate-300 dark:text-slate-600 mx-auto mb-2.5" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Aucun bulletin disponible</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Vos bulletins apparaîtront ici dès leur génération.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {bulletins.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/paie/${b.id}/print`}
                  className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                      <Calendar className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 tabular-nums">{b.periode}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Brut {fcfa(Number(b.salaire_brut))}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      {fcfa(Number(b.net_to_pay ?? b.salaire_net ?? 0))}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Net</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
