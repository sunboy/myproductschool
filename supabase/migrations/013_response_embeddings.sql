-- Migration 013: Add response embeddings to challenge_attempts
-- Enables semantic memory of how users think for personalized recommendations + trap detection.

-- ── Add response_embedding column ───────────────────────────────
ALTER TABLE challenge_attempts
  ADD COLUMN IF NOT EXISTS response_embedding extensions.vector(384);

-- ── IVFFLAT index for fast cosine similarity queries ────────────
CREATE INDEX IF NOT EXISTS idx_challenge_attempts_response_embedding
  ON challenge_attempts USING ivfflat (response_embedding extensions.vector_cosine_ops)
  WITH (lists = 100);

-- ── Helper function: find thinking traps similar to a response ──
-- Returns top N traps by cosine similarity to the given embedding.
CREATE OR REPLACE FUNCTION match_thinking_traps(
  query_embedding extensions.vector(384),
  match_threshold  float DEFAULT 0.75,
  match_count      int   DEFAULT 3
)
RETURNS TABLE (
  id          uuid,
  name        text,
  description text,
  fix_hint    text,
  similarity  float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    t.id,
    t.name,
    t.description,
    t.fix_hint,
    1 - (t.exemplar_embedding <=> query_embedding) AS similarity
  FROM thinking_traps t
  WHERE t.exemplar_embedding IS NOT NULL
    AND 1 - (t.exemplar_embedding <=> query_embedding) >= match_threshold
  ORDER BY t.exemplar_embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ── Helper function: find semantically novel challenges ──────────
-- Given a user's recent response embeddings (centroid), find challenges
-- whose scenario is DISSIMILAR (semantic gap) — pushes users outside comfort zone.
CREATE OR REPLACE FUNCTION match_novel_challenges(
  user_centroid    extensions.vector(384),
  exclude_ids      uuid[]            DEFAULT '{}',
  match_count      int               DEFAULT 5
)
RETURNS TABLE (
  id          uuid,
  title       text,
  prompt_text text,
  difficulty  text,
  paradigm    text,
  move_tags   text[],
  novelty     float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id,
    c.title,
    c.prompt_text,
    c.difficulty,
    c.paradigm,
    c.move_tags,
    -- novelty = distance from user's centroid (higher = more novel/outside comfort zone)
    (c.scenario_embedding <=> user_centroid) AS novelty
  FROM challenge_prompts c
  WHERE c.scenario_embedding IS NOT NULL
    AND c.is_published = true
    AND NOT (c.id = ANY(exclude_ids))
  ORDER BY c.scenario_embedding <=> user_centroid DESC
  LIMIT match_count;
$$;
