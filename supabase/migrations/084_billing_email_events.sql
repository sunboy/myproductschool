-- Migration 084: Billing email lifecycle audit
-- Stores Resend send results and prevents duplicate lifecycle emails from webhook retries.

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cancel_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ DEFAULT NULL;

CREATE TABLE IF NOT EXISTS billing_email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key TEXT NOT NULL UNIQUE,
  stripe_event_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient TEXT NOT NULL,
  template TEXT NOT NULL CHECK (
    template IN (
      'premium_signup_receipt',
      'renewal_receipt',
      'payment_failed',
      'cancellation_scheduled',
      'subscription_reactivated',
      'subscription_ended',
      'plan_changed'
    )
  ),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  resend_email_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS billing_email_events_user_created
  ON billing_email_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS billing_email_events_stripe_event
  ON billing_email_events(stripe_event_id);

ALTER TABLE billing_email_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'billing_email_events'
      AND policyname = 'Users can view own billing emails'
  ) THEN
    CREATE POLICY "Users can view own billing emails"
      ON billing_email_events FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

COMMENT ON TABLE billing_email_events IS 'Audit trail for transactional billing emails sent through Resend.';
COMMENT ON COLUMN billing_email_events.dedupe_key IS 'Stable key used with Resend idempotency to prevent duplicate sends.';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'True when Stripe will cancel the subscription at the current period end.';
