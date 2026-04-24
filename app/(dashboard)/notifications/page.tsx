export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { NotificationSyncButton } from "@/components/rh/NotificationSyncButton";
import { NotificationMarkAllRead } from "@/components/rh/NotificationMarkAllRead";

export const metadata = { title: "Notifications — RH Manager CI" };

const typeLabel: Record<string, string> = {
  alerte_contrat: "Contrat",
  contentieux: "Contentieux",
  evaluation: "Évaluation",
  info: "Info",
};

const typeColors: Record<string, { dot: string; bg: string; border: string; icon: string }> = {
  alerte_contrat: {
    dot: "bg-amber-400",
    bg: "bg-amber-50",
    border: "border-amber-100",
    icon: "text-amber-500",
  },
  contentieux: {
    dot: "bg-rose-500",
    bg: "bg-rose-50",
    border: "border-rose-100",
    icon: "text-rose-500",
  },
  evaluation: {
    dot: "bg-sky-500",
    bg: "bg-sky-50",
    border: "border-sky-100",
    icon: "text-sky-500",
  },
  info: {
    dot: "bg-slate-400",
    bg: "bg-slate-50",
    border: "border-slate-100",
    icon: "text-slate-400",
  },
};

const typeIconSvg: Record<string, string> = {
  alerte_contrat: "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  contentieux: "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  evaluation: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};

function relativeDate(isoDate: string): string {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString("fr-CI", { day: "numeric", month: "short", year: "numeric" });
}

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
    <div className="p-6 md:p-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {unread > 0 ? (
              <span>
                <span className="font-semibold text-[oklch(0.78_0.13_73)]">{unread} non lue{unread > 1 ? "s" : ""}</span>
                {" · "}
              </span>
            ) : null}
            {total} au total
          </p>
        </div>
        <div className="flex gap-2">
          <NotificationMarkAllRead unreadCount={unread} />
          <NotificationSyncButton />
        </div>
      </div>

      {/* Empty state */}
      {!notifications || notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center bg-white">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
            <svg className="h-7 w-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="font-semibold text-slate-700">Aucune notification</p>
          <p className="mt-1 text-sm text-slate-400">
            Cliquez sur &ldquo;Synchroniser&rdquo; pour générer les alertes automatiques.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const colors = typeColors[notif.type] ?? typeColors.info;
            const iconPath = typeIconSvg[notif.type] ?? typeIconSvg.info;
            return (
              <div
                key={notif.id}
                className={`flex items-start gap-4 rounded-2xl border p-5 transition-colors ${
                  !notif.lu
                    ? `${colors.bg} ${colors.border}`
                    : "bg-white border-slate-100/80"
                } shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]`}
              >
                {/* Icône type */}
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${!notif.lu ? "bg-white/80" : "bg-slate-50"}`}>
                  <svg className={`h-5 w-5 ${colors.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm ${!notif.lu ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                      {notif.titre}
                    </p>
                    {/* Badge type inline */}
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-100 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      {typeLabel[notif.type] ?? notif.type}
                    </span>
                    {/* Dot non lu animé */}
                    {!notif.lu && (
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[oklch(0.78_0.13_73)] opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[oklch(0.78_0.13_73)]" />
                      </span>
                    )}
                  </div>
                  {notif.message && (
                    <p className="mt-1 text-sm text-slate-500">{notif.message}</p>
                  )}
                  {notif.created_at && (
                    <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                      {relativeDate(notif.created_at)}
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
