-- Create the disciplinary_procedures table
CREATE TABLE IF NOT EXISTS public.disciplinary_procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    motif TEXT NOT NULL,
    statut TEXT NOT NULL,
    date_incident DATE,
    date_notification DATE,
    reponse_employe TEXT,
    sanction_appliquee TEXT,
    documents_urls JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE public.disciplinary_procedures ENABLE ROW LEVEL SECURITY;

-- Policy: Isolation entreprise pour les procédures disciplinaires
CREATE POLICY "Isolation entreprise disciplinary_procedures"
    ON public.disciplinary_procedures
    FOR ALL
    USING (company_id = public.get_user_company_id())
    WITH CHECK (company_id = public.get_user_company_id());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_disciplinary_procedures_company_id ON public.disciplinary_procedures(company_id);
CREATE INDEX IF NOT EXISTS idx_disciplinary_procedures_employee_id ON public.disciplinary_procedures(employee_id);
CREATE INDEX IF NOT EXISTS idx_disciplinary_procedures_statut ON public.disciplinary_procedures(statut);
CREATE INDEX IF NOT EXISTS idx_disciplinary_procedures_type ON public.disciplinary_procedures(type);
