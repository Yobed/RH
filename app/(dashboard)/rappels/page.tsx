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
    <div className="p-3 sm:p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      <RemindersClient initial={reminders} />
    </div>
  );
}
