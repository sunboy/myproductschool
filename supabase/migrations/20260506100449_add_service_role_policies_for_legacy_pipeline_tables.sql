-- These legacy pipeline tables are not used by the app today and should not be
-- exposed to anon or authenticated clients. Add explicit service-role policies
-- so RLS has a documented access model without changing user-facing access.

DROP POLICY IF EXISTS "Service role can manage pipeline runs" ON public.pipeline_runs;
CREATE POLICY "Service role can manage pipeline runs"
  ON public.pipeline_runs
  FOR ALL
  TO service_role
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage processing queue" ON public.processing_queue;
CREATE POLICY "Service role can manage processing queue"
  ON public.processing_queue
  FOR ALL
  TO service_role
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
