CREATE TABLE IF NOT EXISTS public.abuse_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL
    CHECK (target_type IN ('hatch_response', 'share_scorecard', 'discussion_comment')),
  target_id TEXT,
  target_url TEXT,
  category TEXT NOT NULL
    CHECK (category IN ('harmful', 'harassment', 'spam', 'broken_incorrect', 'other')),
  message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS abuse_reports_reporter_created_idx
  ON public.abuse_reports(reporter_id, created_at DESC)
  WHERE reporter_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS abuse_reports_status_created_idx
  ON public.abuse_reports(status, created_at DESC);

CREATE INDEX IF NOT EXISTS abuse_reports_target_idx
  ON public.abuse_reports(target_type, target_id);

ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.abuse_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.abuse_reports TO service_role;

DROP POLICY IF EXISTS "Users insert own abuse reports" ON public.abuse_reports;
CREATE POLICY "Users insert own abuse reports"
  ON public.abuse_reports FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = reporter_id);

DROP POLICY IF EXISTS "Users read own abuse reports" ON public.abuse_reports;
CREATE POLICY "Users read own abuse reports"
  ON public.abuse_reports FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = reporter_id);

COMMENT ON TABLE public.abuse_reports IS 'General in-app abuse and quality reports across Hatch responses, scorecards, and discussion comments.';
COMMENT ON COLUMN public.abuse_reports.target_type IS 'Reported surface type.';
COMMENT ON COLUMN public.abuse_reports.target_id IS 'Surface-specific identifier such as message id, share id, or discussion id.';
COMMENT ON COLUMN public.abuse_reports.metadata IS 'Non-sensitive report context captured by the server or reporting component.';
