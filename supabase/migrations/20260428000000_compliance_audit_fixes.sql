-- =============================================================================
-- Migration : corrections de conformité audit réglementaire CI
-- =============================================================================
-- - companies : taux AT/MP variable, adresse paie, RCC service paie
-- - employees : consentement données personnelles (Loi n° 2013-450 ARTCI)
-- - disciplinary_procedures : workflow Art. 28 CT-CI (convocation/audition/délais)
-- - work_accidents : déclaration CNPS 48h tracée
-- - medical_visits : suggestion auto échéance
-- - data_retention_policy : référentiel des durées légales d'archivage
-- =============================================================================

-- ── 1. companies — taux AT/MP variable + infos bulletin ────────────────────
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS taux_at_mp           NUMERIC(6,4) DEFAULT 0.03 CHECK (taux_at_mp >= 0 AND taux_at_mp <= 0.10),
  ADD COLUMN IF NOT EXISTS adresse_paie         VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contact_paie         VARCHAR(150),  -- ex. "Service paie - +225 27 21 00 00 - paie@entreprise.ci"
  ADD COLUMN IF NOT EXISTS code_naf             VARCHAR(20);   -- secteur d'activité (utile pour AT/MP)

COMMENT ON COLUMN companies.taux_at_mp IS 'Taux Accidents du travail / Maladies professionnelles (variable selon secteur, 2-5%)';
COMMENT ON COLUMN companies.contact_paie IS 'Coordonnées service paie — mention obligatoire bulletin (Arrêté 2008-2401)';

-- ── 2. employees — consentement Loi n° 2013-450 (ARTCI) ────────────────────
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS consent_donnees_personnelles_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS date_archivage_prevue           DATE;  -- calculée automatiquement à la sortie

COMMENT ON COLUMN employees.consent_donnees_personnelles_at IS 'Horodatage du consentement explicite — Art. 35 Loi 2013-450';
COMMENT ON COLUMN employees.date_archivage_prevue IS 'Échéance d''archivage (5 ans paie / 10 ans compta) après départ';

-- ── 3. disciplinary_procedures — workflow Art. 28 CT-CI ────────────────────
ALTER TABLE disciplinary_procedures
  ADD COLUMN IF NOT EXISTS date_convocation     DATE,
  ADD COLUMN IF NOT EXISTS date_audition        DATE,
  ADD COLUMN IF NOT EXISTS delai_legal_jours    INTEGER DEFAULT 60,  -- 2 mois max après les faits, Art. 28.2
  ADD COLUMN IF NOT EXISTS date_archivage_prevue DATE;  -- 2 ans après la sanction si pas de récidive (Art. 28.4)

COMMENT ON COLUMN disciplinary_procedures.delai_legal_jours IS 'Délai max de notification après les faits — Art. 28.2 CT-CI (60 jours)';
COMMENT ON COLUMN disciplinary_procedures.date_archivage_prevue IS 'Date à laquelle la sanction doit être rayée du dossier — Art. 28.4 (2 ans)';

-- Trigger : auto-calculer date_archivage_prevue = date_notification + 2 ans
CREATE OR REPLACE FUNCTION set_disciplinary_archive_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_notification IS NOT NULL AND NEW.date_archivage_prevue IS NULL THEN
    NEW.date_archivage_prevue := NEW.date_notification + INTERVAL '2 years';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_disciplinary_archive ON disciplinary_procedures;
CREATE TRIGGER trg_disciplinary_archive
  BEFORE INSERT OR UPDATE ON disciplinary_procedures
  FOR EACH ROW
  EXECUTE FUNCTION set_disciplinary_archive_date();

-- ── 4. work_accidents — déclaration CNPS sous 48h (Art. 47 CT-CI) ─────────
ALTER TABLE work_accidents
  ADD COLUMN IF NOT EXISTS deadline_declaration_cnps TIMESTAMPTZ,  -- date_accident + 48h
  ADD COLUMN IF NOT EXISTS date_declaration_cnps     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS document_declaration_url  TEXT;

COMMENT ON COLUMN work_accidents.deadline_declaration_cnps IS 'Échéance légale de déclaration CNPS — Art. 47 CT-CI (48 heures après l''accident)';

-- Trigger : auto-calculer la deadline 48h
CREATE OR REPLACE FUNCTION set_accident_cnps_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_accident IS NOT NULL AND NEW.deadline_declaration_cnps IS NULL THEN
    NEW.deadline_declaration_cnps := (NEW.date_accident::TIMESTAMPTZ + INTERVAL '48 hours');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_accident_cnps_deadline ON work_accidents;
CREATE TRIGGER trg_accident_cnps_deadline
  BEFORE INSERT OR UPDATE ON work_accidents
  FOR EACH ROW
  EXECUTE FUNCTION set_accident_cnps_deadline();

-- ── 5. medical_visits — auto-création de la visite suivante ────────────────
-- Périodicités légales (Art. 41 CT-CI / Décret 96-204) :
--   - embauche → +1 an
--   - périodique → +1 an (postes standards) / +6 mois (postes à risques)
--   - reprise → +6 mois
ALTER TABLE medical_visits
  ADD COLUMN IF NOT EXISTS poste_a_risque BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN medical_visits.poste_a_risque IS 'Poste à risques nécessitant visite semestrielle (vs annuelle)';

-- Trigger : si date_prochaine null, calculer selon le type
CREATE OR REPLACE FUNCTION set_next_medical_visit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_visite IS NOT NULL AND NEW.date_prochaine IS NULL THEN
    NEW.date_prochaine := CASE
      WHEN NEW.type_visite = 'reprise' THEN NEW.date_visite + INTERVAL '6 months'
      WHEN NEW.poste_a_risque = TRUE THEN NEW.date_visite + INTERVAL '6 months'
      ELSE NEW.date_visite + INTERVAL '1 year'
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_next_medical_visit ON medical_visits;
CREATE TRIGGER trg_next_medical_visit
  BEFORE INSERT OR UPDATE ON medical_visits
  FOR EACH ROW
  EXECUTE FUNCTION set_next_medical_visit();

-- ── 6. data_retention_policy — référentiel durées légales ──────────────────
CREATE TABLE IF NOT EXISTS data_retention_policy (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domaine         VARCHAR(80) NOT NULL,
  duree_ans       INTEGER NOT NULL CHECK (duree_ans > 0 AND duree_ans <= 50),
  base_legale     VARCHAR(200) NOT NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (domaine)
);

INSERT INTO data_retention_policy (domaine, duree_ans, base_legale, description) VALUES
  ('paie',                  5,  'Code Général des Impôts CI Art. 36',           'Bulletins de paie, livres de paie, déclarations sociales'),
  ('comptabilite',          10, 'Acte uniforme OHADA Art. 24',                  'Documents comptables et pièces justificatives'),
  ('contrat_travail',       5,  'Code du travail CI Art. 73',                   'Contrats, avenants, lettres de licenciement (à compter du départ)'),
  ('disciplinaire',         2,  'Code du travail CI Art. 28.4',                 'Sanctions disciplinaires (à compter de la notification)'),
  ('candidature_non_retenue', 2,'Loi 2013-450 (ARTCI) — recommandation',        'CV et données candidats non retenus'),
  ('medical',               5,  'Code du travail CI Art. 41 / Décret 96-204',   'Dossier médical après départ'),
  ('accident_travail',      10, 'Code de la SS CI Art. 47',                     'Dossier d''accident du travail'),
  ('rgpd_employes',         5,  'Loi 2013-450 ARTCI Art. 40',                   'Données personnelles employés (à compter du départ)')
ON CONFLICT (domaine) DO NOTHING;

ALTER TABLE data_retention_policy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "data_retention_read_all" ON data_retention_policy FOR SELECT USING (true);

-- ── 7. fonction utilitaire : vérifier cumul CDD avant insertion ────────────
-- Renvoie le nombre total de mois cumulés sur les CDD actifs/passés non résiliés
CREATE OR REPLACE FUNCTION public.get_cdd_cumul_months(p_employee_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(
    CASE
      WHEN c.date_fin IS NULL THEN
        EXTRACT(EPOCH FROM (NOW() - c.date_debut::TIMESTAMP)) / (30.44 * 86400)
      ELSE
        EXTRACT(EPOCH FROM (c.date_fin::TIMESTAMP - c.date_debut::TIMESTAMP)) / (30.44 * 86400)
    END
  ), 0)::NUMERIC
  FROM contracts c
  WHERE c.employee_id = p_employee_id
    AND c.type_contrat = 'CDD';
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION public.get_cdd_cumul_months IS 'Cumul mensuel des CDD pour un employé — Art. 14 CT-CI plafond 24 mois';
