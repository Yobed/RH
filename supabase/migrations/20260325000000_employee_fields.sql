-- Migration versionnée depuis scripts/add_employee_fields.sql
-- Appliquée manuellement en production (date approximative : 20260325000000)
-- NE PAS réexécuter si les colonnes/tables existent déjà (scripts avec IF NOT EXISTS)

-- ================================================================
-- Migration : Nouveaux champs employé
-- Date : 2026-03-25
-- ================================================================

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS civilite       VARCHAR(10),    -- M. / Mme / Mlle
  ADD COLUMN IF NOT EXISTS nationalite    VARCHAR(100),   -- Ivoirien(ne), etc.
  ADD COLUMN IF NOT EXISTS etat_civil     VARCHAR(30),    -- Célibataire / Marié(e) / etc.
  ADD COLUMN IF NOT EXISTS nb_enfants     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS niveau_etude   VARCHAR(50),    -- BAC, BTS, Licence, Master...
  ADD COLUMN IF NOT EXISTS categorie      VARCHAR(60);    -- Ouvrier, Agent de maîtrise, Cadre...

COMMENT ON COLUMN employees.civilite     IS 'Civilité : M. / Mme / Mlle';
COMMENT ON COLUMN employees.nationalite  IS 'Nationalité du salarié';
COMMENT ON COLUMN employees.etat_civil   IS 'État civil : Célibataire / Marié(e) / Divorcé(e) / Veuf(ve)';
COMMENT ON COLUMN employees.nb_enfants   IS 'Nombre d''enfants à charge';
COMMENT ON COLUMN employees.niveau_etude IS 'Niveau d''études : Primaire / Secondaire / BAC / BTS / Licence / Master / Doctorat';
COMMENT ON COLUMN employees.categorie    IS 'Catégorie professionnelle selon CCI AICI-UGTCI';
