import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ActivityEntry {
  id: string;
  type: "document" | "conge" | "sanction" | "formation" | "medical";
  title: string;
  detail?: string;
  date: string;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const employeeId = params.id;

  const [docs, conges, sanctions, formations, medical] = await Promise.all([
    supabase
      .from("documents")
      .select("id, name, famille, created_at")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("conges")
      .select("id, type_conge, date_debut, date_fin, statut, created_at")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("disciplinary_procedures")
      .select("id, type_sanction, motif, date_decision, created_at")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("formations")
      .select("id, intitule, date_debut, date_fin, created_at")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("medical_visits")
      .select("id, type_examen, aptitude, date_visite, created_at")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const activities: ActivityEntry[] = [];

  (docs.data ?? []).forEach((d: { id: string; name: string; famille: string | null; created_at: string }) => {
    activities.push({
      id: `doc-${d.id}`,
      type: "document",
      title: `Document ajouté : ${d.name}`,
      detail: d.famille ?? undefined,
      date: d.created_at,
    });
  });

  (conges.data ?? []).forEach((c: { id: string; type_conge: string | null; date_debut: string; date_fin: string; statut: string | null; created_at: string }) => {
    activities.push({
      id: `conge-${c.id}`,
      type: "conge",
      title: `Congé ${c.type_conge ?? ""} — ${c.statut ?? "demandé"}`.trim(),
      detail: `du ${new Date(c.date_debut).toLocaleDateString("fr-CI")} au ${new Date(c.date_fin).toLocaleDateString("fr-CI")}`,
      date: c.created_at,
    });
  });

  (sanctions.data ?? []).forEach((s: { id: string; type_sanction: string | null; motif: string | null; date_decision: string | null; created_at: string }) => {
    activities.push({
      id: `sanc-${s.id}`,
      type: "sanction",
      title: `Sanction : ${s.type_sanction ?? "procédure disciplinaire"}`,
      detail: s.motif ?? undefined,
      date: s.created_at,
    });
  });

  (formations.data ?? []).forEach((f: { id: string; intitule: string | null; date_debut: string | null; date_fin: string | null; created_at: string }) => {
    activities.push({
      id: `form-${f.id}`,
      type: "formation",
      title: `Formation : ${f.intitule ?? ""}`.trim(),
      detail:
        f.date_debut && f.date_fin
          ? `du ${new Date(f.date_debut).toLocaleDateString("fr-CI")} au ${new Date(f.date_fin).toLocaleDateString("fr-CI")}`
          : undefined,
      date: f.created_at,
    });
  });

  (medical.data ?? []).forEach((m: { id: string; type_examen: string | null; aptitude: string | null; date_visite: string | null; created_at: string }) => {
    activities.push({
      id: `med-${m.id}`,
      type: "medical",
      title: `Visite médicale : ${m.type_examen ?? ""}`.trim(),
      detail: m.aptitude ? `aptitude : ${m.aptitude}` : undefined,
      date: m.created_at,
    });
  });

  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({ activities: activities.slice(0, 30) });
}
