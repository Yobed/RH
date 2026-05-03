import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { LayoutDashboard, FileText, CalendarDays, UserCircle, LogOut } from "lucide-react";
import { LogoutButton } from "./LogoutButton";

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

  const navItems = [
    { href: "/portail", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/portail/bulletins", label: "Mes bulletins", icon: FileText },
    { href: "/portail/conges", label: "Mes congés", icon: CalendarDays },
    { href: "/portail/profil", label: "Mon profil", icon: UserCircle },
  ];

  const initials = (profile.full_name || profile.email || "?")
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header portail */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/portail" className="flex items-center gap-2 min-w-0">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white text-xs font-semibold">
              RH
            </span>
            <span className="text-sm font-semibold text-slate-900 truncate hidden sm:inline">
              Portail salarié
            </span>
          </Link>
          <div className="flex items-center gap-3 min-w-0">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <p className="text-xs font-medium text-slate-900 truncate max-w-[180px]">
                {profile.full_name ?? profile.email}
              </p>
              {emp && (
                <p className="text-[10px] text-slate-500 tabular-nums">
                  {emp.matricule} · {emp.poste ?? ""}
                </p>
              )}
            </div>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs font-semibold shrink-0">
              {initials}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Tabs nav */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto no-scrollbar">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-2 px-3 py-3 text-sm border-b-2 border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 whitespace-nowrap aria-[current=page]:border-slate-900 aria-[current=page]:text-slate-900 aria-[current=page]:font-semibold"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Contenu */}
      <main className="max-w-[1200px] mx-auto p-3 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
