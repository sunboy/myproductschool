-- C2: Monthly AI feature plan limits.
-- Adds per-feature counters separate from rolling usage_events cost tracking.

ALTER TABLE plan_limits
  DROP CONSTRAINT IF EXISTS plan_limits_feature_check;

ALTER TABLE plan_limits
  ADD CONSTRAINT plan_limits_feature_check
  CHECK (
    feature IN (
      'challenges',
      'interviews',
      'hatch_ai_cents',
      'hatch_chat_msgs',
      'hatch_nudges',
      'hatch_canvas_interprets',
      'simulation_turns',
      'live_interview_turns',
      'quick_takes',
      'ai_grading_runs'
    )
  );

CREATE TABLE IF NOT EXISTS usage_counters (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL CHECK (
    feature IN (
      'hatch_chat_msgs',
      'hatch_nudges',
      'hatch_canvas_interprets',
      'simulation_turns',
      'live_interview_turns',
      'quick_takes',
      'ai_grading_runs'
    )
  ),
  period_start DATE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, feature, period_start)
);

CREATE INDEX IF NOT EXISTS usage_counters_feature_period
  ON usage_counters(feature, period_start);

ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'usage_counters'
      AND policyname = 'Users can view own usage_counters'
  ) THEN
    CREATE POLICY "Users can view own usage_counters"
      ON usage_counters
      FOR SELECT
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.increment_usage_counter(
  p_user_id UUID,
  p_feature TEXT,
  p_period_start DATE,
  p_limit INTEGER
)
RETURNS TABLE(allowed BOOLEAN, used INTEGER, limit_value INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_limit < 0 THEN
    RAISE EXCEPTION 'p_limit must be non-negative';
  END IF;

  INSERT INTO usage_counters (user_id, feature, period_start, count)
  VALUES (p_user_id, p_feature, p_period_start, 0)
  ON CONFLICT (user_id, feature, period_start) DO NOTHING;

  UPDATE usage_counters
  SET count = count + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND feature = p_feature
    AND period_start = p_period_start
    AND count < p_limit
  RETURNING count INTO v_count;

  IF v_count IS NOT NULL THEN
    RETURN QUERY SELECT TRUE, v_count, p_limit;
    RETURN;
  END IF;

  SELECT count INTO v_count
  FROM usage_counters
  WHERE user_id = p_user_id
    AND feature = p_feature
    AND period_start = p_period_start;

  RETURN QUERY SELECT FALSE, COALESCE(v_count, 0), p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_usage_counter(UUID, TEXT, DATE, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_usage_counter(UUID, TEXT, DATE, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.increment_usage_counter(UUID, TEXT, DATE, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_usage_counter(UUID, TEXT, DATE, INTEGER) TO service_role;

INSERT INTO plan_limits (plan, feature, limit_value, window_days, unit, description, cost_ceiling_cents) VALUES
  ('free', 'hatch_chat_msgs', 50, 30, 'count', 'Free Hatch chat messages per month', NULL),
  ('free', 'hatch_nudges', 25, 30, 'count', 'Free Hatch nudges per month', NULL),
  ('free', 'hatch_canvas_interprets', 20, 30, 'count', 'Free Hatch canvas interpretations per month', NULL),
  ('free', 'simulation_turns', 40, 30, 'count', 'Free simulation turns per month', NULL),
  ('free', 'live_interview_turns', 80, 30, 'count', 'Free live interview turns per month', NULL),
  ('free', 'quick_takes', 30, 30, 'count', 'Free quick takes per month', NULL),
  ('free', 'ai_grading_runs', 30, 30, 'count', 'Free grading runs per month', NULL),
  ('pro', 'hatch_chat_msgs', 1500, 30, 'count', 'Pro Hatch chat messages per month', NULL),
  ('pro', 'hatch_nudges', 500, 30, 'count', 'Pro Hatch nudges per month', NULL),
  ('pro', 'hatch_canvas_interprets', 500, 30, 'count', 'Pro Hatch canvas interpretations per month', NULL),
  ('pro', 'simulation_turns', 800, 30, 'count', 'Pro simulation turns per month', NULL),
  ('pro', 'live_interview_turns', 1500, 30, 'count', 'Pro live interview turns per month', NULL),
  ('pro', 'quick_takes', 1000, 30, 'count', 'Pro quick takes per month', NULL),
  ('pro', 'ai_grading_runs', 1000, 30, 'count', 'Pro grading runs per month', NULL)
ON CONFLICT (plan, feature) DO UPDATE SET
  limit_value = EXCLUDED.limit_value,
  window_days = EXCLUDED.window_days,
  unit = EXCLUDED.unit,
  description = EXCLUDED.description,
  cost_ceiling_cents = EXCLUDED.cost_ceiling_cents,
  updated_at = NOW();

COMMENT ON TABLE usage_counters IS 'Monthly feature counters for plan-limit enforcement on AI surfaces.';
COMMENT ON FUNCTION public.increment_usage_counter(UUID, TEXT, DATE, INTEGER) IS 'Atomically reserves one monthly feature use and returns whether the plan limit allows it.';
