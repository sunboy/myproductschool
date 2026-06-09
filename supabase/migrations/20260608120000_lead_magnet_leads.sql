-- Lead-magnet capture table.
--
-- Backs the /go/* paid-social landing pages. Each row is one email captured by
-- one magnet, with the computed surface result (quiz archetype, calculator
-- output, readiness band, etc.) stored as JSONB so the unlock email can be
-- personalised and so leads stay segmentable by which magnet earned them.
--
-- Writes go exclusively through the admin API route (src/app/api/leads/route.ts),
-- mirroring the existing `waitlist` pattern: RLS on, service-role-only insert,
-- no public/anon insert policy.

CREATE TABLE IF NOT EXISTS public.leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL,
  name            TEXT,
  source_slug     TEXT NOT NULL,
  magnet_result   JSONB,
  -- Capability token for the personal report URL (/go/{slug}/r/{token}) and the
  -- nurture unsubscribe link. Deliberately separate from the PK so it can be
  -- rotated without touching foreign references.
  report_token    UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  -- Set when the lead opts out of the nurture sequence. The unlock email itself
  -- is transactional (requested asset) and is not gated on this.
  unsubscribed_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Bumped on retake (upsert refreshes magnet_result with the latest result).
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One row per (email, magnet). Re-submitting the same magnet upserts the
  -- result (retake), but the same person CAN appear across different magnets
  -- (intentional — that signals high intent).
  CONSTRAINT leads_email_source_unique UNIQUE (email, source_slug)
);

-- Segment leads by which magnet earned them, and pull recent leads fast.
CREATE INDEX IF NOT EXISTS leads_source_slug_idx ON public.leads (source_slug);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_report_token_idx ON public.leads (report_token);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Service-role insert only. The /api/leads route uses the admin client; there is
-- deliberately no anon/public INSERT policy (deny-by-default).
DROP POLICY IF EXISTS "Service role can insert leads" ON public.leads;
CREATE POLICY "Service role can insert leads"
  ON public.leads
  FOR INSERT
  TO service_role
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can read leads" ON public.leads;
CREATE POLICY "Service role can read leads"
  ON public.leads
  FOR SELECT
  TO service_role
  USING (auth.role() = 'service_role');

-- Retakes upsert (refresh magnet_result + updated_at); unsubscribe sets
-- unsubscribed_at. Both go through the admin client only.
DROP POLICY IF EXISTS "Service role can update leads" ON public.leads;
CREATE POLICY "Service role can update leads"
  ON public.leads
  FOR UPDATE
  TO service_role
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
