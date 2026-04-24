-- Migration: Arrêts maladie — ajout colonnes justificatif + AT sur table conges
-- Phase 03-05 | CON-05, CON-06

ALTER TABLE conges
  ADD COLUMN IF NOT EXISTS justificatif_url TEXT,
  ADD COLUMN IF NOT EXISTS est_justifie BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS est_at BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN conges.est_at IS 'Accident de travail reconnu CNPS — pas de retenue salariale';
COMMENT ON COLUMN conges.est_justifie IS 'Justificatif médical validé — pas de retenue salariale';
COMMENT ON COLUMN conges.justificatif_url IS 'URL Supabase Storage du certificat médical';
