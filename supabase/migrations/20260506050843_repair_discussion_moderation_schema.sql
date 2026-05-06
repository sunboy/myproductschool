ALTER TABLE public.challenge_discussions
  ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hidden_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hidden_reason TEXT;

CREATE INDEX IF NOT EXISTS challenge_discussions_visible_idx
  ON public.challenge_discussions(challenge_id, created_at DESC)
  WHERE hidden_at IS NULL;

DROP POLICY IF EXISTS "Users read all discussions" ON public.challenge_discussions;
DROP POLICY IF EXISTS "Users read visible discussions" ON public.challenge_discussions;
CREATE POLICY "Users read visible discussions"
  ON public.challenge_discussions FOR SELECT
  USING (hidden_at IS NULL);

DROP POLICY IF EXISTS "Users insert own" ON public.challenge_discussions;
CREATE POLICY "Users insert own"
  ON public.challenge_discussions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read all replies" ON public.discussion_replies;
DROP POLICY IF EXISTS "Users read replies on visible discussions" ON public.discussion_replies;
CREATE POLICY "Users read replies on visible discussions"
  ON public.discussion_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.challenge_discussions cd
      WHERE cd.id = discussion_id
        AND cd.hidden_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users insert own replies" ON public.discussion_replies;
CREATE POLICY "Users insert own replies"
  ON public.discussion_replies FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.challenge_discussions cd
      WHERE cd.id = discussion_id
        AND cd.hidden_at IS NULL
    )
  );

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
    AND cd.hidden_at IS NULL
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

CREATE TABLE IF NOT EXISTS public.discussion_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES public.challenge_discussions(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'hidden', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS discussion_reports_discussion_idx
  ON public.discussion_reports(discussion_id);

CREATE INDEX IF NOT EXISTS discussion_reports_status_created_idx
  ON public.discussion_reports(status, created_at DESC);

ALTER TABLE public.discussion_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own discussion reports" ON public.discussion_reports;
CREATE POLICY "Users insert own discussion reports"
  ON public.discussion_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users read own discussion reports" ON public.discussion_reports;
CREATE POLICY "Users read own discussion reports"
  ON public.discussion_reports FOR SELECT
  USING (auth.uid() = reporter_id);
