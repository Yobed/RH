import { createServerClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "login"
  | "export"
  | "generate"
  | "invite"
  | "archive"
  | "upload"
  | "download"
  | "sync"
  | "process";

interface AuditLogParams {
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  page_path?: string; // Optionnel : page d'où provient l'action
}

/**
 * Log an auditable event to the audit_logs table.
 * Call this from any server-side route (API routes, Server Actions).
 *
 * Usage:
 *   await logAuditEvent({
 *     action: "update",
 *     entity_type: "employee",
 *     entity_id: "uuid-xxx",
 *     old_values: { salaire_brut: 300000 },
 *     new_values: { salaire_brut: 350000 },
 *   });
 */
export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    const supabase = createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = user
      ? await supabase
          .from("profiles")
          .select("full_name, role, company_id")
          .eq("id", user.id)
          .single()
      : { data: null };

    // Déterminer la page / URL source de l'action
    let resolvedPagePath = params.page_path || "";
    if (!resolvedPagePath) {
      try {
        const reqHeaders = headers();
        const referer = reqHeaders.get("referer");
        if (referer) {
          const url = new URL(referer);
          resolvedPagePath = url.pathname;
        }
      } catch (e) {
        // Ignoré si appelé en dehors d'un contexte de requête (ex: tâche planifiée)
      }
    }

    const mergedDetails = {
      ...(params.details || {}),
      ...(resolvedPagePath ? { page_path: resolvedPagePath } : {}),
    };

    await supabase.from("audit_logs").insert({
      company_id: profile?.company_id ?? null,
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      user_name: profile?.full_name ?? null,
      user_role: profile?.role ?? null,
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id ?? null,
      details: Object.keys(mergedDetails).length > 0 ? mergedDetails : null,
      old_values: params.old_values ?? null,
      new_values: params.new_values ?? null,
      ip_address: null, // Peut être étendu plus tard si besoin
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // L'audit log ne doit jamais bloquer le flux principal
    console.error("[AUDIT] Failed to log event:", error);
  }
}

