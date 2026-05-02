-- =============================================================================
-- Migration : automatisation du workflow RH
-- - reminders : moteur de rappels centralisé
-- - onboarding_checklists : suivi de l'intégration
-- - bank_transfers : bordereaux de virement
-- - generated_documents : journal des documents auto-générés
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE reminder_severity AS ENUM ('info', 'warn', 'danger', 'overdue');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── reminders ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reminders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category        VARCHAR(40) NOT NULL,              -- declaration / contract / medical / discipline / cdd / accident / probation
  severity        reminder_severity NOT NULL,
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  resource_type   VARCHAR(40),                       -- table cible si applicable
  resource_id     UUID,
  employee_id     UUID REFERENCES employees(id) ON DELETE CASCADE,
  due_date        DATE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- évite les doublons sur la même cible
  UNIQUE (company_id, category, resource_type, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_reminders_company ON reminders(company_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_severity ON reminders(severity);
CREATE INDEX IF NOT EXISTS idx_reminders_unack ON reminders(company_id) WHERE acknowledged_at IS NULL;

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_reminders" ON reminders
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- ── onboarding_checklists ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_checklists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  items         JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id)
);

ALTER TABLE onboarding_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_onboarding" ON onboarding_checklists
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- ── bank_transfers (bordereaux de virement) ───────────────────────────────
CREATE TABLE IF NOT EXISTS bank_transfers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  periode         VARCHAR(7) NOT NULL,    -- YYYY-MM
  format_export   VARCHAR(20) NOT NULL DEFAULT 'CSV',  -- CSV / XML_SCT / OFX
  total_montant   NUMERIC(14,2) NOT NULL DEFAULT 0,
  nb_virements    INTEGER NOT NULL DEFAULT 0,
  nb_rib_manquants INTEGER NOT NULL DEFAULT 0,
  fichier_url     TEXT,
  date_generation TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_envoi      TIMESTAMPTZ,
  banque_destinatrice VARCHAR(120),
  created_by      UUID REFERENCES auth.users(id),
  details         JSONB DEFAULT '{}'::jsonb,
  UNIQUE (company_id, periode, format_export)
);

ALTER TABLE bank_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_bank_transfers" ON bank_transfers
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- ── generated_documents ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS generated_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id   UUID REFERENCES employees(id) ON DELETE CASCADE,
  doc_type      VARCHAR(40) NOT NULL,  -- certificat_travail / attestation_salaire / attestation_travail / dpae / contrat_pdf
  reference     VARCHAR(80),           -- numéro/référence interne
  fichier_url   TEXT,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_generated_docs_employee ON generated_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_generated_docs_type ON generated_documents(doc_type);

ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_generated_docs" ON generated_documents
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());
