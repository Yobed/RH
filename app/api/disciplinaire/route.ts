import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import * as z from 'zod';

export const dynamic = 'force-dynamic';

// Schéma de validation pour une nouvelle procédure
const procedureSchema = z.object({
  employee_id: z.string().uuid("L'ID de l'employé est invalide"),
  type: z.string().min(1, "Le type de procédure est requis"),
  motif: z.string().min(10, "Le motif doit contenir au moins 10 caractères"),
  statut: z.string().min(1, "Le statut est requis"),
  date_incident: z.string().nullable().optional(),
  date_notification: z.string().nullable().optional(),
  date_convocation: z.string().nullable().optional(),
  date_audition: z.string().nullable().optional(),
  delai_legal_jours: z.coerce.number().int().min(1).max(365).optional(),
});

export async function GET(request: Request) {
  try {
    const supabase = createServerClient();
    
    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer le company_id via RPC ou profiles
    const { data: companyId, error: companyError } = await supabase.rpc("get_user_company_id");
    if (companyError || !companyId) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut');
    const type = searchParams.get('type');
    const employee_id = searchParams.get('employee_id');

    let query = supabase
      .from('disciplinary_procedures')
      .select(`
        *,
        employees:employee_id (
          id,
          full_name,
          poste
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (statut) query = query.eq('statut', statut);
    if (type) query = query.eq('type', type);
    if (employee_id) query = query.eq('employee_id', employee_id);

    const { data, error } = await query;

    if (error) {
      console.error('Erreur Supabase (GET disciplinary_procedures):', error);
      return NextResponse.json({ error: 'Erreur lors de la récupération des procédures' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    
    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer le company_id
    const { data: companyId, error: companyError } = await supabase.rpc("get_user_company_id");
    if (companyError || !companyId) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = procedureSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { data: newProcedure, error } = await supabase
      .from('disciplinary_procedures')
      .insert({
        company_id: companyId,
        ...validationResult.data,
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur Supabase (POST disciplinary_procedures):', error);
      return NextResponse.json({ error: 'Erreur lors de la création de la procédure' }, { status: 500 });
    }

    return NextResponse.json(newProcedure, { status: 201 });
  } catch (error) {
    console.error('Erreur de validation ou serveur:', error);
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 });
  }
}

