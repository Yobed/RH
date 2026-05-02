-- =============================================================================
-- Migration : module Déclarations sociales & fiscales — réforme 2026
-- =============================================================================
-- - social_declarations : DIPE (mensuel) / DISA / DASC (annuels)
-- - tax_declarations : ITS mensuel / état annuel DGI
-- - compliance_deadlines : journal des soumissions et alertes
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE declaration_kind AS ENUM ('DIPE', 'DISA', 'DASC');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tax_declaration_kind AS ENUM ('ITS_MENSUEL', 'ITS_ANNUEL', 'IGR_MENSUEL', 'CN_MENSUEL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE declaration_status AS ENUM ('brouillon', 'genere', 'soumis', 'rejete', 'rectifie');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 1. Déclarations sociales (CNPS) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_declarations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  kind                declaration_kind NOT NULL,
  periode             VARCHAR(10) NOT NULL,  -- "2026-04" pour DIPE / "2026" pour DISA/DASC
  statut              declaration_status NOT NULL DEFAULT 'brouillon',
  deadline            DATE NOT NULL,
  date_generation     TIMESTAMPTZ,
  date_soumission     TIMESTAMPTZ,
  numero_recepisse    VARCHAR(80),
  fichier_url         TEXT,
  total_brut          NUMERIC(14,2) DEFAULT 0,
  total_cotisations   NUMERIC(14,2) DEFAULT 0,
  nb_salaries         INTEGER DEFAULT 0,
  details             JSONB DEFAULT '{}'::jsonb,  -- snapshot des lignes par salarié
  penalite_calculee   NUMERIC(14,2) DEFAULT 0,    -- 5% + 1%/mois retard
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by          UUID REFERENCES auth.users(id),
  UNIQUE (company_id, kind, periode)
);

CREATE INDEX idx_social_decl_company ON social_declarations(company_id);
CREATE INDEX idx_social_decl_deadline ON social_declarations(deadline);
CREATE INDEX idx_social_decl_statut ON social_declarations(statut);

ALTER TABLE social_declarations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_social_declarations" ON social_declarations
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

COMMENT ON TABLE social_declarations IS 'DIPE (mensuel ≤15) · DISA / DASC (annuels ≤31 mars). E-CNPS / Code Prévoyance Sociale (Loi 99-477)';
COMMENT ON COLUMN social_declarations.penalite_calculee IS 'Majoration de retard CNPS : 5 % du dû + 1 % par mois supplémentaire (Art. 47 CPS)';

-- ── 2. Déclarations fiscales (DGI) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tax_declarations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  kind                tax_declaration_kind NOT NULL,
  periode             VARCHAR(10) NOT NULL,
  statut              declaration_status NOT NULL DEFAULT 'brouillon',
  deadline            DATE NOT NULL,
  date_generation     TIMESTAMPTZ,
  date_soumission     TIMESTAMPTZ,
  numero_recepisse    VARCHAR(80),
  fichier_url         TEXT,
  total_assiette      NUMERIC(14,2) DEFAULT 0,
  total_retenu        NUMERIC(14,2) DEFAULT 0,
  nb_salaries         INTEGER DEFAULT 0,
  details             JSONB DEFAULT '{}'::jsonb,
  penalite_calculee   NUMERIC(14,2) DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by          UUID REFERENCES auth.users(id),
  UNIQUE (company_id, kind, periode)
);

CREATE INDEX idx_tax_decl_company ON tax_declarations(company_id);
CREATE INDEX idx_tax_decl_deadline ON tax_declarations(deadline);
CREATE INDEX idx_tax_decl_statut ON tax_declarations(statut);

ALTER TABLE tax_declarations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_tax_declarations" ON tax_declarations
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

COMMENT ON TABLE tax_declarations IS 'ITS (mensuel ≤15) / IGR / Contribution Nationale — Réforme 2026 / Art. 116 CGI CI';

-- ── 3. Audit log des actions de déclaration ───────────────────────────────
CREATE TABLE IF NOT EXISTS declaration_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  kind                VARCHAR(40) NOT NULL,        -- 'social' | 'tax'
  declaration_id      UUID NOT NULL,
  event               VARCHAR(40) NOT NULL,        -- 'GENERATED' | 'SUBMITTED' | 'REJECTED' | 'RECTIFIED'
  metadata            JSONB DEFAULT '{}'::jsonb,
  user_id             UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_decl_events_company ON declaration_events(company_id);
CREATE INDEX idx_decl_events_decl ON declaration_events(declaration_id);

ALTER TABLE declaration_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_declaration_events" ON declaration_events
  USING (company_id = public.get_user_company_id());

-- ── 4. Vue pratique : prochaines échéances ─────────────────────────────────
CREATE OR REPLACE VIEW public.compliance_upcoming AS
SELECT
  'social' AS kind_class,
  kind::TEXT AS kind,
  id,
  company_id,
  periode,
  statut::TEXT AS statut,
  deadline,
  total_cotisations AS total,
  EXTRACT(DAY FROM deadline::TIMESTAMP - NOW())::INTEGER AS jours_restants
FROM social_declarations
WHERE statut IN ('brouillon', 'genere', 'rejete')
UNION ALL
SELECT
  'tax' AS kind_class,
  kind::TEXT AS kind,
  id,
  company_id,
  periode,
  statut::TEXT AS statut,
  deadline,
  total_retenu AS total,
  EXTRACT(DAY FROM deadline::TIMESTAMP - NOW())::INTEGER AS jours_restants
FROM tax_declarations
WHERE statut IN ('brouillon', 'genere', 'rejete');
