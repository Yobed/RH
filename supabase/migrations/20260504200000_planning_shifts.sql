-- =============================================================================
-- Migration : Planning & shifts (horaires et roulements d'équipe)
-- =============================================================================

-- ── shifts : modèles de plages horaires (Matin, Après-midi, Nuit, Repos…) ────
CREATE TABLE IF NOT EXISTS shifts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            VARCHAR(60) NOT NULL,
  code            VARCHAR(10),                 -- ex: "M", "AM", "N", "R"
  color           VARCHAR(20) DEFAULT '#3b82f6',
  start_time      TIME,
  end_time        TIME,
  break_minutes   INT DEFAULT 0,
  is_rest         BOOLEAN DEFAULT false,       -- repos / off / RTT
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shifts_company ON shifts(company_id);

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_shifts_select" ON shifts FOR SELECT
  USING (company_id = public.get_user_company_id());
CREATE POLICY "tenant_shifts_insert" ON shifts FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "tenant_shifts_update" ON shifts FOR UPDATE
  USING (company_id = public.get_user_company_id());
CREATE POLICY "tenant_shifts_delete" ON shifts FOR DELETE
  USING (company_id = public.get_user_company_id());

COMMENT ON TABLE shifts IS 'Modèles de plages horaires réutilisables pour le planning';

-- ── shift_assignments : qui travaille quoi quel jour ──────────────────────────
CREATE TABLE IF NOT EXISTS shift_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shift_id        UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(employee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_shift_assignments_company ON shift_assignments(company_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_employee ON shift_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_date ON shift_assignments(date);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_company_date ON shift_assignments(company_id, date);

ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_shift_assignments_select" ON shift_assignments FOR SELECT
  USING (company_id = public.get_user_company_id());
CREATE POLICY "tenant_shift_assignments_insert" ON shift_assignments FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "tenant_shift_assignments_update" ON shift_assignments FOR UPDATE
  USING (company_id = public.get_user_company_id());
CREATE POLICY "tenant_shift_assignments_delete" ON shift_assignments FOR DELETE
  USING (company_id = public.get_user_company_id());

COMMENT ON TABLE shift_assignments IS 'Affectation d''un shift à un employé sur une date donnée';
