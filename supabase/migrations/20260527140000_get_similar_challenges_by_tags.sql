-- get_similar_challenges_by_tags
--
-- Returns published challenges that share topic_tags / technique_tags / move_tags
-- with a source challenge, ranked by tag-overlap count. Used by Hatch to surface
-- "similar challenges" links in chat. The URL is NOT computed here — the caller
-- builds it via src/lib/hatch/urls.ts (urlForChallenge), which knows the
-- quick_take routing exception. We return slug + challenge_type so the helper
-- can route correctly.
--
-- NOTE: written but reviewed before apply. Apply via the standard migration path.

CREATE OR REPLACE FUNCTION get_similar_challenges_by_tags(
  p_challenge_id UUID,
  p_max INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  difficulty TEXT,
  challenge_type TEXT,
  overlap_count INT
)
LANGUAGE sql
STABLE
AS $$
  WITH source AS (
    SELECT
      COALESCE(topic_tags, '{}')     AS topic_tags,
      COALESCE(technique_tags, '{}') AS technique_tags,
      COALESCE(move_tags, '{}')      AS move_tags
    FROM challenges
    WHERE id = p_challenge_id
  )
  SELECT
    c.id,
    c.slug,
    c.title,
    c.difficulty,
    c.challenge_type,
    (
      -- text[] has no intersection operator; count shared elements via unnest.
      (SELECT COUNT(*) FROM unnest(c.topic_tags)     t WHERE t = ANY(s.topic_tags))     +
      (SELECT COUNT(*) FROM unnest(c.technique_tags) t WHERE t = ANY(s.technique_tags)) +
      (SELECT COUNT(*) FROM unnest(c.move_tags)      t WHERE t = ANY(s.move_tags))
    )::INT AS overlap_count
  FROM challenges c
  CROSS JOIN source s
  WHERE c.id <> p_challenge_id
    AND c.is_published = true
    AND (
      c.topic_tags     && s.topic_tags     OR
      c.technique_tags && s.technique_tags OR
      c.move_tags      && s.move_tags
    )
  ORDER BY overlap_count DESC, c.created_at DESC
  LIMIT GREATEST(p_max, 1);
$$;

GRANT EXECUTE ON FUNCTION get_similar_challenges_by_tags(UUID, INT) TO authenticated, service_role;
