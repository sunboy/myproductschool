-- Claude Code Analytics - preserve analytics Stripe tier ids on subscription rows.
--
-- profiles.plan stays binary ('free' / 'pro') for existing gates. subscriptions.plan
-- stores the actual Stripe tier so analytics entitlements can distinguish the
-- add-on tier from ordinary Pro.

ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'pro', 'analytics_monthly', 'analytics_annual'));
