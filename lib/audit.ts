import { createServerClient } from "@/lib/supabase/server";

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

    await supabase.from("audit_logs").insert({
      company_id: profile?.company_id ?? null,
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      user_name: profile?.full_name ?? null,
      user_role: profile?.role ?? null,
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id ?? null,
      details: params.details ?? null,
      old_values: params.old_values ?? null,
      new_values: params.new_values ?? null,
      ip_address: null, // Could be extracted from request headers if needed
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // Audit logging should never break the main flow
    console.error("[AUDIT] Failed to log event:", error);
  }
}
