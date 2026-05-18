-- ================================================================
-- Migration : Offboarding checklists — Restitution des biens et formalités de sortie
-- Date : 2026-05-18
-- Calque sur onboarding_checklists, avec lien optionnel à une rupture.
-- ================================================================

CREATE TABLE IF NOT EXISTS offboarding_checklists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  rupture_id    UUID REFERENCES ruptures(id) ON DELETE SET NULL,
  items         JSONB NOT NULL DEFAULT '[]'::jsonb,
  date_sortie_prevue DATE,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id)
);

CREATE INDEX IF NOT EXISTS idx_offboarding_rupture ON offboarding_checklists(rupture_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_company ON offboarding_checklists(company_id);

COMMENT ON TABLE offboarding_checklists IS 'Checklist de sortie employé : restitution des biens (badge, ordi, véhicule…) + formalités administratives. Lié à une rupture si applicable.';
COMMENT ON COLUMN offboarding_checklists.items IS 'Array JSONB d''OffboardingItem (voir lib/offboarding-template.ts)';
COMMENT ON COLUMN offboarding_checklists.rupture_id IS 'Rupture associée (NULL si checklist créée préventivement)';

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_offboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_offboarding_updated_at ON offboarding_checklists;
CREATE TRIGGER trg_offboarding_updated_at
  BEFORE UPDATE ON offboarding_checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_offboarding_updated_at();

-- RLS isolation par entreprise
ALTER TABLE offboarding_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_offboarding" ON offboarding_checklists;
CREATE POLICY "tenant_isolation_offboarding" ON offboarding_checklists
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());
