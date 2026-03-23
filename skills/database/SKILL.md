# SKILL — Base de données Supabase
> Lis ce fichier avant toute migration ou modification de schéma.

## Principes
1. RLS activé sur TOUTES les tables
2. company_id dans TOUTES les tables (multi-tenant)
3. Migrations dans supabase/migrations/
4. Types générés après chaque migration

## Migration initiale — SQL complet

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  convention_collective TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  role TEXT NOT NULL CHECK (role IN ('admin','rh','manager','employee')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  matricule TEXT NOT NULL,
  full_name TEXT NOT NULL,
  date_naissance DATE,
  genre TEXT CHECK (genre IN ('M','F')),
  email TEXT,
  phone TEXT,
  poste TEXT NOT NULL,
  departement TEXT,
  date_embauche DATE NOT NULL,
  type_contrat TEXT CHECK (type_contrat IN ('CDI','CDD','Stage','Apprentissage')),
  salaire_brut NUMERIC(12,0),
  statut TEXT DEFAULT 'actif' CHECK (statut IN ('actif','inactif','suspendu')),
  manager_id UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, matricule)
);

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  type_contrat TEXT NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE,
  date_fin_essai DATE,
  salaire_brut NUMERIC(12,0) NOT NULL,
  renouvellement_count INTEGER DEFAULT 0,
  statut TEXT DEFAULT 'actif',
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  employee_id UUID REFERENCES employees(id),
  name TEXT NOT NULL,
  famille TEXT CHECK (famille IN ('Contrat','Diplômes','Paie','Médical','Congés','Disciplinaire','Formation','Autre')),
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size_kb INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  evaluateur_id UUID REFERENCES employees(id),
  periodicite TEXT CHECK (periodicite IN ('mensuel','trimestriel','semestriel','annuel')),
  periode TEXT NOT NULL,
  date_evaluation DATE NOT NULL,
  scores JSONB NOT NULL DEFAULT '{}',
  score_global NUMERIC(4,2),
  statut TEXT DEFAULT 'brouillon',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  competences TEXT[],
  experience_min INTEGER,
  salaire_min NUMERIC(12,0),
  salaire_max NUMERIC(12,0),
  type_contrat TEXT,
  statut TEXT DEFAULT 'ouvert',
  date_limite DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  job_id UUID REFERENCES job_postings(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cv_url TEXT,
  score_ia NUMERIC(5,2),
  score_detail JSONB,
  statut TEXT DEFAULT 'nouveau',
  notes_rh TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE legal_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  employee_id UUID REFERENCES employees(id),
  reference TEXT NOT NULL,
  type_cas TEXT,
  titre TEXT NOT NULL,
  description TEXT,
  date_ouverture DATE NOT NULL DEFAULT CURRENT_DATE,
  statut TEXT DEFAULT 'ouvert',
  priorite TEXT DEFAULT 'normale',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  source TEXT NOT NULL,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON legal_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  titre TEXT NOT NULL,
  message TEXT,
  lu BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## RLS — Activer sur toutes les tables
```sql
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "isolation_company" ON employees
  USING (company_id = get_user_company_id());
```

## Commandes Supabase CLI
```bash
npx supabase init
npx supabase migration new init_saas_rh
npx supabase db push
npx supabase gen types typescript --project-id TON_ID > types/supabase.ts
```
