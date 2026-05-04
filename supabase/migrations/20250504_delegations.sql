-- Délégations temporaires manager
CREATE TABLE IF NOT EXISTS manager_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  delegant_id UUID NOT NULL REFERENCES profiles(id),
  delegataire_id UUID NOT NULL REFERENCES profiles(id),
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  modules TEXT[] DEFAULT '{conges,evaluations}',
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE manager_delegations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company access delegations" ON manager_delegations
  FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
