"use client";

import { useRouter } from "next/navigation";
import { createClientSupabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { SignOut, UserCircleGear } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

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
    admin: "Executive Admin",
    rh: "HR Director",
    manager: "Ops Manager",
    employee: "Staff Member",
  };

  return (
    <div className="group relative">
      <div className={cn(
        "flex items-center gap-4 p-4 rounded-[1.25rem] transition-all duration-500",
        "bg-slate-50 border border-slate-100/50 hover:bg-white hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.06)]"
      )}>
        <div className="relative">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 border-2 border-white shadow-sm transition-transform duration-500 group-hover:scale-105">
            <UserCircleGear weight="duotone" className="h-6 w-6 text-amber-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
        </div>
        
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-black text-slate-900 tracking-tightest leading-none">
            {fullName ?? "Ghost User"}
          </p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 leading-none">
            {role ? (roleLabel[role] ?? role) : "Guest"}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-rose-500 hover:text-white transition-all duration-300"
          title="Sign Out"
        >
          <SignOut weight="bold" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
