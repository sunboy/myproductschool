-- Migration 045: Add billing_interval to subscriptions table
-- Tracks whether the user is on a monthly or annual Pro plan.

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS billing_interval TEXT CHECK (billing_interval IN ('month', 'year')) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT DEFAULT NULL;

-- Update RLS: users can read their own subscription row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscriptions'
      AND policyname = 'Users can view own subscription'
  ) THEN
    CREATE POLICY "Users can view own subscription"
      ON subscriptions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

COMMENT ON COLUMN subscriptions.billing_interval IS 'month or year — set from Stripe subscription metadata on webhook';
COMMENT ON COLUMN subscriptions.stripe_price_id   IS 'Stripe Price ID used for this subscription';
