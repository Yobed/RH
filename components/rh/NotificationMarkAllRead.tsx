"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { createClientSupabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function NotificationMarkAllRead({ unreadCount }: { unreadCount: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (unreadCount === 0) return null;

  async function markAll() {
    setLoading(true);
    const supabase = createClientSupabase();
    const { error } = await supabase
      .from("notifications")
      .update({ lu: true })
      .eq("lu", false);
    setLoading(false);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
      return;
    }

    toast.success("Toutes les notifications marquées comme lues");
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={markAll} disabled={loading}>
      <CheckCheck className="mr-2 h-4 w-4" />
      Tout marquer comme lu ({unreadCount})
    </Button>
  );
}
