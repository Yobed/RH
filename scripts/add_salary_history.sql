-- Migration : historique des éléments de salaire par employé
-- Chaque modification salariale sauvegarde un snapshot de l'ancienne situation
-- À exécuter dans le SQL Editor Supabase

CREATE TABLE IF NOT EXISTS employee_salary_history (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id           UUID NOT NULL,
  employee_id          UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date_effet           DATE NOT NULL DEFAULT CURRENT_DATE,
  salaire_brut         NUMERIC(12,2),
  sursalaire           NUMERIC(12,2) DEFAULT 0,
  prime_exceptionnelle NUMERIC(12,2) DEFAULT 0,
  prime_salissure      NUMERIC(12,2) DEFAULT 0,
  prime_depassement    NUMERIC(12,2) DEFAULT 0,
  prime_fonction       NUMERIC(12,2) DEFAULT 0,
  prime_transport      NUMERIC(12,2) DEFAULT 0,
  motif                VARCHAR(255),
  created_at           TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE employee_salary_history ENABLE ROW LEVEL SECURITY;

-- Isolation par entreprise (multi-tenant)
CREATE POLICY "company_isolation" ON employee_salary_history
  USING (company_id = (
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  ));
