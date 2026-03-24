"use client";

import { useRouter } from "next/navigation";
import { createClientSupabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserMenuProps {
  fullName: string | null;
  role: string | null;
}

export function UserMenu({ fullName, role }: UserMenuProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClientSupabase();
    await supabase.auth.signOut();
    toast.success("Déconnexion réussie");
    router.push("/login");
    router.refresh();
  }

  const roleLabel: Record<string, string> = {
    admin: "Administrateur",
    rh: "Responsable RH",
    manager: "Manager",
    employee: "Employé",
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{fullName ?? "Utilisateur"}</p>
          <p className="text-xs text-muted-foreground">
            {role ? (roleLabel[role] ?? role) : ""}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        className="shrink-0 text-muted-foreground hover:text-foreground"
        title="Se déconnecter"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
