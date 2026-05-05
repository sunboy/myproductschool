CREATE OR REPLACE FUNCTION public.next_user_challenge(
  p_user_id UUID,
  p_competency TEXT DEFAULT NULL
)
RETURNS TABLE (
  id TEXT,
  slug TEXT,
  title TEXT,
  difficulty TEXT,
  challenge_type TEXT,
  primary_competencies TEXT[],
  secondary_competencies TEXT[]
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    c.id,
    c.slug,
    c.title,
    c.difficulty,
    c.challenge_type,
    c.primary_competencies,
    c.secondary_competencies
  FROM public.challenges c
  WHERE c.is_published = TRUE
    AND c.challenge_type <> 'quick_take'
    AND NOT EXISTS (
      SELECT 1
      FROM public.challenge_attempts ca
      WHERE ca.user_id = p_user_id
        AND ca.challenge_id = c.id
        AND ca.status = 'completed'
    )
    AND (
      p_competency IS NULL
      OR p_competency = ''
      OR p_competency = ANY(COALESCE(c.primary_competencies, ARRAY[]::TEXT[]))
      OR p_competency = ANY(COALESCE(c.secondary_competencies, ARRAY[]::TEXT[]))
    )
  ORDER BY
    CASE
      WHEN p_competency = ANY(COALESCE(c.primary_competencies, ARRAY[]::TEXT[])) THEN 0
      WHEN p_competency = ANY(COALESCE(c.secondary_competencies, ARRAY[]::TEXT[])) THEN 1
      ELSE 2
    END,
    c.is_featured DESC,
    c.created_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.next_user_challenge(UUID, TEXT) TO authenticated, service_role;
