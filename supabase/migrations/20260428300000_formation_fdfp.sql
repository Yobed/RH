-- =============================================================================
-- Migration : module Plan de formation FDFP
-- Permet de tracer les actions de formation et de récupérer les crédits FDFP
-- (cotisation 1,2 % + 0,4 % apprentissage = 1,6 %).
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE training_status AS ENUM ('planifie', 'en_cours', 'termine', 'annule');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE training_modality AS ENUM ('interne', 'externe', 'e_learning', 'tutorat');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS training_actions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  intitule        VARCHAR(200) NOT NULL,
  organisme       VARCHAR(150),
  modality        training_modality NOT NULL DEFAULT 'externe',
  description     TEXT,
  domaine         VARCHAR(80),       -- ex. management, technique, sécurité, langues
  date_debut      DATE NOT NULL,
  date_fin        DATE,
  duree_heures    NUMERIC(6,2) NOT NULL DEFAULT 0,
  cout_total      NUMERIC(14,2) NOT NULL DEFAULT 0,
  statut          training_status NOT NULL DEFAULT 'planifie',
  fdfp_eligible   BOOLEAN NOT NULL DEFAULT TRUE,
  fdfp_remboursement NUMERIC(14,2) DEFAULT 0, -- montant récupéré ex post
  fdfp_dossier_ref VARCHAR(80),
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_training_company ON training_actions(company_id);
CREATE INDEX IF NOT EXISTS idx_training_dates ON training_actions(date_debut, date_fin);

ALTER TABLE training_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_training_actions" ON training_actions
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- ── Participants formation ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id     UUID NOT NULL REFERENCES training_actions(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  presence_taux   NUMERIC(5,2) DEFAULT 0,        -- 0-100 %
  evaluation      NUMERIC(4,2),                  -- /20
  certifie        BOOLEAN DEFAULT FALSE,
  certificat_url  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (training_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_train_participants_employee ON training_participants(employee_id);

ALTER TABLE training_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_training_participants" ON training_participants
  USING (
    EXISTS (
      SELECT 1 FROM training_actions t
      WHERE t.id = training_participants.training_id
        AND t.company_id = public.get_user_company_id()
    )
  );
