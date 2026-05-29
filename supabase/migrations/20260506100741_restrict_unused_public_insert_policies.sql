-- Current app writes to waitlist through the admin API route, and the other
-- tables below have no active app references. Remove broad public insert access
-- and keep server-side/service-role inserts available.

DROP POLICY IF EXISTS "Public insert engagement_events" ON public.engagement_events;
CREATE POLICY "Service role can insert engagement_events"
  ON public.engagement_events
  FOR INSERT
  TO service_role
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Public insert flags" ON public.flags;
CREATE POLICY "Service role can insert flags"
  ON public.flags
  FOR INSERT
  TO service_role
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Public insert search_queries" ON public.search_queries;
CREATE POLICY "Service role can insert search_queries"
  ON public.search_queries
  FOR INSERT
  TO service_role
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Public insert taxonomy_suggestions" ON public.taxonomy_suggestions;
CREATE POLICY "Service role can insert taxonomy_suggestions"
  ON public.taxonomy_suggestions
  FOR INSERT
  TO service_role
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
CREATE POLICY "Service role can insert waitlist"
  ON public.waitlist
  FOR INSERT
  TO service_role
  WITH CHECK (auth.role() = 'service_role');
