-- Dunning state columns on profiles
-- payment_failures: count of consecutive failed payment attempts
-- past_due_since:   when the subscription first entered past_due
-- pro_access:       explicit boolean used by webhook handlers alongside subscription_status

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS payment_failures  int          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS past_due_since    timestamptz,
  ADD COLUMN IF NOT EXISTS pro_access        boolean      NOT NULL DEFAULT false;
