-- ──────────────────────────────────────────────────────────────────────────
-- Migration : RTT (Réduction du Temps de Travail) + Ruptures de contrat
-- Note : RTT n'existe pas dans le CT-CI — usage conventionnel uniquement
-- ──────────────────────────────────────────────────────────────────────────

-- Table RTT : solde et mouvements par salarié
CREATE TABLE IF NOT EXISTS rtt_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  periode       CHAR(7) NOT NULL,           -- YYYY-MM
  type          TEXT NOT NULL CHECK (type IN ('acquisition', 'prise', 'annulation')),
  nb_jours      NUMERIC(5,2) NOT NULL,       -- Jours RTT concernés
  motif         TEXT,
  statut        TEXT NOT NULL DEFAULT 'valide' CHECK (statut IN ('valide', 'refuse', 'annule')),
  valide_par    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rtt_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rtt_company_isolation" ON rtt_records
  USING (company_id = get_user_company_id());

-- Index performances
CREATE INDEX IF NOT EXISTS idx_rtt_employee ON rtt_records(employee_id, periode);
CREATE INDEX IF NOT EXISTS idx_rtt_company  ON rtt_records(company_id, periode);

-- ──────────────────────────────────────────────────────────────────────────
-- Table ruptures : gestion formalisée des fins de contrat
-- Base légale : Art. 16-18 (CDD) / Art. 34-76 (CDI) CT-CI
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ruptures (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id           UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type_rupture          TEXT NOT NULL CHECK (type_rupture IN (
                          'licenciement_faute_simple',
                          'licenciement_faute_grave',
                          'licenciement_economique',
                          'demission',
                          'rupture_conventionnelle',
                          'fin_cdd',
                          'fin_periode_essai',
                          'deces',
                          'depart_retraite'
                        )),
  date_notification     DATE NOT NULL,
  date_fin_preavis      DATE,
  date_sortie_effective DATE NOT NULL,
  motif_detaille        TEXT,
  -- Éléments STC calculés (FCFA)
  indemnite_licenciement    NUMERIC(15,2) DEFAULT 0,
  indemnite_precarite       NUMERIC(15,2) DEFAULT 0,   -- CDD uniquement
  indemnite_compensatrice   NUMERIC(15,2) DEFAULT 0,   -- Congés non pris
  indemnite_preavis         NUMERIC(15,2) DEFAULT 0,
  total_stc                 NUMERIC(15,2) DEFAULT 0,
  -- Paramètres de calcul archivés
  anciennete_annees         NUMERIC(5,2),
  jours_conges_restants     NUMERIC(5,2),
  jours_preavis_non_effectues INTEGER DEFAULT 0,
  salaire_moyen_12_mois     NUMERIC(15,2),
  -- Suivi
  statut        TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'notifie', 'signe', 'solde')),
  documents     JSONB DEFAULT '[]',
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ruptures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ruptures_company_isolation" ON ruptures
  USING (company_id = get_user_company_id());

CREATE INDEX IF NOT EXISTS idx_ruptures_employee  ON ruptures(employee_id);
CREATE INDEX IF NOT EXISTS idx_ruptures_company   ON ruptures(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ruptures_statut    ON ruptures(statut);
