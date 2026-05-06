CREATE TABLE IF NOT EXISTS public.feedback_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'feedback',
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  message TEXT CHECK (message IS NULL OR char_length(message) <= 2000),
  path TEXT CHECK (path IS NULL OR char_length(path) <= 2048),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT feedback_submissions_kind_check
    CHECK (kind IN ('feedback', 'nps')),
  CONSTRAINT feedback_submissions_status_check
    CHECK (status IN ('new', 'reviewed', 'archived'))
);

CREATE TABLE IF NOT EXISTS public.feedback_prompt_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_type TEXT NOT NULL,
  event TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT feedback_prompt_events_prompt_type_check
    CHECK (prompt_type IN ('nps')),
  CONSTRAINT feedback_prompt_events_event_check
    CHECK (event IN ('shown', 'dismissed', 'submitted'))
);

CREATE INDEX IF NOT EXISTS idx_feedback_submissions_user_created_at
  ON public.feedback_submissions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_submissions_status_created_at
  ON public.feedback_submissions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_prompt_events_user_prompt_created_at
  ON public.feedback_prompt_events(user_id, prompt_type, created_at DESC);

DROP TRIGGER IF EXISTS feedback_submissions_updated_at ON public.feedback_submissions;
CREATE TRIGGER feedback_submissions_updated_at
  BEFORE UPDATE ON public.feedback_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_prompt_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own feedback submissions" ON public.feedback_submissions;
CREATE POLICY "Users can insert own feedback submissions"
  ON public.feedback_submissions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own feedback submissions" ON public.feedback_submissions;
CREATE POLICY "Users can view own feedback submissions"
  ON public.feedback_submissions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can manage feedback submissions" ON public.feedback_submissions;
CREATE POLICY "Admins can manage feedback submissions"
  ON public.feedback_submissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can insert own feedback prompt events" ON public.feedback_prompt_events;
CREATE POLICY "Users can insert own feedback prompt events"
  ON public.feedback_prompt_events FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own feedback prompt events" ON public.feedback_prompt_events;
CREATE POLICY "Users can view own feedback prompt events"
  ON public.feedback_prompt_events FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can manage feedback prompt events" ON public.feedback_prompt_events;
CREATE POLICY "Admins can manage feedback prompt events"
  ON public.feedback_prompt_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
        AND profiles.role = 'admin'
    )
  );

COMMENT ON TABLE public.feedback_submissions IS 'In-app feedback and NPS-style ratings from authenticated users.';
COMMENT ON TABLE public.feedback_prompt_events IS 'Prompt exposure events used to cap feedback prompts per user.';
