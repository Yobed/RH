"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClientSupabase } from "@/lib/supabase/client";

export function LogoutButton(): React.ReactElement {
  const router = useRouter();
  const supabase = createClientSupabase();

  async function handleLogout(): Promise<void> {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-slate-100 dark:hover:bg-slate-800"
      title="Se déconnecter"
      aria-label="Se déconnecter"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
