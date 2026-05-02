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
    <div className="p-3 sm:p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      <GenererLotClient />
    </div>
  );
}
