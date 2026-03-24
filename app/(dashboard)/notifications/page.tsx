import { createServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { NotificationSyncButton } from "@/components/rh/NotificationSyncButton";
import { NotificationMarkAllRead } from "@/components/rh/NotificationMarkAllRead";
import { Bell, FileWarning, AlertTriangle, CheckCircle2, Info } from "lucide-react";

export const metadata = { title: "Notifications — RH Manager CI" };

const typeLabel: Record<string, string> = {
  alerte_contrat: "Contrat",
  contentieux: "Contentieux",
  evaluation: "Évaluation",
  info: "Info",
};

const typeVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  alerte_contrat: "secondary",
  contentieux: "destructive",
  evaluation: "default",
  info: "outline",
};

const TypeIcon: Record<string, React.ElementType> = {
  alerte_contrat: FileWarning,
  contentieux: AlertTriangle,
  evaluation: CheckCircle2,
  info: Info,
};

export default async function NotificationsPage() {
  const supabase = createServerClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, titre, message, type, lu, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const unread = notifications?.filter((n) => !n.lu).length ?? 0;
  const total = notifications?.length ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unread > 0 ? `${unread} non lue${unread > 1 ? "s" : ""} · ` : ""}
            {total} au total
          </p>
        </div>
        <div className="flex gap-2">
          <NotificationMarkAllRead unreadCount={unread} />
          <NotificationSyncButton />
        </div>
      </div>

      {/* Liste */}
      {!notifications || notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed p-16 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Aucune notification</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cliquez sur &ldquo;Synchroniser&rdquo; pour générer les alertes automatiques.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = TypeIcon[notif.type] ?? Info;
            return (
              <div
                key={notif.id}
                className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                  !notif.lu ? "bg-primary/5 border-primary/20" : "bg-white"
                }`}
              >
                <Icon
                  className={`mt-0.5 h-5 w-5 shrink-0 ${
                    notif.type === "contentieux"
                      ? "text-red-500"
                      : notif.type === "alerte_contrat"
                      ? "text-amber-500"
                      : notif.type === "evaluation"
                      ? "text-blue-500"
                      : "text-muted-foreground"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm ${!notif.lu ? "font-semibold" : "font-medium"}`}>
                      {notif.titre}
                    </p>
                    <Badge variant={typeVariant[notif.type] ?? "outline"}>
                      {typeLabel[notif.type] ?? notif.type}
                    </Badge>
                    {!notif.lu && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  {notif.message && (
                    <p className="mt-1 text-sm text-muted-foreground">{notif.message}</p>
                  )}
                  {notif.created_at && (
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      {new Date(notif.created_at).toLocaleDateString("fr-CI", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
