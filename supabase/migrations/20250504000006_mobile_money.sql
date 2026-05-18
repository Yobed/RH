-- Mobile Money payments
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS mobile_money_provider TEXT,
  ADD COLUMN IF NOT EXISTS mobile_money_phone TEXT;

CREATE TABLE IF NOT EXISTS mobile_money_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees(id),
  bulletin_id UUID,
  provider TEXT NOT NULL,
  phone TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  statut TEXT DEFAULT 'initie',
  transaction_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mobile_money_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company access mobile_money" ON mobile_money_payments
  FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
