-- Table de configuration des workflows
CREATE TABLE IF NOT EXISTS approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  module TEXT NOT NULL, -- 'conges', 'documents', 'recrutement'
  niveaux JSONB NOT NULL DEFAULT '[]',
  -- niveaux = [{"ordre": 1, "role": "manager", "delai_heures": 48}, {"ordre": 2, "role": "responsable_rh", "delai_heures": 24}]
  escalade_auto BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des approbations en cours
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  module TEXT NOT NULL,
  reference_id UUID NOT NULL, -- ID de l'objet (conge, document, etc.)
  statut TEXT DEFAULT 'en_attente', -- en_attente, approuve, refuse, escalade
  niveau_actuel INT DEFAULT 1,
  historique JSONB DEFAULT '[]',
  -- historique = [{"niveau": 1, "approuveur_id": "...", "action": "approuve", "at": "..."}]
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company access" ON approval_workflows
  FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Company access" ON approval_requests
  FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
