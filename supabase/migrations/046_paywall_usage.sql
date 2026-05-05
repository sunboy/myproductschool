-- Migration 046: Paywall usage tracking
-- plan_limits: backend-configurable limits per plan/feature
-- usage_events: append-only log for rolling window enforcement

CREATE TABLE IF NOT EXISTS plan_limits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan        TEXT NOT NULL CHECK (plan IN ('free', 'pro')),
  feature     TEXT NOT NULL CHECK (feature IN ('challenges', 'interviews')),
  limit_value INTEGER NOT NULL,
  window_days INTEGER NOT NULL DEFAULT 30,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plan, feature)
);

-- Seed defaults (idempotent)
INSERT INTO plan_limits (plan, feature, limit_value, window_days) VALUES
  ('free', 'challenges', 10, 30),
  ('free', 'interviews', 5,  30)
ON CONFLICT (plan, feature) DO NOTHING;

CREATE TABLE IF NOT EXISTS usage_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature    TEXT NOT NULL CHECK (feature IN ('challenges', 'interviews')),
  event_type TEXT NOT NULL DEFAULT 'start',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Efficient rolling-window count queries
CREATE INDEX IF NOT EXISTS usage_events_user_feature_created
  ON usage_events(user_id, feature, created_at DESC);

-- RLS
ALTER TABLE plan_limits  ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- plan_limits: anyone authenticated can read (needed by /api/usage/me client path)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'plan_limits' AND policyname = 'Authenticated users can read plan_limits'
  ) THEN
    CREATE POLICY "Authenticated users can read plan_limits"
      ON plan_limits FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- usage_events: users read only their own rows; service role writes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'usage_events' AND policyname = 'Users can view own usage_events'
  ) THEN
    CREATE POLICY "Users can view own usage_events"
      ON usage_events FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

COMMENT ON TABLE plan_limits  IS 'Backend-configurable per-feature limits per plan. No pro rows = unlimited.';
COMMENT ON TABLE usage_events IS 'Append-only log for rolling-window usage enforcement.';
COMMENT ON COLUMN plan_limits.window_days IS 'Rolling window in days (default 30).';
