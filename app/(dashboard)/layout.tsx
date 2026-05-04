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
import { CommandPalette, CommandPaletteButton } from "@/components/rh/CommandPalette";
import { OfflineBanner } from "@/components/rh/OfflineBanner";

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

  // Les salariés n'ont pas accès au dashboard admin → redirection portail
  if (profile?.role === "salarie") redirect("/portail");

  const { data: companyId } = await supabase.rpc("get_user_company_id");

  const { data: company } = companyId
    ? await supabase
        .from("companies")
        .select("couleur_primaire, couleur_secondaire, logo_url")
        .eq("id", companyId as string)
        .single()
    : { data: null };

  return (
    <div
      className="flex h-screen overflow-hidden bg-background"
      style={{
        "--brand-primary": company?.couleur_primaire ?? "#6366f1",
        "--brand-secondary": company?.couleur_secondaire ?? "#8b5cf6",
      } as React.CSSProperties}
    >
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-[15.5rem] shrink-0 flex-col print:hidden border-r border-[var(--sidebar-border)] bg-[var(--sidebar)]">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-[18px] border-b border-[var(--sidebar-border)]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/90">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[13px] font-bold leading-none tracking-tight text-white">
              RH Manager CI
            </p>
            <p className="text-[10px] mt-1 font-medium text-[var(--sidebar-foreground)] opacity-50">
              Ressources humaines
            </p>
          </div>
        </div>

        {/* Navigation scrollable */}
        <div className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          <SidebarNav role={profile?.role} />
        </div>

        {/* Zone utilisateur */}
        <div className="px-2 pb-3 pt-2 border-t border-[var(--sidebar-border)]">
          <UserMenu
            fullName={profile?.full_name ?? user.email ?? null}
            role={profile?.role ?? null}
          />
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="flex items-center justify-between gap-3 px-4 py-2.5 print:hidden bg-card border-b border-border lg:justify-end">
          {/* Hamburger mobile */}
          <MobileSidebar companyName="RH Manager CI" />

          {/* Nom app mobile */}
          <p className="text-sm font-bold text-foreground lg:hidden">RH Manager CI</p>

          <div className="flex items-center gap-1.5">
            <CommandPaletteButton />
            <TopbarAlerts />
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        <CommandPalette />
        <OfflineBanner />
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 pt-4 sm:px-6 sm:pt-5 md:px-8 md:pt-5">
            <Breadcrumbs />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
