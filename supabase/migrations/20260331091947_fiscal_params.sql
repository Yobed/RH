-- Migration: fiscal_params
-- Plan: 02-05 Multi-convention collective
-- Crée la table de paramètres fiscaux par entreprise (convention collective + valeur de point)

CREATE TABLE IF NOT EXISTS fiscal_params (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  convention    TEXT NOT NULL DEFAULT 'CCI',
  valeur_point  NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

-- Index for RLS lookup performance
CREATE INDEX IF NOT EXISTS fiscal_params_company_id_idx ON fiscal_params(company_id);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION update_fiscal_params_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fiscal_params_updated_at
  BEFORE UPDATE ON fiscal_params
  FOR EACH ROW
  EXECUTE FUNCTION update_fiscal_params_updated_at();

-- RLS
ALTER TABLE fiscal_params ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fiscal_params_company_isolation"
  ON fiscal_params
  USING (company_id = get_user_company_id());

CREATE POLICY "fiscal_params_insert"
  ON fiscal_params
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "fiscal_params_update"
  ON fiscal_params
  FOR UPDATE
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());
