-- ============================================================
-- HackProduct v2 — FLOW Challenge System
-- Migration: 024_flow_challenge_system.sql
-- Run via: supabase db push OR paste into SQL Editor
-- Idempotent: safe to re-run against existing databases
-- ============================================================

-- ── pgvector already enabled (migration 011) ────────────────

-- ── Extend profiles ─────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS active_role TEXT DEFAULT 'swe'
    CHECK (active_role IN (
      'swe','data_eng','ml_eng','devops','founding_eng',
      'em','tech_lead','pm','designer','data_scientist'
    )),
  ADD COLUMN IF NOT EXISTS paradigm_interests TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS industry_interests TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS active_plan_id UUID REFERENCES study_plans(id),
  ADD COLUMN IF NOT EXISTS schema_version INTEGER DEFAULT 2;


-- ── challenges ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  scenario_role TEXT,
  scenario_context TEXT NOT NULL,
  scenario_trigger TEXT NOT NULL,
  scenario_question TEXT NOT NULL,
  engineer_standout TEXT,
  paradigm TEXT CHECK (paradigm IN ('traditional','ai_assisted','agentic','ai_native')),
  industry TEXT,
  sub_vertical TEXT,
  difficulty TEXT NOT NULL DEFAULT 'standard'
    CHECK (difficulty IN ('warmup','standard','advanced','staff_plus')),
  estimated_minutes INTEGER DEFAULT 10,
  primary_competencies TEXT[] DEFAULT '{}',
  secondary_competencies TEXT[] DEFAULT '{}',
  frameworks TEXT[] DEFAULT '{}',
  relevant_roles TEXT[] DEFAULT '{}',
  company_tags TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_calibration BOOLEAN NOT NULL DEFAULT false,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER challenges_updated_at
    BEFORE UPDATE ON challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── flow_steps ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS flow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  step TEXT NOT NULL CHECK (step IN ('frame','list','optimize','win')),
  step_nudge TEXT,
  grading_weight DECIMAL(3,2) NOT NULL DEFAULT 0.25,
  step_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(challenge_id, step)
);


-- ── step_questions ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS step_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_step_id UUID NOT NULL REFERENCES flow_steps(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_nudge TEXT,
  response_type TEXT NOT NULL DEFAULT 'pure_mcq'
    CHECK (response_type IN ('pure_mcq','mcq_plus_elaboration','modified_option','freeform')),
  sequence INTEGER NOT NULL DEFAULT 1,
  grading_weight_within_step DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  target_competencies TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(flow_step_id, sequence)
);


-- ── flow_options ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS flow_options (
  id TEXT PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES step_questions(id) ON DELETE CASCADE,
  option_label TEXT NOT NULL CHECK (option_label IN ('A','B','C','D')),
  option_text TEXT NOT NULL,
  quality TEXT NOT NULL CHECK (quality IN ('best','good_but_incomplete','surface','plausible_wrong')),
  points INTEGER NOT NULL CHECK (points BETWEEN 0 AND 3),
  competencies TEXT[] DEFAULT '{}',
  explanation TEXT NOT NULL,
  embedding extensions.vector(1024),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(question_id, option_label)
);


-- ── challenge_attempts_v2 ───────────────────────────────────

CREATE TABLE IF NOT EXISTS challenge_attempts_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES challenges(id),
  role_id TEXT NOT NULL DEFAULT 'swe',
  total_score DECIMAL(4,2),
  max_score DECIMAL(4,2) DEFAULT 3.0,
  grade_label TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress','completed','abandoned')),
  current_step TEXT DEFAULT 'frame'
    CHECK (current_step IN ('frame','list','optimize','win','done')),
  current_question_sequence INTEGER DEFAULT 1,
  time_spent_seconds INTEGER DEFAULT 0,
  is_replay BOOLEAN NOT NULL DEFAULT false,
  is_calibration BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── step_attempts ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS step_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES challenge_attempts_v2(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES step_questions(id),
  step TEXT NOT NULL CHECK (step IN ('frame','list','optimize','win')),
  response_type TEXT NOT NULL CHECK (response_type IN (
    'pure_mcq','mcq_plus_elaboration','modified_option','freeform'
  )),
  selected_option_id TEXT REFERENCES flow_options(id),
  user_text TEXT,
  score DECIMAL(4,2),
  weighted_score DECIMAL(4,2),
  quality_label TEXT,
  competencies_demonstrated TEXT[] DEFAULT '{}',
  grading_explanation TEXT,
  rubric_alignment JSONB,
  grading_confidence DECIMAL(3,2),
  role_context TEXT,
  career_signal TEXT,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(attempt_id, question_id)
);


-- ── learner_competencies ────────────────────────────────────

CREATE TABLE IF NOT EXISTS learner_competencies (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competency TEXT NOT NULL CHECK (competency IN (
    'motivation_theory','cognitive_empathy','taste',
    'strategic_thinking','creative_execution','domain_expertise'
  )),
  score DECIMAL(5,2) NOT NULL DEFAULT 50.0,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  trend TEXT NOT NULL DEFAULT 'insufficient_data'
    CHECK (trend IN ('improving','declining','steady','insufficient_data')),
  trend_slope DECIMAL(5,3) DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, competency)
);


-- ── role_lenses ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS role_lenses (
  role_id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  short_label TEXT NOT NULL,
  frame_weight DECIMAL(3,2) NOT NULL DEFAULT 0.20,
  list_weight DECIMAL(3,2) NOT NULL DEFAULT 0.25,
  optimize_weight DECIMAL(3,2) NOT NULL DEFAULT 0.30,
  win_weight DECIMAL(3,2) NOT NULL DEFAULT 0.25,
  competency_multipliers JSONB NOT NULL DEFAULT '{}',
  frame_nudge TEXT,
  list_nudge TEXT,
  optimize_nudge TEXT,
  win_nudge TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── coaching_cache ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS coaching_cache (
  cache_key TEXT PRIMARY KEY,
  role_context TEXT NOT NULL,
  career_signal TEXT NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_hit_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── luma_context_v2 ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS luma_context_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL CHECK (context_type IN (
    'calibration','challenge_insight','weakness_alert',
    'streak_note','plan_progress','role_observation'
  )),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);


-- ── plan_weeks + plan_challenges (v2 study plans) ───────────

CREATE TABLE IF NOT EXISTS plan_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  title TEXT,
  narrative TEXT,
  competency_focus TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plan_id, week_number)
);

CREATE TABLE IF NOT EXISTS plan_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  sequence_in_week INTEGER NOT NULL,
  challenge_id TEXT NOT NULL REFERENCES challenges(id),
  UNIQUE(plan_id, challenge_id)
);

-- Extend existing study_plans for v2 fields
ALTER TABLE study_plans
  ADD COLUMN IF NOT EXISTS paradigm_focus TEXT,
  ADD COLUMN IF NOT EXISTS industry_focus TEXT,
  ADD COLUMN IF NOT EXISTS primary_role TEXT,
  ADD COLUMN IF NOT EXISTS difficulty_arc TEXT,
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS target_persona TEXT,
  ADD COLUMN IF NOT EXISTS duration_weeks INTEGER;


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_challenges_taxonomy ON challenges(paradigm, industry, difficulty) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_challenges_roles ON challenges USING GIN(relevant_roles) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_challenges_companies ON challenges USING GIN(company_tags) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_challenges_published ON challenges(is_published, difficulty) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_flow_steps_challenge ON flow_steps(challenge_id, step_order);
CREATE INDEX IF NOT EXISTS idx_step_questions_step ON step_questions(flow_step_id, sequence);
CREATE INDEX IF NOT EXISTS idx_flow_options_question ON flow_options(question_id, option_label);
CREATE INDEX IF NOT EXISTS idx_attempts_v2_user ON challenge_attempts_v2(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_v2_status ON challenge_attempts_v2(user_id, status) WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS idx_step_attempts_attempt ON step_attempts(attempt_id, step);
CREATE INDEX IF NOT EXISTS idx_competencies_user ON learner_competencies(user_id);
CREATE INDEX IF NOT EXISTS idx_luma_context_v2_user ON luma_context_v2(user_id, is_active, created_at DESC);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "challenges_read" ON challenges FOR SELECT USING (is_published = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "challenges_admin" ON challenges FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE flow_steps ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "flow_steps_read" ON flow_steps FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "flow_steps_admin" ON flow_steps FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE step_questions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "step_questions_read" ON step_questions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "step_questions_admin" ON step_questions FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE flow_options ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "flow_options_read" ON flow_options FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "flow_options_admin" ON flow_options FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE challenge_attempts_v2 ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "attempts_v2_own" ON challenge_attempts_v2 FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "attempts_v2_admin" ON challenge_attempts_v2 FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE step_attempts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "step_attempts_own" ON step_attempts FOR ALL USING (attempt_id IN (SELECT id FROM challenge_attempts_v2 WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "step_attempts_service" ON step_attempts FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE learner_competencies ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "competencies_read" ON learner_competencies FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "competencies_service" ON learner_competencies FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE role_lenses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "role_lenses_read" ON role_lenses FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "role_lenses_admin" ON role_lenses FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE coaching_cache ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "coaching_cache_service" ON coaching_cache FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE luma_context_v2 ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "luma_context_v2_read" ON luma_context_v2 FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "luma_context_v2_service" ON luma_context_v2 FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE plan_weeks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "plan_weeks_read" ON plan_weeks FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "plan_weeks_admin" ON plan_weeks FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE plan_challenges ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "plan_challenges_read" ON plan_challenges FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "plan_challenges_admin" ON plan_challenges FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION initialize_learner_competencies(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO learner_competencies (user_id, competency)
  VALUES
    (p_user_id, 'motivation_theory'),
    (p_user_id, 'cognitive_empathy'),
    (p_user_id, 'taste'),
    (p_user_id, 'strategic_thinking'),
    (p_user_id, 'creative_execution'),
    (p_user_id, 'domain_expertise')
  ON CONFLICT (user_id, competency) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (new.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  PERFORM initialize_move_levels(new.id);
  PERFORM initialize_user_settings(new.id);
  PERFORM initialize_learner_competencies(new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION shuffle_seed(p_user_id UUID, p_challenge_id TEXT, p_step TEXT)
RETURNS INTEGER AS $$
  SELECT abs(hashtext(p_user_id::text || p_challenge_id || p_step))
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION match_option_embeddings(
  query_embedding extensions.vector(1024),
  p_question_id UUID,
  match_threshold FLOAT DEFAULT 0.85
)
RETURNS TABLE (option_id TEXT, option_label TEXT, quality TEXT, points INTEGER, similarity FLOAT)
AS $$
  SELECT fo.id, fo.option_label, fo.quality, fo.points,
    1 - (fo.embedding <=> query_embedding) as similarity
  FROM flow_options fo
  WHERE fo.question_id = p_question_id
    AND fo.embedding IS NOT NULL
    AND 1 - (fo.embedding <=> query_embedding) > match_threshold
  ORDER BY fo.embedding <=> query_embedding LIMIT 4;
$$ LANGUAGE SQL STABLE SET search_path = public, extensions;


-- ============================================================
-- SEED: ROLE LENSES
-- ============================================================

INSERT INTO role_lenses (role_id, label, short_label, frame_weight, list_weight, optimize_weight, win_weight, competency_multipliers, frame_nudge, list_nudge, optimize_nudge, win_nudge) VALUES
('swe','Software Engineer','SWE',0.15,0.30,0.30,0.25,'{"motivation_theory":0.8,"cognitive_empathy":1.2,"strategic_thinking":1.0,"taste":0.9,"creative_execution":1.0,"domain_expertise":1.3}','Think beyond the code. What''s the system-level consequence?','You probably thought of the technical options first. Now add one a PM would think of.','The cleanest technical solution might not be the right product decision.','Your recommendation should be specific enough to open a Jira ticket right now.'),
('data_eng','Data Engineer','Data Eng',0.15,0.35,0.25,0.25,'{"motivation_theory":0.8,"cognitive_empathy":1.1,"strategic_thinking":0.9,"taste":0.8,"creative_execution":1.0,"domain_expertise":1.4}','What data exists to answer this question, and what data is missing?','Think about the full data lifecycle — ingestion, transformation, serving.','Every metric you add has a pipeline cost. What''s the tradeoff between freshness and compute?','Specify the exact events, schemas, and pipeline changes.'),
('ml_eng','ML Engineer','ML Eng',0.20,0.30,0.30,0.20,'{"motivation_theory":0.8,"cognitive_empathy":1.0,"strategic_thinking":1.1,"taste":1.0,"creative_execution":1.2,"domain_expertise":1.3}','What''s the model''s role in this problem? Is the issue model quality, data quality, or product-model misalignment?','Think about the full ML lifecycle — training signal, feature engineering, inference, monitoring.','The model-optimal solution isn''t always the product-optimal solution.','Be specific: what''s the eval metric, what''s the threshold for shipping?'),
('devops','DevOps / Platform Engineer','DevOps',0.15,0.30,0.30,0.25,'{"motivation_theory":0.8,"cognitive_empathy":1.0,"strategic_thinking":1.0,"taste":0.9,"creative_execution":1.0,"domain_expertise":1.3}','How does this problem manifest in production? What alerts would fire?','Think about observability, deployment, and reliability.','Reliability vs. velocity is your core tradeoff.','What runbook steps, alerts, or infrastructure changes ship first?'),
('founding_eng','Founding Engineer','Founding Eng',0.20,0.20,0.25,0.35,'{"motivation_theory":1.0,"cognitive_empathy":1.2,"strategic_thinking":1.3,"taste":1.2,"creative_execution":1.3,"domain_expertise":1.0}','You don''t have a PM to frame this for you. What would a great PM say?','You can''t build everything. List options a 10-person team could actually ship.','Speed vs. correctness is your life. Which option gets you learning fastest?','What can you ship this week? Not this quarter. This week.'),
('em','Engineering Manager','EM',0.25,0.15,0.35,0.25,'{"motivation_theory":1.1,"cognitive_empathy":1.3,"strategic_thinking":1.2,"taste":1.0,"creative_execution":0.9,"domain_expertise":0.9}','This is really a resource allocation problem. What''s the opportunity cost?','Think about your team''s capacity and skills.','You''re optimizing for team velocity AND team health.','Who owns this? What''s the staffing model?'),
('tech_lead','Tech Lead / Staff Engineer','Tech Lead',0.20,0.25,0.35,0.20,'{"motivation_theory":0.9,"cognitive_empathy":1.1,"strategic_thinking":1.3,"taste":1.2,"creative_execution":1.1,"domain_expertise":1.2}','What''s the architectural implication? Will this compound into tech debt?','Think about the solution space across the stack.','You''re trading off shipping speed against long-term system health.','Write the ADR in your head. Decision, context, consequences.'),
('pm','Product Manager','PM',0.25,0.20,0.30,0.25,'{"motivation_theory":1.3,"cognitive_empathy":1.4,"strategic_thinking":1.3,"taste":1.2,"creative_execution":1.0,"domain_expertise":0.8}','Who are all the stakeholders, and where do their needs conflict?','What options would your engineering team suggest?','You''re trading off user value, effort, business impact, and org complexity.','Present this in a 2-minute standup update. Clear, scoped, with a success metric.'),
('designer','Product Designer','Designer',0.25,0.25,0.25,0.25,'{"motivation_theory":1.1,"cognitive_empathy":1.3,"strategic_thinking":0.9,"taste":1.4,"creative_execution":1.2,"domain_expertise":0.8}','What''s the user''s emotional state when they hit this problem?','Think about the full user journey — before, during, and after.','Delight vs. clarity is a real tradeoff.','Describe the interaction so an engineer could build it without a Figma file.'),
('data_scientist','Data Scientist','Data Sci',0.20,0.30,0.30,0.20,'{"motivation_theory":0.9,"cognitive_empathy":1.0,"strategic_thinking":1.1,"taste":0.9,"creative_execution":1.0,"domain_expertise":1.3}','What''s the causal question here, not just the correlation?','Think about measurement approaches — A/B test vs. observational.','Statistical significance vs. practical significance.','Specify the experiment design — sample size, duration, primary metric.')
ON CONFLICT (role_id) DO NOTHING;


-- ============================================================
-- BACKFILL COMPETENCIES FOR EXISTING USERS
-- ============================================================

INSERT INTO learner_competencies (user_id, competency)
SELECT p.id, c.competency
FROM profiles p
CROSS JOIN (VALUES ('motivation_theory'),('cognitive_empathy'),('taste'),('strategic_thinking'),('creative_execution'),('domain_expertise')) AS c(competency)
ON CONFLICT (user_id, competency) DO NOTHING;
