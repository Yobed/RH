import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/rh/SidebarNav";
import { UserMenu } from "@/components/rh/UserMenu";
import { NotificationBell } from "@/components/rh/NotificationBell";
import { ThemeToggle } from "@/components/rh/ThemeToggle";
import { MobileSidebar } from "@/components/rh/MobileSidebar";
import { BuildingsIcon as Building2 } from "@/components/rh/ClientIcons";
import { TopbarAlerts } from "@/components/rh/TopbarAlerts";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Sidebar desktop — masquée sur mobile */}
      <aside
        className="hidden lg:flex w-64 shrink-0 flex-col print:hidden"
        style={{ background: "var(--sidebar)", borderRight: "1px solid var(--sidebar-border)" }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 py-5"
          style={{ borderBottom: "1px solid var(--sidebar-border)" }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "var(--sidebar-primary)" }}
          >
            <Building2 className="h-4 w-4" style={{ color: "var(--sidebar-primary-foreground)" }} />
          </div>
          <div>
            <p className="text-sm font-bold leading-none tracking-tight" style={{ color: "var(--sidebar-accent-foreground)" }}>
              RH Manager CI
            </p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--sidebar-foreground)", opacity: 0.55 }}>
              Ressources humaines
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p
            className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--sidebar-foreground)", opacity: 0.4 }}
          >
            Modules
          </p>
          <SidebarNav role={profile?.role} />
        </div>

        {/* Profil utilisateur */}
        <div className="px-3 pb-4" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
          <div className="pt-3">
            <UserMenu
              fullName={profile?.full_name ?? user.email ?? null}
              role={profile?.role ?? null}
            />
          </div>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header
          className="flex items-center justify-between px-4 py-3 print:hidden lg:justify-end"
          style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}
        >
          {/* Hamburger visible uniquement sur mobile */}
          <MobileSidebar companyName="RH Manager CI" />

          {/* Logo mobile */}
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 lg:hidden">RH Manager CI</p>

          <div className="flex items-center gap-2">
            <TopbarAlerts />
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 pt-4 sm:px-6 sm:pt-5 md:px-8 md:pt-6">
            <Breadcrumbs />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
