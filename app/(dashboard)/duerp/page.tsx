import { PageShell } from "@/components/ui/page-shell";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { DuerpClient } from "./DuerpClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "DUERP — RH Manager CI" };

export default async function DuerpPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) redirect("/onboarding");

  const { data: risks } = await supabase
    .from("duerp_risks")
    .select("*")
    .eq("company_id", companyId as string)
    .order("criticite", { ascending: false });

  return (
    <PageShell>
      <DuerpClient initial={risks ?? []} />
    </PageShell>
  );
}
