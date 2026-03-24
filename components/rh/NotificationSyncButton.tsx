"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationSyncButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function sync() {
    setLoading(true);
    const res = await fetch("/api/notifications/sync", { method: "POST" });
    setLoading(false);

    if (!res.ok) {
      toast.error("Erreur lors de la synchronisation");
      return;
    }

    const data = (await res.json()) as { created: number };
    toast.success(
      data.created > 0
        ? `${data.created} nouvelle${data.created > 1 ? "s" : ""} notification${data.created > 1 ? "s" : ""} générée${data.created > 1 ? "s" : ""}`
        : "Aucune nouvelle notification"
    );
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={sync} disabled={loading}>
      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      Synchroniser
    </Button>
  );
}
