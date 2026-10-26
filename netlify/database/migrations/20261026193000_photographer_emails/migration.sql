CREATE TABLE photographer_emails (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  photographer_id bigint NOT NULL REFERENCES photographer_leads (id) ON DELETE CASCADE,
  kind text NOT NULL,
  recipient text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  idempotency_key text,
  provider_id text,
  last_error text,
  claimed_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT photographer_emails_kind_check CHECK (
    kind IN ('confirmation', 'admin_notice', 'approved', 'rejected')
  ),
  CONSTRAINT photographer_emails_status_check CHECK (
    status IN ('pending', 'sending', 'sent', 'failed')
  ),
  CONSTRAINT photographer_emails_recipient_len CHECK (char_length(recipient) BETWEEN 3 AND 200),
  CONSTRAINT photographer_emails_attempts_check CHECK (attempts >= 0 AND attempts <= 8),
  CONSTRAINT photographer_emails_once UNIQUE (photographer_id, kind)
);

CREATE INDEX photographer_emails_status_idx ON photographer_emails (status, updated_at DESC);
