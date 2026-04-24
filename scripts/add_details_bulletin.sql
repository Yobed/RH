ALTER TABLE bulletins_paie ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;
