-- Phase 7: Messagerie interne RH ↔ Employé + notifications

CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sujet       TEXT,
  corps       TEXT NOT NULL,
  lu          BOOLEAN NOT NULL DEFAULT false,
  type        TEXT NOT NULL DEFAULT 'message' CHECK (type IN ('message', 'notification')),
  meta        JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Visible si sender ou recipient
CREATE POLICY "messages_sender_or_recipient" ON messages
  USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );

CREATE INDEX idx_messages_company ON messages(company_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id, lu, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at DESC);
