-- CareerOps — job-search/applications feature.
-- Tables: career_profiles, job_applications, career_fit_evaluations,
-- resume_versions, interview_stories, job_listings, job_listing_scores.
-- Plus plan-limit wiring for the new gated AI features.

-- ─────────────────────────────────────────────────────────────────────────────
-- career_profiles — one row per user; grounding pack for scoring/tailoring.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS career_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role      TEXT,
  seniority        TEXT,
  locations        TEXT[] NOT NULL DEFAULT '{}',
  key_skills       TEXT[] NOT NULL DEFAULT '{}',
  resume_text      TEXT,
  resume_json      JSONB,
  comp_expectation TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_career_profile_user UNIQUE (user_id)
);

ALTER TABLE career_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "users manage own career_profile"
    ON career_profiles FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- job_applications — the pipeline board.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company          TEXT,
  role_title       TEXT,
  jd_url           TEXT,
  jd_text          TEXT,
  status           TEXT NOT NULL DEFAULT 'saved'
                     CHECK (status IN ('saved','applied','interviewing','offer','rejected','archived')),
  fit_score        NUMERIC,
  fit_grade        TEXT,
  fit_breakdown    JSONB,
  next_action      TEXT,
  next_action_due  DATE,
  notes            TEXT,
  source           TEXT,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_applications_user
  ON job_applications(user_id, created_at DESC);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "users manage own job_applications"
    ON job_applications FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- career_fit_evaluations — score history (manual paste-a-JD / saved app).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS career_fit_evaluations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id  UUID REFERENCES job_applications(id) ON DELETE CASCADE,
  company         TEXT,
  role_title      TEXT,
  score           NUMERIC,
  grade           TEXT,
  breakdown       JSONB,
  report_md       TEXT,
  gaps            JSONB,
  readiness_map   JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fit_evals_user
  ON career_fit_evaluations(user_id, created_at DESC);

ALTER TABLE career_fit_evaluations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "users manage own fit_evaluations"
    ON career_fit_evaluations FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- resume_versions — tailored résumé snapshots.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resume_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id  UUID REFERENCES job_applications(id) ON DELETE CASCADE,
  label           TEXT,
  tailored_md     TEXT,
  keywords        TEXT[] NOT NULL DEFAULT '{}',
  ats_notes       JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_versions_user
  ON resume_versions(user_id, created_at DESC);

ALTER TABLE resume_versions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "users manage own resume_versions"
    ON resume_versions FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- interview_stories — STAR + Reflection bank.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interview_stories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT,
  situation     TEXT,
  task          TEXT,
  action        TEXT,
  result        TEXT,
  reflection    TEXT,
  tags          TEXT[] NOT NULL DEFAULT '{}',
  competencies  TEXT[] NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_stories_user
  ON interview_stories(user_id, created_at DESC);

ALTER TABLE interview_stories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "users manage own interview_stories"
    ON interview_stories FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- job_listings — GLOBAL ingested feed pool (not per-user). Read-only to
-- authenticated users; writes happen via the service-role ingestion cron.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        TEXT NOT NULL
                    CHECK (provider IN ('jsearch','greenhouse','lever','ashby','workable')),
  external_id     TEXT NOT NULL,
  company         TEXT,
  role_title      TEXT,
  location        TEXT,
  url             TEXT,
  department      TEXT,
  description     TEXT,
  posted_at       TIMESTAMPTZ,
  discipline_tags TEXT[],
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw             JSONB,
  CONSTRAINT uq_job_listing_provider_external UNIQUE (provider, external_id)
);

CREATE INDEX IF NOT EXISTS idx_job_listings_active
  ON job_listings(is_active, last_seen_at DESC);

ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "authenticated can read job_listings"
    ON job_listings FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- job_listing_scores — per-user × listing fit cache for the discovery feed.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_listing_scores (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id          UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  score               NUMERIC,
  grade               TEXT,
  breakdown           JSONB,
  readiness_map       JSONB,
  gaps                JSONB,
  profile_fingerprint TEXT,
  scored_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_job_listing_score_user_listing UNIQUE (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_job_listing_scores_user
  ON job_listing_scores(user_id, scored_at DESC);

ALTER TABLE job_listing_scores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "users manage own job_listing_scores"
    ON job_listing_scores FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Plan-limit wiring for the new gated AI features.
-- Extend the CHECK constraints on plan_limits.feature and usage_counters.feature,
-- then seed limits.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE plan_limits DROP CONSTRAINT IF EXISTS plan_limits_feature_check;
ALTER TABLE plan_limits
  ADD CONSTRAINT plan_limits_feature_check
  CHECK (feature IN (
    'challenges','interviews','hatch_ai_cents','hatch_chat_msgs','hatch_nudges',
    'hatch_canvas_interprets','simulation_turns','live_interview_turns',
    'quick_takes','ai_grading_runs',
    'careerops_fit_scores','careerops_feed_scores','careerops_resume_tailors'
  ));

ALTER TABLE usage_counters DROP CONSTRAINT IF EXISTS usage_counters_feature_check;
ALTER TABLE usage_counters
  ADD CONSTRAINT usage_counters_feature_check
  CHECK (feature IN (
    'hatch_chat_msgs','hatch_nudges','hatch_canvas_interprets','simulation_turns',
    'live_interview_turns','quick_takes','ai_grading_runs',
    'careerops_fit_scores','careerops_feed_scores','careerops_resume_tailors'
  ));

INSERT INTO plan_limits (plan, feature, limit_value, window_days, unit, description, cost_ceiling_cents) VALUES
  ('free', 'careerops_fit_scores',     3,   30, 'count', 'Free CareerOps job fit scores per month', NULL),
  ('free', 'careerops_feed_scores',    10,  30, 'count', 'Free CareerOps discovery-feed auto-scores per month', NULL),
  ('free', 'careerops_resume_tailors', 1,   30, 'count', 'Free CareerOps résumé tailors per month', NULL),
  ('pro',  'careerops_fit_scores',     200, 30, 'count', 'Pro CareerOps job fit scores per month', NULL),
  ('pro',  'careerops_feed_scores',    400, 30, 'count', 'Pro CareerOps discovery-feed auto-scores per month', NULL),
  ('pro',  'careerops_resume_tailors', 100, 30, 'count', 'Pro CareerOps résumé tailors per month', NULL)
ON CONFLICT (plan, feature) DO UPDATE SET
  limit_value = EXCLUDED.limit_value,
  window_days = EXCLUDED.window_days,
  unit = EXCLUDED.unit,
  description = EXCLUDED.description,
  updated_at = NOW();

COMMENT ON TABLE job_listings IS 'Global ingested job-posting pool (JSearch + ATS feeds). Read-only to users; written by the ingestion cron.';
COMMENT ON TABLE job_listing_scores IS 'Per-user AI fit-score cache for the discovery feed, keyed by profile fingerprint.';
