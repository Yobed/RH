import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    const body = await req.json();

    const { data, error } = await supabase
      .from("career_events")
      .insert({
        employee_id: body.employee_id,
        company_id: body.company_id,
        event_type: body.event_type,
        date_event: body.date_event,
        description: body.description,
        new_value: body.new_value,
      })
      .select()
      .single();

    if (error) throw error;

    // Audit
    await logAuditEvent({
      action: "create",
      entity_type: "career_event",
      entity_id: data.id,
      new_values: data,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Career Event API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

