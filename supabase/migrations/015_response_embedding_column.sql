-- Migration 015: Add response_embedding column to challenge_attempts
-- (Was in 013 but didn't apply due to mid-migration failure + manual repair)

ALTER TABLE challenge_attempts
  ADD COLUMN IF NOT EXISTS response_embedding extensions.vector(384);

CREATE INDEX IF NOT EXISTS idx_challenge_attempts_response_embedding
  ON challenge_attempts USING ivfflat (response_embedding extensions.vector_cosine_ops)
  WITH (lists = 100);
