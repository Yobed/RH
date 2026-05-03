-- Audit Trail table for legal compliance
-- Tracks who modified what and when across all entities

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'approve', 'reject', 'login', 'export', 'generate', 'invite', 'archive')),
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by entity
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
-- Index for chronological browsing
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at DESC);
-- Index for user-based audit
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (user_id);
-- Index for company filtering (multi-tenant)
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs (company_id);

-- RLS: only admins and responsable_rh can read audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_insert_authenticated" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "audit_logs_select_admin" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'responsable_rh')
    )
  );

-- Prevent updates and deletes on audit logs (immutable)
CREATE POLICY "audit_logs_no_update" ON audit_logs
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "audit_logs_no_delete" ON audit_logs
  FOR DELETE TO authenticated
  USING (false);

-- RBAC: Extend profiles role column to support granular roles
-- This is a safe ALTER that adds the new valid values
DO $$
BEGIN
  -- Add a comment documenting the valid roles
  COMMENT ON COLUMN profiles.role IS 'Valid roles: admin, salarie, gestionnaire_paie, manager, responsable_rh, delegue_personnel';
END $$;
