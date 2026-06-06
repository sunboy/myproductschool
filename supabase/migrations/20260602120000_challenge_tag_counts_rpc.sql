-- challenge_tag_counts
--
-- Returns per-tag challenge counts for the Practice topic/technique chip cloud
-- and grouped-section headers, as a real GROUP BY aggregate. Replaces the prior
-- approach (fetch every row's tag arrays into Node and tally), which transferred
-- a few hundred rows of array data per request and tallied in JS.
--
-- The caller (src/lib/data/challenges.ts getChallengeTagCounts and the
-- /api/challenges/count groupBy path) does all label->DB normalization in TS and
-- passes already-normalized arrays here, so this function only does membership
-- checks. Empty/NULL array params mean "no constraint on that dimension".
--
-- p_group_col: 'topic' counts topic_tags, anything else counts technique_tags.
-- Disciplines map 1:1 to challenge_type except product_sense (a set), so the
-- caller passes the expanded challenge_type list in p_types ('{}' = all types).
--
-- NOTE: written but reviewed before apply. Apply via the standard migration path.

CREATE OR REPLACE FUNCTION challenge_tag_counts(
  p_group_col       TEXT,
  p_types           TEXT[]  DEFAULT '{}',
  p_difficulties    TEXT[]  DEFAULT '{}',
  p_paradigms       TEXT[]  DEFAULT '{}',
  p_roles           TEXT[]  DEFAULT '{}',
  p_companies       TEXT[]  DEFAULT '{}',
  p_topics          TEXT[]  DEFAULT '{}',
  p_techniques      TEXT[]  DEFAULT '{}',
  p_real_interview  BOOLEAN DEFAULT false,
  p_q               TEXT    DEFAULT NULL
)
RETURNS TABLE (
  tag   TEXT,
  count BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT t.tag, COUNT(*)::BIGINT AS count
  FROM challenges c
  CROSS JOIN LATERAL unnest(
    CASE WHEN p_group_col = 'topic'
         THEN COALESCE(c.topic_tags, '{}')
         ELSE COALESCE(c.technique_tags, '{}')
    END
  ) AS t(tag)
  WHERE c.is_published = true
    AND c.challenge_type <> 'quick_take'
    AND (cardinality(p_types)        = 0 OR c.challenge_type = ANY(p_types))
    AND (cardinality(p_difficulties) = 0 OR c.difficulty     = ANY(p_difficulties))
    AND (cardinality(p_paradigms)    = 0 OR c.paradigm       = ANY(p_paradigms))
    AND (cardinality(p_roles)        = 0 OR c.relevant_roles && p_roles)
    AND (cardinality(p_companies)    = 0 OR c.company_tags   && p_companies)
    AND (cardinality(p_topics)       = 0 OR c.topic_tags     && p_topics)
    AND (cardinality(p_techniques)   = 0 OR c.technique_tags && p_techniques)
    AND (p_real_interview = false OR c.is_real_interview = true)
    AND (p_q IS NULL OR c.title ILIKE '%' || p_q || '%')
  GROUP BY t.tag
$$;

GRANT EXECUTE ON FUNCTION challenge_tag_counts(
  TEXT, TEXT[], TEXT[], TEXT[], TEXT[], TEXT[], TEXT[], TEXT[], BOOLEAN, TEXT
) TO authenticated, service_role, anon;
