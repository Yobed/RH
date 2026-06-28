import { createServerClient } from "@/lib/supabase/server";
import { PageShell, PageHeader } from "@/components/ui/page-shell";

export const metadata = { title: "Mobile Money CI — RH Manager CI" };

const STATUS_COLORS: Record<string, string> = {
  initie: "bg-amber-500/10 text-amber-400",
  en_cours: "bg-teal-500/10 text-teal-400",
  succès: "bg-emerald-500/10 text-emerald-400",
  echec: "bg-rose-500/10 text-rose-400",
};

const PROVIDER_COLORS: Record<string, string> = {
  orange_money: "#FF6600",
  wave: "#1AC8FF",
  mtn_momo: "#FFCC00",
};

export default async function MobileMoneyPage() {
  const supabase = createServerClient();

  const { data: payments } = await supabase
    .from("mobile_money_payments")
    .select("*, employees(first_name, last_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n);

  const stats = {
    total: (payments ?? []).length,
    succes: (payments ?? []).filter((p) => p.statut === "succès").length,
    montant: (payments ?? []).filter((p) => p.statut === "succès").reduce((s, p) => s + p.amount, 0),
  };

  return (
    <PageShell>
      <PageHeader
        title="Mobile Money CI"
        description="Historique des virements salaires via Orange Money, Wave et MTN MoMo."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs text-muted-foreground">Total paiements</p>
          <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs text-muted-foreground">Réussis</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.succes}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs text-muted-foreground">Montant total viré</p>
          <p className="text-2xl font-bold text-foreground mt-1">{fmt(stats.montant)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Employé</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Opérateur</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Montant</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Référence</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Statut</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Date</th>
            </tr>
          </thead>
          <tbody>
            {(payments ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Aucun paiement Mobile Money enregistré.
                </td>
              </tr>
            ) : (
              (payments ?? []).map((p) => {
                const emp = p.employees as { first_name: string; last_name: string } | null;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="font-medium text-xs"
                        style={{ color: PROVIDER_COLORS[p.provider] ?? "#94a3b8" }}
                      >
                        {p.provider.replace("_", " ").toUpperCase()}
                      </span>
                      <span className="ml-1.5 text-muted-foreground text-xs">{p.phone}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{fmt(p.amount)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.reference}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.statut] ?? "bg-muted text-muted-foreground"}`}>
                        {p.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                      {new Date(p.created_at).toLocaleDateString("fr-CI")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
