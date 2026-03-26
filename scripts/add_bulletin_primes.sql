-- Migration : lignes de salaire 02-08 sur le bulletin de paie
-- + numéro CNPS employé
-- À exécuter dans le SQL Editor Supabase

-- Primes sur le bulletin de paie
ALTER TABLE bulletins_paie
  ADD COLUMN IF NOT EXISTS sursalaire          NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prime_anciennete    NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prime_exceptionnelle NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prime_salissure     NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prime_depassement   NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prime_fonction      NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prime_transport     NUMERIC(12,2) DEFAULT 0;

-- N° CNPS propre à l'employé (distinct du matricule CNPS entreprise)
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS num_cnps VARCHAR(30);

-- Commentaires métier
COMMENT ON COLUMN bulletins_paie.sursalaire           IS 'Ligne 02 — Complément salarial au-delà du minimum catégoriel';
COMMENT ON COLUMN bulletins_paie.prime_anciennete     IS 'Ligne 03 — Auto : 1% × années de service × salaire catégoriel (CCI CI Art.17)';
COMMENT ON COLUMN bulletins_paie.prime_exceptionnelle IS 'Ligne 04 — Prime exceptionnelle / 13e mois / bonus';
COMMENT ON COLUMN bulletins_paie.prime_salissure      IS 'Ligne 05 — Prime de salissure (travaux salissants)';
COMMENT ON COLUMN bulletins_paie.prime_depassement    IS 'Ligne 06 — Prime de dépassement / heures supplémentaires';
COMMENT ON COLUMN bulletins_paie.prime_fonction       IS 'Ligne 07 — Prime liée à la fonction / responsabilité';
COMMENT ON COLUMN bulletins_paie.prime_transport      IS 'Ligne 08 — Indemnité de transport (non imposable — exonérée ITS/CNPS)';
COMMENT ON COLUMN employees.num_cnps                  IS 'Numéro d''immatriculation CNPS personnel de l''employé';
