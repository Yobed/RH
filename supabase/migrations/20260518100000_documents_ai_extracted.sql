-- ── Métadonnées extraites par l'IA sur les documents GED ──────────────────
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS ai_extracted_data JSONB,
  ADD COLUMN IF NOT EXISTS ai_analyzed_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_summary        TEXT;

CREATE INDEX IF NOT EXISTS idx_documents_ai_analyzed_at
  ON documents(ai_analyzed_at)
  WHERE ai_analyzed_at IS NOT NULL;

COMMENT ON COLUMN documents.ai_extracted_data IS
  'Champs structurés extraits par Claude (nom, dates, numéros, montants, etc.) selon la famille documentaire.';
COMMENT ON COLUMN documents.ai_summary IS
  'Synthèse courte du document générée par l''IA.';
