-- Lock free plan quota at 3 challenges / 1 interview per 30-day window.
-- Reason: migration 046 originally seeded 10/5, but FALLBACK_LIMITS in
-- src/lib/usage/check-limit.ts:38-51 and the paywall UI copy
-- ("You've used 3 free challenges" in ProPaywallGate.tsx:101) both align on 3/1.
-- The live DB had been hand-corrected to 3/1 already; this migration makes that
-- canonical so future fresh environments don't seed the stale 10/5 values.
-- Audit reference: docs/notes/stripe-paywall-audit.md (D1).

UPDATE plan_limits SET limit_value = 3, window_days = 30, updated_at = NOW()
  WHERE plan = 'free' AND feature = 'challenges';

UPDATE plan_limits SET limit_value = 1, window_days = 30, updated_at = NOW()
  WHERE plan = 'free' AND feature = 'interviews';

-- Idempotent insert in case the rows don't exist yet (fresh environments).
INSERT INTO plan_limits (plan, feature, limit_value, window_days) VALUES
  ('free', 'challenges', 3, 30),
  ('free', 'interviews', 1, 30)
ON CONFLICT (plan, feature) DO NOTHING;
