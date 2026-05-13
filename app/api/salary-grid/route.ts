import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface SalaryGridRow {
  id: string;
  libelle: string;
  code: string;
  famille: "TEC" | "CHA" | "EMP" | "CAD" | "OUV";
  type_remu: string;
  salaire_base: number;
  ordre: number;
}

export async function GET() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("salary_grid")
    .select("id, libelle, code, famille, type_remu, salaire_base, ordre")
    .eq("actif", true)
    .order("ordre", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
