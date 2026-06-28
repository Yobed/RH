import { createServerClient } from "@/lib/supabase/server";
import { MfaSetup } from "@/components/rh/MfaSetup";
import { PageShell, PageHeader } from "@/components/ui/page-shell";

export const metadata = { title: "Sécurité — RH Manager CI" };

export default async function SecuritePage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <PageShell width="narrow">
      <PageHeader
        title="Sécurité du compte"
        description="Configurez la double authentification et gérez la sécurité de votre compte."
      />

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Double authentification (2FA)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Protégez votre compte avec une application d'authentification (Google Authenticator, Authy…).
          </p>
        </div>
        <MfaSetup />
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-base font-semibold text-foreground">Sessions actives</h2>
        <p className="text-sm text-muted-foreground">
          Email du compte : <span className="font-medium text-foreground">{user?.email}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Pour déconnecter toutes les autres sessions, utilisez "Déconnexion globale" depuis le menu utilisateur.
        </p>
      </div>
    </PageShell>
  );
}
