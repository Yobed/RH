import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  employee_id: z.string().uuid(),
  manager_id: z.string().uuid().nullable(),
});

export async function PATCH(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { employee_id, manager_id } = parsed.data;

  // Prevent circular reference: manager cannot be a subordinate of the employee
  if (manager_id) {
    const { data: subordinates } = await supabase
      .from("employees")
      .select("id, manager_id")
      .neq("statut", "inactif");

    const isCircular = (candidateId: string, targetId: string, rows: { id: string; manager_id: string | null }[]): boolean => {
      if (candidateId === targetId) return true;
      const candidate = rows.find(r => r.id === candidateId);
      if (!candidate?.manager_id) return false;
      return isCircular(candidate.manager_id, targetId, rows);
    };

    if (subordinates && isCircular(manager_id, employee_id, subordinates as { id: string; manager_id: string | null }[])) {
      return NextResponse.json({ error: "Référence circulaire détectée" }, { status: 400 });
    }
  }

  const { error } = await supabase
    .from("employees")
    .update({ manager_id })
    .eq("id", employee_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
