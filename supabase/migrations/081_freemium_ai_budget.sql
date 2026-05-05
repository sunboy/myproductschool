-- Migration 081: Freemium usage budgets and Hatch AI spend caps
-- Adds a backend-configurable AI budget while keeping challenge/interview limits tunable.

ALTER TABLE plan_limits
  DROP CONSTRAINT IF EXISTS plan_limits_feature_check;

ALTER TABLE usage_events
  DROP CONSTRAINT IF EXISTS usage_events_feature_check;

ALTER TABLE plan_limits
  ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'count',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS cost_ceiling_cents INTEGER;

ALTER TABLE usage_events
  ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS estimated_cost_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'plan_limits_feature_check'
      AND conrelid = 'plan_limits'::regclass
  ) THEN
    ALTER TABLE plan_limits
      ADD CONSTRAINT plan_limits_feature_check
      CHECK (feature IN ('challenges', 'interviews', 'hatch_ai_cents'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'plan_limits_unit_check'
      AND conrelid = 'plan_limits'::regclass
  ) THEN
    ALTER TABLE plan_limits
      ADD CONSTRAINT plan_limits_unit_check
      CHECK (unit IN ('count', 'cents'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'usage_events_feature_check'
      AND conrelid = 'usage_events'::regclass
  ) THEN
    ALTER TABLE usage_events
      ADD CONSTRAINT usage_events_feature_check
      CHECK (feature IN ('challenges', 'interviews', 'hatch_ai_cents'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'usage_events_quantity_check'
      AND conrelid = 'usage_events'::regclass
  ) THEN
    ALTER TABLE usage_events
      ADD CONSTRAINT usage_events_quantity_check
      CHECK (quantity >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'usage_events_estimated_cost_check'
      AND conrelid = 'usage_events'::regclass
  ) THEN
    ALTER TABLE usage_events
      ADD CONSTRAINT usage_events_estimated_cost_check
      CHECK (estimated_cost_cents >= 0);
  END IF;
END $$;

INSERT INTO plan_limits (plan, feature, limit_value, window_days, unit, description, cost_ceiling_cents) VALUES
  ('free', 'challenges', 3, 30, 'count', 'Free challenge starts per rolling month', NULL),
  ('free', 'interviews', 1, 30, 'count', 'Free AI interview starts per rolling month', NULL),
  ('free', 'hatch_ai_cents', 35, 30, 'cents', 'Free Hatch AI spend budget in cents per rolling month', 35),
  ('pro', 'challenges', 80, 30, 'count', 'Pro challenge starts per rolling month', NULL),
  ('pro', 'interviews', 12, 30, 'count', 'Pro AI interview starts per rolling month', NULL),
  ('pro', 'hatch_ai_cents', 450, 30, 'cents', 'Pro Hatch AI spend budget in cents per rolling month', 600)
ON CONFLICT (plan, feature) DO UPDATE SET
  limit_value = EXCLUDED.limit_value,
  window_days = EXCLUDED.window_days,
  unit = EXCLUDED.unit,
  description = EXCLUDED.description,
  cost_ceiling_cents = EXCLUDED.cost_ceiling_cents,
  updated_at = NOW();

COMMENT ON TABLE plan_limits IS 'Backend-configurable per-feature limits per plan, including Hatch AI budget in cents.';
COMMENT ON COLUMN plan_limits.unit IS 'How limit_value should be interpreted: count or cents.';
COMMENT ON COLUMN plan_limits.cost_ceiling_cents IS 'Internal target COGS ceiling for AI-budget features.';
COMMENT ON COLUMN usage_events.quantity IS 'Usage amount for the feature. Count features use 1; Hatch AI uses estimated cents.';
COMMENT ON COLUMN usage_events.estimated_cost_cents IS 'Estimated vendor cost in cents when usage maps to AI spend.';
