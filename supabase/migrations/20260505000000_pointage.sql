-- =============================================================================
-- Migration : Pointage (clock-in / clock-out)
-- =============================================================================

CREATE TABLE IF NOT EXISTS time_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  clock_in      TIMESTAMPTZ NOT NULL,
  clock_out     TIMESTAMPTZ,
  worked_minutes INT,                       -- calculé au clock_out
  source        VARCHAR(20) DEFAULT 'portal', -- portal | manual | mobile
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_entries_company ON time_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_employee_date ON time_entries(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- L'admin RH voit toutes les entrées de son entreprise
CREATE POLICY "tenant_time_entries_select_admin" ON time_entries FOR SELECT
  USING (company_id = public.get_user_company_id());

-- Le salarié voit ses propres pointages
CREATE POLICY "self_time_entries_select" ON time_entries FOR SELECT
  USING (employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid()));

-- Le salarié pointe pour lui-même
CREATE POLICY "self_time_entries_insert" ON time_entries FOR INSERT
  WITH CHECK (employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "self_time_entries_update" ON time_entries FOR UPDATE
  USING (employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid()));

-- L'admin peut tout faire
CREATE POLICY "tenant_time_entries_admin_all" ON time_entries FOR ALL
  USING (company_id = public.get_user_company_id());

COMMENT ON TABLE time_entries IS 'Pointage (clock-in / clock-out) des salariés';
