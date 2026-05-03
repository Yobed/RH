import { requirePortailContext } from "@/lib/portail";
import { createServerClient } from "@/lib/supabase/server";
import { SignaturesClient } from "./SignaturesClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes signatures — Portail salarié" };

export default async function SignaturesPage() {
  const ctx = await requirePortailContext();
  const supabase = createServerClient();

  const { data: requests } = await supabase
    .from("signature_requests")
    .select("id, doc_type, titre, description, document_url, reference, status, expire_le, created_at, signed_at, refused_at, refus_motif")
    .eq("employee_id", ctx.employeeId)
    .order("created_at", { ascending: false });

  return <SignaturesClient requests={requests ?? []} />;
}
