import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  from: z.string().datetime({ offset: true }),
  to: z.string().datetime({ offset: true }),
});

interface PublishedSlot {
  id: string;
  employee_id: string | null;
  role_id: string | null;
  start_at: string;
  end_at: string;
  project: string | null;
}

export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  // 1. Publication en masse
  const { data: published, error } = await supabase
    .from("planning_slots")
    .update({ status: "publie", published_at: new Date().toISOString() })
    .eq("status", "brouillon")
    .gte("start_at", parsed.data.from)
    .lte("start_at", parsed.data.to)
    .select("id, employee_id, role_id, start_at, end_at, project");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const slots = (published ?? []) as PublishedSlot[];
  const publishedCount = slots.length;

  if (publishedCount === 0) {
    return NextResponse.json({ published_count: 0, notified_count: 0 });
  }

  // 2. Récupérer les noms de rôles pour enrichir les messages
  const roleIds = Array.from(new Set(slots.map((s) => s.role_id).filter(Boolean) as string[]));
  let rolesByid: Record<string, string> = {};
  if (roleIds.length > 0) {
    const { data: roles } = await supabase
      .from("planning_roles")
      .select("id, name")
      .in("id", roleIds);
    rolesByid = Object.fromEntries((roles ?? []).map((r) => [r.id, r.name]));
  }

  // 3. Regrouper les créneaux par employé (uniquement assignés)
  const slotsByEmployee = new Map<string, PublishedSlot[]>();
  for (const s of slots) {
    if (!s.employee_id) continue;
    const list = slotsByEmployee.get(s.employee_id);
    if (list) list.push(s);
    else slotsByEmployee.set(s.employee_id, [s]);
  }

  // 4. Trouver les profils (user_id) liés aux employés concernés
  const employeeIds = Array.from(slotsByEmployee.keys());
  let userIdByEmployee: Record<string, string> = {};
  if (employeeIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, employee_id")
      .in("employee_id", employeeIds);
    userIdByEmployee = Object.fromEntries(
      (profiles ?? [])
        .filter((p) => p.employee_id)
        .map((p) => [p.employee_id as string, p.id])
    );
  }

  // 5. Construire les notifications
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-CI", { day: "2-digit", month: "short" });
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("fr-CI", { hour: "2-digit", minute: "2-digit" });

  const notifications: Array<{
    user_id: string;
    titre: string;
    contenu: string;
    type: string;
    statut: string;
  }> = [];

  slotsByEmployee.forEach((empSlots, empId) => {
    const userId = userIdByEmployee[empId];
    if (!userId) return;

    const sorted = [...empSlots].sort((a: PublishedSlot, b: PublishedSlot) => a.start_at.localeCompare(b.start_at));
    const first = sorted[0];
    const lines = sorted.slice(0, 5).map((s: PublishedSlot) => {
      const role = s.role_id ? rolesByid[s.role_id] : null;
      return `• ${fmtDate(s.start_at)} ${fmtTime(s.start_at)}–${fmtTime(s.end_at)}${role ? ` — ${role}` : ""}${s.project ? ` (${s.project})` : ""}`;
    });
    if (sorted.length > 5) lines.push(`… et ${sorted.length - 5} autre(s).`);

    notifications.push({
      user_id: userId,
      titre: `Planning publié — ${empSlots.length} créneau${empSlots.length > 1 ? "x" : ""}`,
      contenu: `Votre planning à partir du ${fmtDate(first.start_at)} :\n${lines.join("\n")}`,
      type: "planning",
      statut: "non_lu",
    });
  });

  let notifiedCount = 0;
  if (notifications.length > 0) {
    try {
      const { data: inserted } = await supabase
        .from("notifications")
        .insert(notifications)
        .select("id");
      notifiedCount = inserted?.length ?? 0;
    } catch {
      // Si la table notifications n'a pas exactement ces colonnes, on log silencieusement.
      notifiedCount = 0;
    }
  }

  return NextResponse.json({
    published_count: publishedCount,
    notified_count: notifiedCount,
  });
}
