-- Migration versionnée depuis scripts/migration_securite.sql
-- Appliquée manuellement en production (date approximative : 20260324120000)
-- NE PAS réexécuter si les colonnes/tables existent déjà (scripts avec IF NOT EXISTS)

-- ============================================================
-- MIGRATION SÉCURITÉ — RH Manager CI
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- Date : mars 2026
-- ============================================================

-- ── 1. Table audit_logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id),
  user_id     UUID NOT NULL REFERENCES profiles(id),
  action      TEXT NOT NULL,   -- 'CREATE' | 'UPDATE' | 'DELETE'
  resource    TEXT NOT NULL,   -- 'employee' | 'bulletin_paie' | 'conge' etc.
  resource_id UUID,
  details     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Les admins RH peuvent lire les logs de leur entreprise — personne ne peut les modifier
CREATE POLICY "audit_logs_read" ON audit_logs
  FOR SELECT USING (company_id = get_user_company_id());

-- Seule l'insertion est permise (immuable)
CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (company_id = get_user_company_id());


-- ── 2. RLS sur conges ──────────────────────────────────────────────────
ALTER TABLE conges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conges_isolation" ON conges
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());


-- ── 3. RLS sur bulletins_paie ──────────────────────────────────────────
ALTER TABLE bulletins_paie ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bulletins_paie_isolation" ON bulletins_paie
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());


-- ── 4. RLS sur companies (lecture seule de sa propre entreprise) ───────
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_read_own" ON companies
  FOR SELECT USING (id = get_user_company_id());

CREATE POLICY "companies_update_own" ON companies
  FOR UPDATE USING (id = get_user_company_id());


-- ── 5. RLS sur profiles ────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Un utilisateur voit les profils de sa propre entreprise
CREATE POLICY "profiles_company_isolation" ON profiles
  USING (company_id = get_user_company_id());

-- Un utilisateur peut modifier uniquement son propre profil
CREATE POLICY "profiles_self_update" ON profiles
  FOR UPDATE USING (id = auth.uid());


-- ── 6. RLS sur legal_documents (partagés entre entreprises) ───────────
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

-- Documents légaux publics (company_id IS NULL) accessibles à tous les authentifiés
-- Documents spécifiques à une entreprise : isolation classique
CREATE POLICY "legal_documents_read" ON legal_documents
  FOR SELECT USING (
    company_id IS NULL OR company_id = get_user_company_id()
  );

-- Seule une insertion avec company_id valide est permise
CREATE POLICY "legal_documents_insert" ON legal_documents
  FOR INSERT WITH CHECK (
    company_id IS NULL OR company_id = get_user_company_id()
  );


-- ── 7. Vérification : lister les tables sans RLS ──────────────────────
-- Exécuter cette requête pour vérifier après la migration :
/*
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
*/

-- ── 8. Index performance ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_conges_company ON conges(company_id);
CREATE INDEX IF NOT EXISTS idx_conges_employee ON conges(employee_id);
CREATE INDEX IF NOT EXISTS idx_bulletins_company ON bulletins_paie(company_id);
CREATE INDEX IF NOT EXISTS idx_bulletins_employee ON bulletins_paie(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_company_lu ON notifications(company_id, lu);
