import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

type NiveauWorkflow = {
  ordre: number;
  role: string;
  delai_heures: number;
};

type WorkflowPayload = {
  module: string;
  niveaux: NiveauWorkflow[];
  escalade_auto: boolean;
};

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: companyId } = await supabase.rpc("get_user_company_id");
    if (!companyId) {
      return NextResponse.json({ error: "Entreprise introuvable" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("approval_workflows")
      .select("*")
      .eq("company_id", companyId as string)
      .order("module");

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();

    const { data: companyId } = await supabase.rpc("get_user_company_id");
    if (!companyId) {
      return NextResponse.json({ error: "Entreprise introuvable" }, { status: 403 });
    }

    const body: WorkflowPayload = await request.json();
    const { module, niveaux, escalade_auto } = body;

    if (!module || !Array.isArray(niveaux)) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    // Upsert par company_id + module
    const { data, error } = await supabase
      .from("approval_workflows")
      .upsert(
        {
          company_id: companyId as string,
          module,
          niveaux,
          escalade_auto,
        },
        { onConflict: "company_id,module" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
