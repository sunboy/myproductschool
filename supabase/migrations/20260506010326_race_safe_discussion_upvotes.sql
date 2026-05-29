CREATE OR REPLACE FUNCTION public.toggle_discussion_upvote(
  p_discussion_id uuid,
  p_challenge_id text,
  p_user_id uuid
)
RETURNS TABLE (
  upvote_count integer,
  upvoted boolean
)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_upvoted_by uuid[];
  next_count integer;
  next_upvoted boolean;
BEGIN
  SELECT COALESCE(cd.upvoted_by, '{}'::uuid[])
  INTO next_upvoted_by
  FROM public.challenge_discussions cd
  WHERE cd.id = p_discussion_id
    AND cd.challenge_id = p_challenge_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF p_user_id = ANY(next_upvoted_by) THEN
    next_upvoted_by := array_remove(next_upvoted_by, p_user_id);
    next_upvoted := false;
  ELSE
    next_upvoted_by := array_append(next_upvoted_by, p_user_id);
    next_upvoted := true;
  END IF;

  next_count := COALESCE(array_length(next_upvoted_by, 1), 0);

  UPDATE public.challenge_discussions cd
  SET
    upvoted_by = next_upvoted_by,
    upvote_count = next_count,
    updated_at = now()
  WHERE cd.id = p_discussion_id
    AND cd.challenge_id = p_challenge_id;

  upvote_count := next_count;
  upvoted := next_upvoted;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_discussion_upvote(uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_discussion_upvote(uuid, text, uuid) TO service_role;
