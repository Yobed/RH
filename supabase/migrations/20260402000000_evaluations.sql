-- Create the evaluations table
CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    evaluateur_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    titre TEXT NOT NULL,
    type TEXT NOT NULL,
    statut TEXT NOT NULL,
    date_prevue DATE NOT NULL,
    date_realisation DATE,
    score_global NUMERIC(5, 2),
    commentaires_evaluateur TEXT,
    commentaires_employe TEXT,
    objectifs_futurs TEXT,
    criteres_evaluation JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Policy: Isolation entreprise pour les évaluations
CREATE POLICY "Isolation entreprise evaluations"
    ON public.evaluations
    FOR ALL
    USING (company_id = public.get_user_company_id())
    WITH CHECK (company_id = public.get_user_company_id());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_evaluations_company_id ON public.evaluations(company_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_employee_id ON public.evaluations(employee_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_statut ON public.evaluations(statut);
