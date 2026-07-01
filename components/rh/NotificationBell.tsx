"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Check, AlertTriangle, Info, FileWarning } from "lucide-react";
import { createClientSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  titre: string;
  message: string | null;
  type: string;
  lu: boolean | null;
  created_at: string | null;
};

const typeIcon: Record<string, React.ElementType> = {
  alerte_contrat: FileWarning,
  contentieux: AlertTriangle,
  evaluation: Check,
  info: Info,
};

const typeColor: Record<string, string> = {
  alerte_contrat: "text-amber-600",
  contentieux: "text-red-500",
  evaluation: "text-[#ee7f03]",
  info: "text-muted-foreground",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const supabase = createClientSupabase();
    const { data } = await supabase
      .from("notifications")
      .select("id, titre, message, type, lu, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function markAllRead() {
    const supabase = createClientSupabase();
    const unreadIds = notifications.filter((n) => !n.lu).map((n) => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from("notifications")
      .update({ lu: true })
      .in("id", unreadIds);

    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
  }

  async function markRead(id: string) {
    const supabase = createClientSupabase();
    await supabase.from("notifications").update({ lu: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lu: true } : n))
    );
  }

  const unreadCount = notifications.filter((n) => !n.lu).length;

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) fetchNotifications();
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />

          {/* Panneau */}
          <div className="absolute right-0 top-11 z-40 w-80 rounded-xl border bg-popover text-popover-foreground shadow-lg">
            {/* En-tête */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary hover:underline"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            {/* Liste */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Chargement…
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Aucune notification
                </div>
              ) : (
                notifications.map((notif) => {
                  const Icon = typeIcon[notif.type] ?? Info;
                  const iconColor = typeColor[notif.type] ?? "text-muted-foreground";
                  return (
                    <button
                      key={notif.id}
                      onClick={() => markRead(notif.id)}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors border-b last:border-b-0",
                        !notif.lu && "bg-primary/5"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", iconColor)} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium truncate", !notif.lu && "font-semibold")}>
                          {notif.titre}
                        </p>
                        {notif.message && (
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                            {notif.message}
                          </p>
                        )}
                        {notif.created_at && (
                          <p className="mt-1 text-xs text-muted-foreground/60">
                            {new Date(notif.created_at).toLocaleDateString("fr-CI", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                      {!notif.lu && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
