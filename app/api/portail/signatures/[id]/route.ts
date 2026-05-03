import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePortailContext } from "@/lib/portail";
import { headers } from "next/headers";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("signer") }),
  z.object({ action: z.literal("refuser"), motif: z.string().min(2).max(500) }),
]);

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requirePortailContext();
  const supabase = createServerClient();

  const body = await req.json();
  const parse = actionSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  // Récupérer la demande et vérifier qu'elle appartient au salarié
  const { data: request } = await supabase
    .from("signature_requests")
    .select("id, status, employee_id, titre")
    .eq("id", params.id)
    .eq("employee_id", ctx.employeeId)
    .single();

  if (!request) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  if (request.status !== "en_attente") {
    return NextResponse.json({ error: "Cette demande n'est plus en attente" }, { status: 409 });
  }

  const headersList = headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = headersList.get("user-agent") ?? "";
  const now = new Date().toISOString();

  if (parse.data.action === "signer") {
    // Générer un hash de signature simple : SHA256(requestId + employeeId + timestamp)
    const signatureHash = createHash("sha256")
      .update(`${request.id}:${ctx.employeeId}:${now}`)
      .digest("hex");

    const { error } = await supabase
      .from("signature_requests")
      .update({
        status: "signe",
        signed_at: now,
        signature_hash: signatureHash,
        signature_ip: ip,
        signature_user_agent: userAgent,
      })
      .eq("id", params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("signature_events").insert({
      request_id: params.id,
      event: "SIGNED",
      user_id: ctx.userId,
      ip_address: ip,
      user_agent: userAgent,
      metadata: { signature_hash: signatureHash },
    });

    return NextResponse.json({ success: true, status: "signe", signed_at: now });
  }

  // Refus
  const { error } = await supabase
    .from("signature_requests")
    .update({
      status: "refuse",
      refused_at: now,
      refus_motif: parse.data.motif,
    })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("signature_events").insert({
    request_id: params.id,
    event: "REFUSED",
    user_id: ctx.userId,
    ip_address: ip,
    user_agent: userAgent,
    metadata: { motif: parse.data.motif },
  });

  return NextResponse.json({ success: true, status: "refuse", refused_at: now });
}

