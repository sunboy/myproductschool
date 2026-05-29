DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  TO service_role
  USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Service role insert patterns" ON public.user_failure_patterns;
CREATE POLICY "Service role insert patterns"
  ON public.user_failure_patterns FOR INSERT
  TO service_role
  WITH CHECK ((select auth.role()) = 'service_role');
