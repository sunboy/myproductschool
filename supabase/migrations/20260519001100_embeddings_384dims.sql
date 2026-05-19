-- Migration 012: Switch embedding dimensions from 512 (Voyage) to 384 (Supabase gte-small)
-- Must drop indexes before altering column types, then recreate them.

-- ── Drop existing vector indexes ────────────────────────────────
DROP INDEX IF EXISTS idx_challenge_prompts_scenario_embedding;
DROP INDEX IF EXISTS idx_challenge_steps_recommended_embedding;
DROP INDEX IF EXISTS idx_challenge_steps_pattern_embedding;
DROP INDEX IF EXISTS idx_thinking_traps_exemplar_embedding;

-- ── Alter columns from vector(512) to vector(384) ───────────────
ALTER TABLE challenge_prompts
  ALTER COLUMN scenario_embedding TYPE extensions.vector(384)
  USING scenario_embedding::text::extensions.vector(384);

ALTER TABLE challenge_steps
  ALTER COLUMN recommended_embedding TYPE extensions.vector(384)
  USING recommended_embedding::text::extensions.vector(384),
  ALTER COLUMN pattern_embedding TYPE extensions.vector(384)
  USING pattern_embedding::text::extensions.vector(384);

ALTER TABLE thinking_traps
  ALTER COLUMN exemplar_embedding TYPE extensions.vector(384)
  USING exemplar_embedding::text::extensions.vector(384);

-- ── Recreate IVFFLAT indexes with correct ops ───────────────────
CREATE INDEX IF NOT EXISTS idx_challenge_prompts_scenario_embedding
  ON challenge_prompts USING ivfflat (scenario_embedding extensions.vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_challenge_steps_recommended_embedding
  ON challenge_steps USING ivfflat (recommended_embedding extensions.vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_challenge_steps_pattern_embedding
  ON challenge_steps USING ivfflat (pattern_embedding extensions.vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_thinking_traps_exemplar_embedding
  ON thinking_traps USING ivfflat (exemplar_embedding extensions.vector_cosine_ops)
  WITH (lists = 100);
