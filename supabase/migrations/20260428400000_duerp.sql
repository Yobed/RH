-- =============================================================================
-- Migration : DUERP — Document Unique d'Évaluation des Risques Professionnels
-- Obligation Code de la sécurité sociale CI / Convention OIT 155.
-- Mise à jour annuelle obligatoire et après tout événement modifiant les
-- conditions de travail.
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE risk_severity AS ENUM ('faible', 'moyenne', 'elevee', 'critique');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE risk_status AS ENUM ('identifie', 'en_traitement', 'maitrise', 'reevalue');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS duerp_risks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  unite_travail   VARCHAR(150) NOT NULL,         -- atelier, bureau, chantier, site
  category        VARCHAR(80) NOT NULL,           -- physique, chimique, biologique, psychosocial, ergonomique, électrique, incendie, routier
  description     TEXT NOT NULL,                  -- nature du risque
  exposure        TEXT,                           -- qui est exposé, fréquence
  gravite         INTEGER NOT NULL CHECK (gravite BETWEEN 1 AND 4),       -- 1 mineur · 2 modéré · 3 grave · 4 très grave
  probabilite     INTEGER NOT NULL CHECK (probabilite BETWEEN 1 AND 4),   -- 1 improbable · 2 occasionnelle · 3 fréquente · 4 quasi-permanente
  criticite       INTEGER GENERATED ALWAYS AS (gravite * probabilite) STORED,
  severity        risk_severity GENERATED ALWAYS AS (
    CASE
      WHEN gravite * probabilite >= 12 THEN 'critique'::risk_severity
      WHEN gravite * probabilite >= 8  THEN 'elevee'::risk_severity
      WHEN gravite * probabilite >= 4  THEN 'moyenne'::risk_severity
      ELSE 'faible'::risk_severity
    END
  ) STORED,
  prevention_existante TEXT,                       -- mesures actuelles
  prevention_a_venir   TEXT,                       -- plan d'action
  responsable     VARCHAR(150),                    -- qui pilote la prévention
  echeance        DATE,                            -- quand
  status          risk_status NOT NULL DEFAULT 'identifie',
  derniere_revision DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_duerp_company ON duerp_risks(company_id);
CREATE INDEX IF NOT EXISTS idx_duerp_severity ON duerp_risks(severity);
CREATE INDEX IF NOT EXISTS idx_duerp_status ON duerp_risks(status);

ALTER TABLE duerp_risks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_duerp_risks" ON duerp_risks
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_duerp_risks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_duerp_risks_updated_at ON duerp_risks;
CREATE TRIGGER trg_duerp_risks_updated_at
  BEFORE UPDATE ON duerp_risks
  FOR EACH ROW EXECUTE FUNCTION update_duerp_risks_updated_at();
