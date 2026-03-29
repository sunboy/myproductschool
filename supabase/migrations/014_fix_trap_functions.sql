-- Migration 014: Fix match_thinking_traps function (fix_suggestion column, not fix_hint)
-- Also creates match_novel_challenges which was in 013 but may not have run.
-- Note: pgvector operators (<=> cosine distance) work without schema prefix in SQL functions.

SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION match_thinking_traps(
  query_embedding  extensions.vector(384),
  match_threshold  float DEFAULT 0.75,
  match_count      int   DEFAULT 3
)
RETURNS TABLE (
  id             text,
  name           text,
  description    text,
  fix_suggestion text,
  similarity     float
)
LANGUAGE sql STABLE
SET search_path = public, extensions
AS $$
  SELECT
    t.id,
    t.name,
    t.description,
    t.fix_suggestion,
    1 - (t.exemplar_embedding <=> query_embedding) AS similarity
  FROM thinking_traps t
  WHERE t.exemplar_embedding IS NOT NULL
    AND 1 - (t.exemplar_embedding <=> query_embedding) >= match_threshold
  ORDER BY t.exemplar_embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION match_novel_challenges(
  user_centroid  extensions.vector(384),
  exclude_ids    uuid[]  DEFAULT '{}',
  match_count    int     DEFAULT 5
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
SET search_path = public, extensions
AS $$
  SELECT
    c.id,
    c.title,
    c.prompt_text,
    c.difficulty,
    c.paradigm,
    c.move_tags,
    (c.scenario_embedding <=> user_centroid) AS novelty
  FROM challenge_prompts c
  WHERE c.scenario_embedding IS NOT NULL
    AND c.is_published = true
    AND NOT (c.id = ANY(exclude_ids))
  ORDER BY c.scenario_embedding <=> user_centroid DESC
  LIMIT match_count;
$$;
