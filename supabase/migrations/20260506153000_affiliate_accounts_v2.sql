-- Extend the existing affiliate system with Stripe Accounts v2 state.
-- Keep affiliates as the canonical table; do not introduce affiliate_partners.

ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS stripe_account_livemode BOOLEAN,
  ADD COLUMN IF NOT EXISTS stripe_account_status TEXT NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS stripe_requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS stripe_future_requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS stripe_capabilities JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$ BEGIN
  ALTER TABLE public.affiliates
    ADD CONSTRAINT affiliates_stripe_account_status_check
    CHECK (stripe_account_status IN (
      'not_started',
      'created',
      'onboarding',
      'active',
      'restricted',
      'disabled'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

UPDATE public.affiliates
SET stripe_account_status = CASE
  WHEN stripe_connect_account_id IS NULL THEN 'not_started'
  WHEN status = 'active' THEN 'active'
  ELSE 'created'
END
WHERE stripe_account_status = 'not_started';

CREATE INDEX IF NOT EXISTS idx_affiliates_stripe_account_status
  ON public.affiliates(stripe_account_status, updated_at DESC);

COMMENT ON COLUMN public.affiliates.stripe_account_status IS
  'Stripe Accounts v2 recipient onboarding/capability state.';
COMMENT ON COLUMN public.affiliates.stripe_requirements IS
  'Latest Stripe Accounts v2 requirements payload for affiliate onboarding.';
COMMENT ON COLUMN public.affiliates.stripe_future_requirements IS
  'Latest Stripe Accounts v2 future requirements payload.';
COMMENT ON COLUMN public.affiliates.stripe_capabilities IS
  'Latest Stripe Accounts v2 recipient capabilities payload.';
