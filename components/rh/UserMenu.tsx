"use client";

import { useRouter } from "next/navigation";
import { createClientSupabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { SignOut } from "@phosphor-icons/react";

interface UserMenuProps {
  fullName: string | null;
  role: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  responsable_rh: "Resp. RH",
  rh: "Chargé(e) RH",
  manager: "Manager",
  employee: "Collaborateur",
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
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

  const initials = getInitials(fullName);
  const roleDisplay = role ? (ROLE_LABELS[role] ?? role) : "Invité";

  return (
    <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors duration-150">
      {/* Avatar avec initiales */}
      <div className="relative shrink-0">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold text-white select-none"
          style={{ background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)" }}
          aria-hidden
        >
          {initials}
        </div>
        {/* Indicateur en ligne */}
        <span
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400"
          style={{ boxShadow: "0 0 0 2px #0f172a" }}
          title="En ligne"
        />
      </div>

      {/* Nom + rôle */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-white leading-none">
          {fullName ?? "Utilisateur"}
        </p>
        <p className="truncate text-[10px] mt-1 leading-none text-slate-400">
          {roleDisplay}
        </p>
      </div>

      {/* Bouton déconnexion */}
      <button
        onClick={handleLogout}
        className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 transition-all duration-150 shrink-0"
        title="Se déconnecter"
        aria-label="Se déconnecter"
      >
        <SignOut weight="bold" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
