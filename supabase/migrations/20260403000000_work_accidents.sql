-- Phase 6: QHSE — accidents du travail et visites médicales

-- Enum gravité accident
CREATE TYPE gravite_accident AS ENUM ('bénin', 'grave', 'mortel');

-- Table accidents du travail
CREATE TABLE IF NOT EXISTS work_accidents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date_accident DATE NOT NULL,
  heure_accident TIME,
  lieu          TEXT,
  description   TEXT NOT NULL,
  gravite       gravite_accident NOT NULL DEFAULT 'bénin',
  jours_arret   INTEGER DEFAULT 0,
  statut_cnps   TEXT NOT NULL DEFAULT 'non_declare' CHECK (statut_cnps IN ('non_declare', 'declare', 'indemnise', 'clos')),
  numero_cnps   TEXT,
  pieces_jointes JSONB DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE work_accidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_work_accidents" ON work_accidents
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX idx_work_accidents_company ON work_accidents(company_id);
CREATE INDEX idx_work_accidents_employee ON work_accidents(employee_id);
CREATE INDEX idx_work_accidents_date ON work_accidents(date_accident DESC);

-- Table visites médicales
CREATE TABLE IF NOT EXISTS medical_visits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type_visite   TEXT NOT NULL DEFAULT 'periodique' CHECK (type_visite IN ('embauche', 'periodique', 'reprise', 'spontanee')),
  date_visite   DATE NOT NULL,
  date_prochaine DATE,
  resultat      TEXT DEFAULT 'apte' CHECK (resultat IN ('apte', 'apte_amenagement', 'inapte')),
  medecin       TEXT,
  observations  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE medical_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_medical_visits" ON medical_visits
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX idx_medical_visits_company ON medical_visits(company_id);
CREATE INDEX idx_medical_visits_employee ON medical_visits(employee_id);
CREATE INDEX idx_medical_visits_prochaine ON medical_visits(date_prochaine);
