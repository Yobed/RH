import { PageShell } from "@/components/ui/page-shell";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { buildReminders } from "@/lib/reminders-engine";
import { RemindersClient } from "./RemindersClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rappels & Échéances — RH Manager CI" };

export default async function RappelsPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) redirect("/onboarding");

  const reminders = await buildReminders(supabase, companyId as string);

  return (
    <PageShell>
      <RemindersClient initial={reminders} />
    </PageShell>
  );
}
