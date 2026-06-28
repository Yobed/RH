import { PageShell } from "@/components/ui/page-shell";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { GenererLotClient } from "./GenererLotClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Génération paie en lot — RH Manager CI" };

export default async function GenererLotPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <PageShell>
      <GenererLotClient />
    </PageShell>
  );
}
