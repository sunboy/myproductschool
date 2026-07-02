-- Lead-magnet reports + nurture support.
--
-- Adds the capability token for personal report URLs (/go/{slug}/r/{token}),
-- the nurture unsubscribe timestamp, and a retake-tracking updated_at. Also
-- allows service-role UPDATE (retake upserts + unsubscribe), which the
-- original insert/select-only policies did not.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS report_token UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- The capability URL lookup must be unique + fast.
CREATE UNIQUE INDEX IF NOT EXISTS leads_report_token_key ON public.leads (report_token);

-- Retakes upsert (refresh magnet_result + updated_at); unsubscribe sets
-- unsubscribed_at. Both go through the admin client only.
DROP POLICY IF EXISTS "Service role can update leads" ON public.leads;
CREATE POLICY "Service role can update leads"
  ON public.leads
  FOR UPDATE
  TO service_role
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
