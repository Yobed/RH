-- ── Chatter style Odoo : notes & messages internes sur dossier employé ────
CREATE TABLE IF NOT EXISTS employee_notes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id  UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  author_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kind         VARCHAR(16) NOT NULL DEFAULT 'note',  -- 'note' | 'message'
  body         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT employee_notes_kind_check CHECK (kind IN ('note','message'))
);

CREATE INDEX IF NOT EXISTS idx_employee_notes_employee ON employee_notes(employee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_notes_company ON employee_notes(company_id);

ALTER TABLE employee_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_employee_notes"
  ON employee_notes
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

COMMENT ON TABLE employee_notes IS 'Chatter Odoo-like : notes RH internes et messages sur dossier employé.';
COMMENT ON COLUMN employee_notes.kind IS 'note = interne RH, message = communication tracée.';
