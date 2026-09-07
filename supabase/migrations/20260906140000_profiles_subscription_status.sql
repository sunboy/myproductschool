-- Canonical Stripe subscription state mirrored onto profiles.
--
-- This column is intentionally nullable and has no default or CHECK constraint:
-- null lets entitlement reads fall back to the subscriptions row before Stripe
-- has delivered a lifecycle event, and Stripe plus the dispute handlers write a
-- wider set of states than a fixed database enum would safely allow.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status TEXT;

COMMENT ON COLUMN public.profiles.subscription_status IS
  'Current Stripe subscription or billing-access state used by entitlement and dunning reads.';
