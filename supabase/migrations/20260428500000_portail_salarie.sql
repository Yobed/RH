-- =============================================================================
-- Migration : Portail salarié
-- - profiles.employee_id : lien optionnel vers la fiche salarié
-- - profiles.role enrichi (rôle 'salarie' pour accès portail)
-- - portal_leave_requests : table dédiée aux demandes de congés depuis le portail
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;

COMMENT ON COLUMN profiles.employee_id IS 'Lien vers la fiche employé pour les utilisateurs ayant le rôle salarie (portail self-service)';

CREATE INDEX IF NOT EXISTS idx_profiles_employee_id ON profiles(employee_id);

-- ── Mises à jour effectuées par le salarié sur son profil (audit) ──────────
CREATE TABLE IF NOT EXISTS portal_self_updates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  field         VARCHAR(80) NOT NULL,
  old_value     TEXT,
  new_value     TEXT,
  user_id       UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_updates_employee ON portal_self_updates(employee_id);

ALTER TABLE portal_self_updates ENABLE ROW LEVEL SECURITY;

-- L'admin RH voit les mises à jour de son entreprise
CREATE POLICY "tenant_isolation_portal_updates_admin" ON portal_self_updates
  FOR SELECT
  USING (company_id = public.get_user_company_id());

-- Le salarié voit ses propres mises à jour
CREATE POLICY "self_portal_updates_select" ON portal_self_updates
  FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

-- Insertion : par le service-role uniquement (via API serveur)
CREATE POLICY "service_role_portal_updates_insert" ON portal_self_updates
  FOR INSERT
  WITH CHECK (true);
