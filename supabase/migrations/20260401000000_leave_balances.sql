-- Migration: leave_balances
-- Phase 03 Plan 01 — Solde congés légaux CI (Art. 25 CT-CI : 2,2 j/mois)
-- Date : 2026-04-01

CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  annee INTEGER NOT NULL,
  jours_acquis NUMERIC(5,1) NOT NULL DEFAULT 0,
  jours_pris NUMERIC(5,1) NOT NULL DEFAULT 0,
  solde NUMERIC(5,1) GENERATED ALWAYS AS (GREATEST(0, jours_acquis - jours_pris)) STORED,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT leave_balances_unique UNIQUE (company_id, employee_id, annee)
);

ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Isolation entreprise leave_balances"
  ON leave_balances FOR ALL
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE INDEX IF NOT EXISTS idx_leave_balances_employee ON leave_balances(employee_id, annee);
