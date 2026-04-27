import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';


const bodySchema = z.object({
  employee_id: z.string().uuid('Sélectionnez un employé valide'),
  date_debut: z.string().min(1, 'Date de début obligatoire'),
  date_fin: z.string().min(1, 'Date de fin obligatoire'),
  nb_jours: z.coerce.number().int().positive(),
  est_at: z.coerce.boolean().default(false),
  commentaire: z.string().max(500).optional(),
});

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo

export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // Récupérer company_id de manière résiliente
  let company_id: string | null = null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();
  
  if (profile?.company_id) {
    company_id = profile.company_id;
  }

  if (!company_id) {
    const { data: employee } = await supabase
      .from('employees')
      .select('company_id')
      .eq('user_id', user.id)
      .single();
    
    if (employee?.company_id) {
      company_id = employee.company_id;
    }
  }

  if (!company_id) {
    const { data: rpcId } = await supabase.rpc('get_user_company_id');
    if (rpcId) {
      company_id = rpcId;
    }
  }

  if (!company_id) {
    const { data: firstCompany } = await supabase.from('companies').select('id').limit(1).single();
    if (firstCompany) {
      company_id = firstCompany.id;
    }
  }

  if (!company_id) {
    return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 400 });
  }

  let fields: Record<string, string>;
  let file: File | null = null;

  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    fields = {
      employee_id: String(formData.get('employee_id') ?? ''),
      date_debut: String(formData.get('date_debut') ?? ''),
      date_fin: String(formData.get('date_fin') ?? ''),
      nb_jours: String(formData.get('nb_jours') ?? '0'),
      est_at: String(formData.get('est_at') ?? 'false'),
      commentaire: String(formData.get('commentaire') ?? ''),
    };
    const uploaded = formData.get('justificatif');
    if (uploaded instanceof File && uploaded.size > 0) {
      file = uploaded;
    }
  } else {
    const body = await req.json().catch(() => ({}));
    fields = body;
  }

  const parsed = bodySchema.safeParse(fields);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { employee_id, date_debut, date_fin, nb_jours, est_at, commentaire } = parsed.data;

  let justificatif_url: string | null = null;
  let est_justifie = false;

  if (file) {
    // Validation fichier
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ error: 'Format fichier invalide. Acceptés : PDF, JPEG, PNG.' }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo).' }, { status: 400 });
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${company_id}/${employee_id}/Medical/${timestamp}_${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Erreur upload justificatif.' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath);

    justificatif_url = urlData.publicUrl;
    est_justifie = true;
  }

  const { data: conge, error: insertError } = await supabase
    .from('conges')
    .insert({
      employee_id,
      date_debut,
      date_fin,
      nb_jours,
      type: 'arret_maladie',
      statut: 'en_attente',
      est_at,
      est_justifie,
      justificatif_url,
      commentaire: commentaire || null,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Insert error:', insertError);
    return NextResponse.json({ error: 'Erreur création arrêt maladie.' }, { status: 500 });
  }

  return NextResponse.json(conge, { status: 201 });
}

