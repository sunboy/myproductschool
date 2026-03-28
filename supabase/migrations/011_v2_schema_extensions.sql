-- ============================================================
-- HackProduct v2 Schema Extensions
-- Adds FLOW move levels, study plans, cohort challenges,
-- user settings, and extends existing tables for v2 paradigm/role model
-- ============================================================

-- ── Extend profiles ──────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_role TEXT
    CHECK (preferred_role IN ('SWE', 'Data Eng', 'ML Eng', 'DevOps', 'EM', 'Founding Eng')),
  ADD COLUMN IF NOT EXISTS archetype TEXT,
  ADD COLUMN IF NOT EXISTS archetype_description TEXT,
  ADD COLUMN IF NOT EXISTS streak_shield_count INTEGER DEFAULT 0;

-- ── Extend challenge_prompts ─────────────────────────────────

ALTER TABLE challenge_prompts
  ADD COLUMN IF NOT EXISTS paradigm TEXT
    CHECK (paradigm IN ('traditional', 'ai-assisted', 'agentic', 'ai-native')),
  ADD COLUMN IF NOT EXISTS move_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS role_tags TEXT[] DEFAULT '{}';

-- ── Extend challenge_attempts mode constraint ────────────────

ALTER TABLE challenge_attempts DROP CONSTRAINT IF EXISTS challenge_attempts_mode_check;
ALTER TABLE challenge_attempts ADD CONSTRAINT challenge_attempts_mode_check
  CHECK (mode IN ('solo', 'live', 'guided', 'freeform', 'quick-take'));

-- ── Extend luma_feedback dimension constraint ────────────────

ALTER TABLE luma_feedback DROP CONSTRAINT IF EXISTS luma_feedback_dimension_check;
ALTER TABLE luma_feedback ADD CONSTRAINT luma_feedback_dimension_check
  CHECK (dimension IN (
    'clarity', 'structure', 'insight', 'feasibility', 'tradeoffs',
    'diagnostic_accuracy', 'metric_fluency', 'framing_precision', 'recommendation_strength'
  ));

-- ── Extend onboarding_responses ──────────────────────────────

ALTER TABLE onboarding_responses
  ADD COLUMN IF NOT EXISTS preferred_role TEXT,
  ADD COLUMN IF NOT EXISTS calibration_scores JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS archetype TEXT;

-- ── NEW: move_levels ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS move_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  move TEXT NOT NULL CHECK (move IN ('frame', 'split', 'weigh', 'sell')),
  level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 10),
  progress_pct INTEGER NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, move)
);

CREATE INDEX IF NOT EXISTS idx_move_levels_user ON move_levels(user_id);

ALTER TABLE move_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own move levels"
  ON move_levels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages move levels"
  ON move_levels FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-update updated_at
CREATE TRIGGER move_levels_updated_at
  BEFORE UPDATE ON move_levels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── NEW: move_level_history ──────────────────────────────────

CREATE TABLE IF NOT EXISTS move_level_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  move TEXT NOT NULL CHECK (move IN ('frame', 'split', 'weigh', 'sell')),
  xp_delta INTEGER NOT NULL,
  source TEXT, -- 'challenge', 'quick-take', 'calibration', 'cohort'
  source_id UUID, -- attempt_id or cohort_submission_id
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_move_history_user ON move_level_history(user_id, move);

ALTER TABLE move_level_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own move history"
  ON move_level_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages history"
  ON move_level_history FOR ALL
  USING (auth.role() = 'service_role');

-- ── NEW: study_plans ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  move_tag TEXT CHECK (move_tag IN ('frame', 'split', 'weigh', 'sell')),
  role_tags TEXT[] DEFAULT '{}',
  challenge_count INTEGER DEFAULT 0,
  estimated_hours NUMERIC(4,1) DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published plans"
  ON study_plans FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins manage plans"
  ON study_plans FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── NEW: study_plan_chapters ─────────────────────────────────

CREATE TABLE IF NOT EXISTS study_plan_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  challenge_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chapters_plan ON study_plan_chapters(plan_id, order_index);

ALTER TABLE study_plan_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view chapters"
  ON study_plan_chapters FOR SELECT USING (true);

CREATE POLICY "Admins manage chapters"
  ON study_plan_chapters FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── NEW: user_study_plans ────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  progress_pct INTEGER DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  is_active BOOLEAN DEFAULT true,
  completed_challenges UUID[] DEFAULT '{}',
  UNIQUE (user_id, plan_id)
);

ALTER TABLE user_study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own plan enrollment"
  ON user_study_plans FOR ALL
  USING (auth.uid() = user_id);

-- ── NEW: cohort_challenges ───────────────────────────────────

CREATE TABLE IF NOT EXISTS cohort_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  difficulty TEXT DEFAULT 'intermediate'
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  move_tag TEXT CHECK (move_tag IN ('frame', 'split', 'weigh', 'sell')),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cohort_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cohort challenges"
  ON cohort_challenges FOR SELECT USING (true);

CREATE POLICY "Admins manage cohort challenges"
  ON cohort_challenges FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── NEW: cohort_submissions ──────────────────────────────────

CREATE TABLE IF NOT EXISTS cohort_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cohort_challenge_id UUID NOT NULL REFERENCES cohort_challenges(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  feedback_json JSONB,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, cohort_challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_cohort_subs_challenge
  ON cohort_submissions(cohort_challenge_id, score DESC);

ALTER TABLE cohort_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cohort submissions"
  ON cohort_submissions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view cohort scores"
  ON cohort_submissions FOR SELECT USING (true);

-- ── NEW: user_settings ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  notifications JSONB DEFAULT '{"weekly_summary": true, "streak_reminder": true, "new_challenges": true, "cohort_updates": true}',
  daily_goal_count INTEGER DEFAULT 3 CHECK (daily_goal_count BETWEEN 1 AND 10),
  preferred_role TEXT CHECK (preferred_role IN ('SWE', 'Data Eng', 'ML Eng', 'DevOps', 'EM', 'Founding Eng')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own settings"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Initialize move levels for existing users ────────────────

-- Function to create default move levels for a user
CREATE OR REPLACE FUNCTION initialize_move_levels(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO move_levels (user_id, move, level, progress_pct, xp)
  VALUES
    (p_user_id, 'frame', 1, 0, 0),
    (p_user_id, 'split', 1, 0, 0),
    (p_user_id, 'weigh', 1, 0, 0),
    (p_user_id, 'sell',  1, 0, 0)
  ON CONFLICT (user_id, move) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default settings for a user
CREATE OR REPLACE FUNCTION initialize_user_settings(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Update handle_new_user to also create move levels + settings

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create profile (existing)
  INSERT INTO public.profiles (id) VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;

  -- Create subscription (existing)
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (new.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  -- Create default move levels (new)
  PERFORM initialize_move_levels(new.id);

  -- Create default settings (new)
  PERFORM initialize_user_settings(new.id);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
