import { createServerClient } from "@/lib/supabase/server";
import { ShieldWarning, CheckCircle } from "@phosphor-icons/react/dist/ssr";

export const metadata = { title: "Événements de sécurité — RH Manager CI" };

const RISK_COLORS = {
  low: "text-emerald-400 bg-emerald-500/10",
  medium: "text-amber-400 bg-amber-500/10",
  high: "text-orange-400 bg-orange-500/10",
  critical: "text-rose-400 bg-rose-500/10",
};

const TYPE_LABELS: Record<string, string> = {
  login_failed: "Connexion échouée",
  login_success: "Connexion réussie",
  login_new_location: "Nouvelle localisation",
  password_changed: "Mot de passe modifié",
  role_changed: "Rôle modifié",
  data_export: "Export de données",
  api_access: "Accès API",
};

export default async function SecurityEventsPage() {
  const supabase = createServerClient();

  const { data: events } = await supabase
    .from("security_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const highRisk = (events ?? []).filter((e) => ["high", "critical"].includes(e.risk_level) && !e.acquitte);

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Événements de sécurité</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Journal des événements de connexion, accès et modifications sensibles.
          </p>
        </div>
        {highRisk.length > 0 && (
          <div className="flex items-center gap-2 bg-rose-500/10 text-rose-400 px-3 py-2 rounded-lg text-sm font-medium">
            <ShieldWarning className="h-4 w-4" weight="bold" />
            {highRisk.length} alerte{highRisk.length > 1 ? "s" : ""} critique{highRisk.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Type</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Risque</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">IP</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {(events ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Aucun événement de sécurité enregistré.
                </td>
              </tr>
            ) : (
              (events ?? []).map((event) => (
                <tr key={event.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {TYPE_LABELS[event.type] ?? event.type}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RISK_COLORS[event.risk_level as keyof typeof RISK_COLORS] ?? "text-muted-foreground bg-muted"}`}>
                      {event.risk_level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs hidden sm:table-cell">
                    {event.ip_address ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(event.created_at).toLocaleString("fr-CI")}
                  </td>
                  <td className="px-4 py-3">
                    {event.acquitte ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs">
                        <CheckCircle className="h-3.5 w-3.5" weight="bold" />
                        Acquitté
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">En attente</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
