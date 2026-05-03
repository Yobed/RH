import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { logAuditEvent } from "@/lib/audit";

const updateProcedureSchema = z.object({
  type: z.string().optional(),
  motif: z.string().optional(),
  statut: z.string().optional(),
  date_incident: z.string().nullable().optional(),
  date_notification: z.string().nullable().optional(),
  reponse_employe: z.string().nullable().optional(),
  sanction_prise: z.string().nullable().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    
    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer le company_id
    const { data: companyId } = await supabase.rpc("get_user_company_id");
    if (!companyId) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 403 });
    }

    const { id } = params;

    const { data, error } = await supabase
      .from('disciplinary_procedures')
      .select(`
        *,
        employees:employee_id (
          id,
          first_name,
          last_name,
          full_name,
          poste,
          department
        )
      `)
      .eq('id', id)
      .eq('company_id', companyId)
      .single();

    if (error || !data) {
      console.error('Erreur Supabase (GET by id disciplinary_procedures):', error);
      return NextResponse.json({ error: 'Procédure introuvable' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer le company_id
    const { data: companyId } = await supabase.rpc("get_user_company_id");
    if (!companyId) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const validationResult = updateProcedureSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Get old values for audit
    const { data: oldData } = await supabase
      .from('disciplinary_procedures')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('disciplinary_procedures')
      .update({
        ...validationResult.data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      console.error('Erreur Supabase (PATCH disciplinary_procedures):', error);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    // Audit Log
    await logAuditEvent({
      entity_type: "disciplinary_procedure",
      entity_id: id,
      action: "update",
      details: { updated_fields: Object.keys(validationResult.data) },
      old_values: oldData ?? undefined,
      new_values: data
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erreur de validation ou serveur:', error);
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer le company_id
    const { data: companyId } = await supabase.rpc("get_user_company_id");
    if (!companyId) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 403 });
    }

    // Get old values for audit
    const { data: oldData } = await supabase
      .from('disciplinary_procedures')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('disciplinary_procedures')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId);

    if (error) {
      console.error('Erreur Supabase (DELETE disciplinary_procedures):', error);
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }

    // Audit Log
    await logAuditEvent({
      entity_type: "disciplinary_procedure",
      entity_id: id,
      action: "delete",
      details: { reason: "Manual deletion" },
      old_values: oldData ?? undefined
    });

    return NextResponse.json({ success: true, message: 'Procédure supprimée avec succès' });
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 });
  }
}
