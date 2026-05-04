import { createServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

export type WebhookEvent =
  | "employee.created"
  | "employee.updated"
  | "conge.approved"
  | "conge.rejected"
  | "bulletin.generated"
  | "evaluation.completed";

export async function triggerWebhooks(event: WebhookEvent, payload: Record<string, unknown>): Promise<void> {
  const supabase = createServerClient();

  const { data: webhooks } = await supabase
    .from("webhooks")
    .select("id, url, secret, events")
    .eq("actif", true)
    .contains("events", [event]);

  if (!webhooks || webhooks.length === 0) return;

  const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });

  await Promise.allSettled(
    webhooks.map(async (wh: { id: string; url: string; secret: string; events: string[] }) => {
      const sig = crypto
        .createHmac("sha256", wh.secret)
        .update(body)
        .digest("hex");

      let statusCode = 0;
      let success = false;
      let response = "";

      try {
        const res = await fetch(wh.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-RH-Signature": `sha256=${sig}`,
            "X-RH-Event": event,
          },
          body,
          signal: AbortSignal.timeout(10_000),
        });
        statusCode = res.status;
        success = res.ok;
        response = await res.text().catch(() => "");
      } catch (err) {
        response = err instanceof Error ? err.message : "timeout";
      }

      await supabase.from("webhook_logs").insert({
        webhook_id: wh.id,
        event,
        payload,
        status_code: statusCode,
        response: response.slice(0, 500),
        success,
      });

      if (success) {
        await supabase
          .from("webhooks")
          .update({ last_triggered_at: new Date().toISOString() })
          .eq("id", wh.id);
      }
    })
  );
}
