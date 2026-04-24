import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import * as z from 'zod';

export const dynamic = 'force-dynamic';

const examSchema = z.object({
  employee_id: z.string().uuid(),
  type_examen: z.enum(['PRE_EMBAUCHE', 'PERIODIQUE', 'REPRISE', 'SOUHAIT_EMPLOYE', 'SOUHAIT_EMPLOYEUR', 'AUTRE']),
  date_examen: z.string(),
  resultat: z.enum(['APTE', 'APTE_AVEC_RESERVES', 'INAPTE']),
  recommandations: z.string().optional(),
  prochaine_visite: z.string().nullable().optional(),
  document_url: z.string().nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data: companyId } = await supabase.rpc("get_user_company_id");
    if (!companyId) return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const employee_id = searchParams.get('employee_id');

    let query = supabase
      .from('medical_exams')
      .select(`
        *,
        employees:employee_id (
          full_name,
          poste
        )
      `)
      .eq('company_id', companyId)
      .order('date_examen', { ascending: false });

    if (employee_id) query = query.eq('employee_id', employee_id);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Medical GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data: companyId } = await supabase.rpc("get_user_company_id");
    if (!companyId) return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 403 });

    const body = await request.json();
    const validatedData = examSchema.parse(body);

    const { data, error } = await supabase
      .from('medical_exams')
      .insert({
        ...validatedData,
        company_id: companyId,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Medical POST error:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 400 });
  }
}

