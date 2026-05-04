import { createServerClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export type SecurityEventType = "login" | "login_failed" | "bulk_export" | "permission_denied" | "password_change" | "mfa_enabled";
export type RiskLevel = "low" | "medium" | "high";

export async function logSecurityEvent(
  type: SecurityEventType,
  details?: Record<string, unknown>,
  riskLevel: RiskLevel = "low"
): Promise<void> {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const headersList = headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? headersList.get("x-real-ip")
      ?? "unknown";
    const userAgent = headersList.get("user-agent") ?? "unknown";

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    await supabase.from("security_events").insert({
      user_id: user.id,
      company_id: profile?.company_id,
      type,
      ip_address: ip,
      user_agent: userAgent,
      details: details ?? {},
      risk_level: riskLevel,
    });
  } catch {
    // Ne pas bloquer l'exécution si le log échoue
  }
}

export function assessRisk(
  failedLogins: number,
  isNewLocation: boolean,
  isOffHour: boolean
): RiskLevel {
  if (failedLogins >= 3 && (isNewLocation || isOffHour)) return "high";
  if (failedLogins >= 3 || (isNewLocation && isOffHour)) return "medium";
  return "low";
}
