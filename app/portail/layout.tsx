import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Building2 } from "lucide-react";
import { LogoutButton } from "./LogoutButton";
import { PortailNav } from "./PortailNav";
import { ThemeToggle } from "@/components/rh/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function PortailLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, employee_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "salarie") redirect("/login");

  const { data: emp } = profile.employee_id
    ? await supabase
        .from("employees")
        .select("matricule, poste")
        .eq("id", profile.employee_id)
        .single()
    : { data: null };

  const initials = (profile.full_name || profile.email || "?")
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[oklch(0.108_0.028_248)]">
      {/* Header portail */}
      <header className="bg-white dark:bg-[oklch(0.155_0.030_248)] border-b border-slate-200 dark:border-[oklch(0.220_0.035_248)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/portail" className="flex items-center gap-2 min-w-0">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#ee7f03] to-[#d67002] text-white shadow-xs">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate hidden sm:inline">
              Portail salarié
            </span>
          </Link>
            <div className="flex items-center gap-3 min-w-0">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
                {profile.full_name ?? profile.email}
              </p>
              {emp && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                  {emp.matricule} · {emp.poste ?? ""}
                </p>
              )}
            </div>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shrink-0">
              {initials}
            </span>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Tabs nav (client — état actif corrigé) */}
      <PortailNav />

      {/* Contenu */}
      <main className="max-w-[1200px] mx-auto p-3 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
