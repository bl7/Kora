BEGIN;

-- Add email verification flag to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Generic token table for email verification & password resets
CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email_verify', 'password_reset')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tokens_user_type
  ON tokens (user_id, type)
  WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tokens_expires
  ON tokens (expires_at)
  WHERE used_at IS NULL;

COMMIT;

