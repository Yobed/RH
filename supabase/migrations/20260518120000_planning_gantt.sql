-- =============================================================================
-- Module Planning Gantt par ressource (style Odoo Planning)
-- Différent du planning hebdomadaire shift-based existant.
-- =============================================================================

-- ── planning_roles : rôles / postes à pourvoir ────────────────────────────────
CREATE TABLE IF NOT EXISTS planning_roles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name         VARCHAR(80) NOT NULL,                -- "Chef de cuisine", "Caissier", "Manutention"
  color        VARCHAR(20) DEFAULT '#6366f1',
  description  TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_planning_roles_company ON planning_roles(company_id);

ALTER TABLE planning_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_planning_roles_all" ON planning_roles
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- ── planning_slots : créneaux du planning gantt ────────────────────────────────
CREATE TABLE IF NOT EXISTS planning_slots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role_id         UUID REFERENCES planning_roles(id) ON DELETE SET NULL,
  employee_id     UUID REFERENCES employees(id) ON DELETE SET NULL, -- NULL = poste ouvert
  start_at        TIMESTAMPTZ NOT NULL,
  end_at          TIMESTAMPTZ NOT NULL,
  status          VARCHAR(16) NOT NULL DEFAULT 'brouillon',         -- 'brouillon' | 'publie'
  project         VARCHAR(120),                                     -- projet / chantier / événement
  notes           TEXT,
  published_at    TIMESTAMPTZ,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT planning_slots_status_check CHECK (status IN ('brouillon','publie')),
  CONSTRAINT planning_slots_range_check  CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS idx_planning_slots_company        ON planning_slots(company_id);
CREATE INDEX IF NOT EXISTS idx_planning_slots_employee_start ON planning_slots(employee_id, start_at);
CREATE INDEX IF NOT EXISTS idx_planning_slots_role_start     ON planning_slots(role_id, start_at);
CREATE INDEX IF NOT EXISTS idx_planning_slots_period         ON planning_slots(company_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_planning_slots_open           ON planning_slots(company_id, start_at) WHERE employee_id IS NULL;

ALTER TABLE planning_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_planning_slots_all" ON planning_slots
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- ── Trigger updated_at ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_planning_roles_updated ON planning_roles;
CREATE TRIGGER trg_planning_roles_updated
  BEFORE UPDATE ON planning_roles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_planning_slots_updated ON planning_slots;
CREATE TRIGGER trg_planning_slots_updated
  BEFORE UPDATE ON planning_slots
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE planning_roles IS 'Rôles à pourvoir dans le planning gantt (Chef, Serveur, Manutention…).';
COMMENT ON TABLE planning_slots IS 'Créneaux datés du planning gantt — employee_id NULL = poste ouvert.';
COMMENT ON COLUMN planning_slots.status IS 'brouillon (visible RH seulement) | publie (visible salariés).';
