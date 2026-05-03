"use client";

import { useState, useEffect, useCallback } from "react";
import { createClientSupabase } from "@/lib/supabase/client";
import { CalendarDays, FileWarning, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Alert = {
  type: "conges" | "contrats" | "contentieux";
  count: number;
  label: string;
  href: string;
  icon: React.ElementType;
  color: string;
};

export function TopbarAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const fetchAlerts = useCallback(async () => {
    const supabase = createClientSupabase();
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const [congesRes, contratsRes] = await Promise.all([
      // Congés en attente
      supabase
        .from("conges")
        .select("id", { count: "exact", head: true })
        .in("statut", ["en_attente", "valide_manager"]),
      // Contrats qui expirent ce mois
      supabase
        .from("contracts")
        .select("id", { count: "exact", head: true })
        .eq("statut", "actif")
        .not("date_fin", "is", null)
        .lte("date_fin", endOfMonth),
    ]);

    const result: Alert[] = [];

    if (congesRes.count && congesRes.count > 0) {
      result.push({
        type: "conges",
        count: congesRes.count,
        label: `${congesRes.count} congé${congesRes.count > 1 ? "s" : ""} en attente`,
        href: "/conges",
        icon: CalendarDays,
        color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
      });
    }

    if (contratsRes.count && contratsRes.count > 0) {
      result.push({
        type: "contrats",
        count: contratsRes.count,
        label: `${contratsRes.count} contrat${contratsRes.count > 1 ? "s" : ""} expire${contratsRes.count > 1 ? "nt" : ""} ce mois`,
        href: "/contrats",
        icon: FileWarning,
        color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
      });
    }

    setAlerts(result);
  }, []);

  useEffect(() => {
    fetchAlerts();
    // Refresh every 2 minutes
    const interval = setInterval(fetchAlerts, 120_000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  if (alerts.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {alerts.map((alert) => {
        const Icon = alert.icon;
        return (
          <Link
            key={alert.type}
            href={alert.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all hover:scale-105 hover:shadow-sm",
              alert.color
            )}
            title={alert.label}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{alert.label}</span>
            <span className="sm:hidden">{alert.count}</span>
          </Link>
        );
      })}
    </div>
  );
}
