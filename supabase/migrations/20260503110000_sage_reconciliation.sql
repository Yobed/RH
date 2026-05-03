-- Migration : table de mapping Sage ↔ SIRH
-- Permet de lier un matricule Sage (TEXT dans payroll_logs.employee_id)
-- à un employé SIRH (UUID dans employees.id)

CREATE TABLE IF NOT EXISTS sage_employee_mapping (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id      UUID    NOT NULL REFERENCES companies(id),
  sage_employee_id TEXT   NOT NULL,   -- matricule brut dans payroll_logs (ex: "EMP001")
  employee_id     UUID    REFERENCES employees(id),  -- FK vers employees
  UNIQUE(company_id, sage_employee_id)
);

ALTER TABLE sage_employee_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "isolation_company" ON sage_employee_mapping
  USING (company_id = get_user_company_id());

CREATE INDEX IF NOT EXISTS idx_sage_mapping_company
  ON sage_employee_mapping(company_id);
