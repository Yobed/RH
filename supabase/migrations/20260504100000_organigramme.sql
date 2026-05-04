-- Organigramme : relation hiérarchique entre employés
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);

COMMENT ON COLUMN employees.manager_id IS 'Supérieur hiérarchique direct (auto-référence)';
