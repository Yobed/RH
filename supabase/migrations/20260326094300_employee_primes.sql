-- Migration versionnée depuis scripts/add_employee_primes.sql
-- Appliquée manuellement en production (date approximative : 2026-03-26)
-- NE PAS réexécuter si les colonnes/tables existent déjà (scripts avec IF NOT EXISTS)

-- Migration : éléments de salaire rattachés au profil de l'employé
-- Ces valeurs servent de base par défaut lors de la création d'un bulletin
-- À exécuter dans le SQL Editor Supabase

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS sursalaire          NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prime_exceptionnelle NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prime_salissure     NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prime_depassement   NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prime_fonction      NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prime_transport     NUMERIC(12,2) DEFAULT 0;

COMMENT ON COLUMN employees.sursalaire           IS 'Ligne 02 — Complément au salaire catégoriel minimum';
COMMENT ON COLUMN employees.prime_exceptionnelle IS 'Ligne 04 — Prime exceptionnelle / 13e mois (valeur mensuelle habituelle)';
COMMENT ON COLUMN employees.prime_salissure      IS 'Ligne 05 — Prime de salissure';
COMMENT ON COLUMN employees.prime_depassement    IS 'Ligne 06 — Prime de dépassement';
COMMENT ON COLUMN employees.prime_fonction       IS 'Ligne 07 — Prime liée à la fonction';
COMMENT ON COLUMN employees.prime_transport      IS 'Ligne 08 — Indemnité de transport (non imposable)';
-- NB: prime_anciennete (ligne 03) est auto-calculée depuis date_embauche, non stockée ici
