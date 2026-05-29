DROP POLICY IF EXISTS "Users can upvote discussions" ON public.challenge_discussions;

CREATE INDEX IF NOT EXISTS challenge_discussions_hidden_by_idx
  ON public.challenge_discussions(hidden_by)
  WHERE hidden_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS discussion_reports_reporter_idx
  ON public.discussion_reports(reporter_id)
  WHERE reporter_id IS NOT NULL;
