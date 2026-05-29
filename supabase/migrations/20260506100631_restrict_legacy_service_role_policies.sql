-- Tighten legacy policies whose names already describe service-role-only access.
-- Public read or public intake policies are intentionally left unchanged here.

DROP POLICY IF EXISTS "Service role can manage luma context" ON public._archived_luma_context_legacy;
CREATE POLICY "Service role can manage luma context"
  ON public._archived_luma_context_legacy
  FOR ALL
  TO service_role
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can insert feedback" ON public._archived_luma_feedback;
CREATE POLICY "Service role can insert feedback"
  ON public._archived_luma_feedback
  FOR INSERT
  TO service_role
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on artifact_mentions" ON public.artifact_mentions;
CREATE POLICY "Service role full access on artifact_mentions"
  ON public.artifact_mentions
  FOR ALL
  TO service_role
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on raw_repos" ON public.raw_repos;
CREATE POLICY "Service role full access on raw_repos"
  ON public.raw_repos
  FOR ALL
  TO service_role
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on scraper_state" ON public.scraper_state;
CREATE POLICY "Service role full access on scraper_state"
  ON public.scraper_state
  FOR ALL
  TO service_role
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
