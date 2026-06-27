import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { TopNav } from "@/components/rh/TopNav";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CommandPalette } from "@/components/rh/CommandPalette";
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
      className="flex h-screen flex-col overflow-hidden bg-background"
      style={{
        "--brand-primary": company?.couleur_primaire ?? "#FF8200",
        "--brand-secondary": company?.couleur_secondaire ?? "#E07400",
      } as React.CSSProperties}
    >
      {/* Barre de navigation horizontale */}
      <TopNav
        fullName={profile?.full_name ?? user.email ?? null}
        role={profile?.role ?? null}
        companyName="RH Manager CI"
      />

      <CommandPalette />
      <OfflineBanner />

      {/* Contenu principal pleine largeur */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1600px] px-4 pt-4 sm:px-6 sm:pt-5 md:px-8 md:pt-5">
          <Breadcrumbs />
        </div>
        {children}
      </main>
    </div>
  );
}
