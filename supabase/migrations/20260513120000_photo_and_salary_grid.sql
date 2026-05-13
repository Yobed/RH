-- ================================================================
-- Migration : Photo employé + Grille salariale catégorielle partagée
-- Date : 2026-05-13
-- ================================================================

-- 1) Photo employé
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

COMMENT ON COLUMN employees.photo_url IS 'URL publique de la photo de l''employé (bucket rh-documents/photos/{companyId}/{employeeId}/)';

-- 2) Grille salariale catégorielle — référentiel partagé (multi-tenant lecture)
CREATE TABLE IF NOT EXISTS salary_grid (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle     TEXT NOT NULL UNIQUE,           -- AGENT/TEC-M1, OUVRIERS-1A...
  code        TEXT NOT NULL,                  -- M1, A, C1, 1A, ST...
  famille     TEXT NOT NULL,                  -- TEC, CHA, EMP, CAD, OUV
  type_remu   TEXT NOT NULL DEFAULT 'Fixe',
  salaire_base NUMERIC(12,2) NOT NULL,
  actif       BOOLEAN NOT NULL DEFAULT TRUE,
  ordre       INTEGER NOT NULL DEFAULT 0,     -- ordre d'affichage
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salary_grid_famille ON salary_grid(famille);
CREATE INDEX IF NOT EXISTS idx_salary_grid_actif ON salary_grid(actif);

COMMENT ON TABLE salary_grid IS 'Grille salariale catégorielle Côte d''Ivoire — référentiel partagé (lecture pour tous, écriture super-admin uniquement)';
COMMENT ON COLUMN salary_grid.famille IS 'TEC=Agent technique / CHA=Chauffeurs / EMP=Employés / CAD=Cadres-Ingénieurs / OUV=Ouvriers';

-- 3) RLS : lecture pour tout utilisateur authentifié, écriture réservée
ALTER TABLE salary_grid ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS salary_grid_select_all ON salary_grid;
CREATE POLICY salary_grid_select_all ON salary_grid
  FOR SELECT TO authenticated
  USING (true);

-- Écriture/modification bloquée par défaut (service_role uniquement via API server-side)
DROP POLICY IF EXISTS salary_grid_no_write ON salary_grid;
CREATE POLICY salary_grid_no_write ON salary_grid
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

-- 4) Seed des 36 lignes de la grille (idempotent via ON CONFLICT)
INSERT INTO salary_grid (libelle, code, famille, type_remu, salaire_base, ordre) VALUES
  ('AGENT/TEC-M1',          'M1',     'TEC', 'Fixe', 138822.00,  10),
  ('AGENT/TEC-M2',          'M2',     'TEC', 'Fixe', 148876.00,  11),
  ('AGENT/TEC-M3',          'M3',     'TEC', 'Fixe', 174485.00,  12),
  ('AGENT/TEC-M4',          'M4',     'TEC', 'Fixe', 191000.00,  13),
  ('AGENT/TEC-M5',          'M5',     'TEC', 'Fixe', 203206.00,  14),
  ('CHAUFFEURS-A',          'A',      'CHA', 'Fixe',  83705.00,  20),
  ('CHAUFFEURS-B',          'B',      'CHA', 'Fixe',  87610.00,  21),
  ('CHAUFFEURS-C',          'C',      'CHA', 'Fixe',  89319.00,  22),
  ('CHAUFFEURS-D',          'D',      'CHA', 'Fixe',  90295.70,  23),
  ('EMPLOYES-1ère Catégo',  'C1',     'EMP', 'Fixe',  75210.00,  30),
  ('EMPLOYES-2ème Catégo',  'C2',     'EMP', 'Fixe',  83461.00,  31),
  ('EMPLOYES-3ème Catégo',  'C3',     'EMP', 'Fixe',  87855.00,  32),
  ('EMPLOYES-4ème Catégo',  'C4',     'EMP', 'Fixe',  95420.00,  33),
  ('EMPLOYES-5ème Catégo',  'C5',     'EMP', 'Fixe', 112260.00,  34),
  ('EMPLOYES-6ème Catégo',  'C6',     'EMP', 'Fixe', 129587.00,  35),
  ('EMPLOYES-7ème Caté-A',  'C7A',    'EMP', 'Fixe', 131049.00,  36),
  ('EMPLOYES-7ème Caté-B',  'C7B',    'EMP', 'Fixe', 144472.00,  37),
  ('ING/CAD-1A',            '1A',     'CAD', 'Fixe', 178796.00,  40),
  ('ING/CAD-1B',            '1B',     'CAD', 'Fixe', 201979.00,  41),
  ('ING/CAD-2A',            '2A',     'CAD', 'Fixe', 219709.00,  42),
  ('ING/CAD-2B',            '2B',     'CAD', 'Fixe', 244625.70,  43),
  ('ING/CAD-3A',            '3A',     'CAD', 'Fixe', 263886.00,  44),
  ('ING/CAD-3B',            '3B',     'CAD', 'Fixe',  82973.65,  45),
  ('OUVRIERS-1A',           '1A',     'OUV', 'Fixe',  76029.00,  50),
  ('OUVRIERS-1B',           '1B',     'OUV', 'Fixe',  77363.00,  51),
  ('OUVRIERS-2',            '2',      'OUV', 'Fixe',  77848.00,  52),
  ('OUVRIERS-3A',           '3A',     'OUV', 'Fixe',  79314.00,  53),
  ('OUVRIERS-3B',           '3B',     'OUV', 'Fixe',  82974.00,  54),
  ('OUVRIERS-4B',           '4B',     'OUV', 'Fixe',  88344.00,  55),
  ('OUVRIERS-5A',           '5A',     'OUV', 'Fixe',  89564.00,  56),
  ('OUVRIERS-5B',           '5B',     'OUV', 'Fixe',  94201.00,  57),
  ('OUVRIERS-6A',           '6A',     'OUV', 'Fixe',  96395.00,  58),
  ('OUVRIERS-6B',           '6B',     'OUV', 'Fixe', 106646.00,  59),
  ('OUVRIERS-A4',           'A4',     'OUV', 'Fixe',  83703.90,  60),
  ('OUVRIERS-HC',           'HC',     'OUV', 'Fixe', 143130.00,  61),
  ('Stage',                 'ST',     'TEC', 'Fixe', 150000.00,  90)
ON CONFLICT (libelle) DO UPDATE SET
  code         = EXCLUDED.code,
  famille      = EXCLUDED.famille,
  type_remu    = EXCLUDED.type_remu,
  salaire_base = EXCLUDED.salaire_base,
  ordre        = EXCLUDED.ordre,
  updated_at   = NOW();
