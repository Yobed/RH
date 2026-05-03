-- Migration : overtime_import_logs
-- Phase 02-07 — Import Excel Heures Supplémentaires
-- Traçabilité des imports en masse avec atomicité (import_batch_id)
-- Compatible avec overtime_records (category / hours_count) existant

CREATE TABLE IF NOT EXISTS overtime_import_logs (
  -- Clé primaire et isolation multi-tenant
  id               UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id       UUID          NOT NULL REFERENCES companies(id),

  -- Lot d'import (un UUID par fichier importé — atomicité)
  import_batch_id  UUID          NOT NULL,

  -- Identité employé
  employee_id      UUID          NOT NULL REFERENCES employees(id),
  matricule        TEXT          NOT NULL,  -- valeur brute du fichier (traçabilité)

  -- Période concernée (format YYYY-MM)
  periode          TEXT          NOT NULL
                   CHECK (periode ~ '^\d{4}-(0[1-9]|1[0-2])$'),

  -- Ventilation des heures par palier (Décret n°96-203 + accord entreprise)
  h15              NUMERIC(5,2)  NOT NULL DEFAULT 0,  -- +15% semaine h41–h48
  h50              NUMERIC(5,2)  NOT NULL DEFAULT 0,  -- +50% au-delà h48 / nuit
  h75              NUMERIC(5,2)  NOT NULL DEFAULT 0,  -- +75% dimanche / férié
  h100             NUMERIC(5,2)  NOT NULL DEFAULT 0,  -- +100% cas exceptionnel

  -- Montant pré-calculé (FCFA) au moment de l'import
  montant_calcule  NUMERIC(12,2),

  -- Commentaire libre de la ligne Excel
  commentaire      TEXT,

  -- Statut de traitement
  statut           TEXT          NOT NULL DEFAULT 'importé'
                   CHECK (statut IN ('importé','appliqué','annulé','erreur')),

  -- Métadonnées d'import
  imported_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  imported_by      UUID          REFERENCES auth.users(id)
);

-- RLS — isolation stricte par entreprise
ALTER TABLE overtime_import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_isolation" ON overtime_import_logs
  FOR ALL USING (company_id = get_user_company_id());

-- Index performances
CREATE INDEX IF NOT EXISTS idx_oil_company_periode
  ON overtime_import_logs(company_id, periode);

CREATE INDEX IF NOT EXISTS idx_oil_batch
  ON overtime_import_logs(import_batch_id);
