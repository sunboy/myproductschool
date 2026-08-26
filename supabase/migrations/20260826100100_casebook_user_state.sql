-- Casebook Loop — user-state tables (per-user progress, attempts, spaced-review
-- queue, shareable reports, lane mastery, badges).
--
-- Content tables (cc_tracks, cc_cases, cc_expert_sessions, cc_scenes,
-- cc_skill_lanes) live in 20260826100000_casebook_content.sql and are
-- admin-authored / service-role write only. This migration holds the tables
-- that record what a user has done: scene attempts, replay predictions, the
-- spaced-repetition review queue, full case attempts, shareable report
-- snapshots, per-lane mastery progress, and track-completion badges.
--
-- Unlike the content tables, primary keys here are real `uuid` (gen_random_uuid()).
-- Columns that reference CONTENT rows (case_id, scene_id, item_id, track_id,
-- lane_key) stay TEXT SLUGS, matching the content tables' slug primary keys.
--
-- Strictly additive: CREATE TABLE IF NOT EXISTS only, no ALTER/DROP of any
-- pre-existing table. dev and prod share this database.

CREATE TABLE IF NOT EXISTS cc_scene_attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scene_id    TEXT NOT NULL REFERENCES cc_scenes(id),
  attempt_no  INT NOT NULL DEFAULT 1,
  status      TEXT NOT NULL CHECK (status IN ('in_progress', 'clean', 'assisted', 'slow', 'missed', 'abandoned')),
  verdict     JSONB,                                  -- {did:[...], missed:[...], next_rep:string}
  transcript_ref TEXT,                                 -- storage path of session transcript
  hint_used   BOOLEAN NOT NULL DEFAULT false,
  duration_s  INT,
  terminal_seconds INT,                                -- metered against free allowance
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cc_scene_attempts_user_scene_idx ON cc_scene_attempts (user_id, scene_id);

CREATE TABLE IF NOT EXISTS cc_predictions (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decision_point_id TEXT NOT NULL,
  case_id     TEXT NOT NULL,
  option_id   TEXT NOT NULL,
  quality     TEXT NOT NULL,                           -- denormalized from option for analytics
  matched_expert BOOLEAN NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, decision_point_id)
);

CREATE TABLE IF NOT EXISTS cc_review_queue (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type   TEXT NOT NULL CHECK (item_type IN ('scene', 'prediction', 'concept')),
  item_id     TEXT NOT NULL,                           -- scene id or decision_point id
  source      TEXT NOT NULL,                           -- 'scene_miss' | 'case_debrief' | 'prediction_miss'
  due_at      TIMESTAMPTZ NOT NULL,
  interval_idx INT NOT NULL DEFAULT 0,                  -- 0→+2d, 1→+5d, 2→+12d
  clean_count INT NOT NULL DEFAULT 0,                   -- retires at 2
  retired_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_type, item_id)
);
CREATE INDEX IF NOT EXISTS cc_review_queue_user_due_idx ON cc_review_queue (user_id, due_at) WHERE retired_at IS NULL;

CREATE TABLE IF NOT EXISTS cc_case_attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id     TEXT NOT NULL REFERENCES cc_cases(id),
  mode        TEXT NOT NULL DEFAULT 'standard' CHECK (mode IN ('standard', 'test_out')),
  status      TEXT NOT NULL CHECK (status IN ('in_progress', 'paused', 'filed', 'graded', 'failed', 'abandoned')),
  evidence    JSONB NOT NULL DEFAULT '{}'::jsonb,       -- {objective_id: {detected_at, transcript_span, method}}
  transcript_ref TEXT,
  resume_context TEXT,                                  -- compressed context injected on resume
  verdict     JSONB,                                    -- {cause, confidence, falsifiable_check}
  report      JSONB,                                    -- {narrative_md, chart_specs:[...], shared_slug?}
  diff        JSONB,                                    -- {matched:[], missed:[], extra:[], expert_moves_total}
  grade       JSONB,                                    -- grader skill output (analyst_v1-extended rubric)
  terminal_seconds INT NOT NULL DEFAULT 0,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  filed_at    TIMESTAMPTZ,
  graded_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS cc_case_attempts_user_case_idx ON cc_case_attempts (user_id, case_id);

-- Public share pages for filed case reports. A public-read policy for
-- `is_public = true` rows arrives later with the share route
-- (GET /api/casebook/reports/[slug]) — deliberately NOT added in this
-- migration, which stays owner-only per the RLS decision above.
CREATE TABLE IF NOT EXISTS cc_reports (
  slug        TEXT PRIMARY KEY,                         -- short random slug
  case_attempt_id UUID NOT NULL REFERENCES cc_case_attempts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot    JSONB NOT NULL,                            -- frozen report content (never re-reads attempt)
  og_image_path TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cc_user_lane_progress (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lane_key    TEXT NOT NULL,
  clean_scenes INT NOT NULL DEFAULT 0,
  total_scenes_attempted INT NOT NULL DEFAULT 0,
  level       TEXT NOT NULL DEFAULT 'new' CHECK (level IN ('new', 'training', 'fluent')),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lane_key)
);

CREATE TABLE IF NOT EXISTS cc_user_badges (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id    TEXT NOT NULL REFERENCES cc_tracks(id),
  awarded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, track_id)
);

-- RLS: these are user-state tables — owner-only, not the published-only
-- pattern used for content tables. Graders and other backend writers use the
-- service role, which bypasses RLS entirely. No DELETE policies are created
-- (rows are retired/soft-closed, not deleted by end users) and no
-- service-role policy is created (service role bypasses RLS already).
ALTER TABLE cc_scene_attempts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_predictions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_review_queue      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_case_attempts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_user_lane_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_user_badges       ENABLE ROW LEVEL SECURITY;

-- cc_scene_attempts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_scene_attempts' AND policyname = 'Users can read own cc_scene_attempts'
  ) THEN
    CREATE POLICY "Users can read own cc_scene_attempts"
      ON cc_scene_attempts FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_scene_attempts' AND policyname = 'Users can insert own cc_scene_attempts'
  ) THEN
    CREATE POLICY "Users can insert own cc_scene_attempts"
      ON cc_scene_attempts FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_scene_attempts' AND policyname = 'Users can update own cc_scene_attempts'
  ) THEN
    CREATE POLICY "Users can update own cc_scene_attempts"
      ON cc_scene_attempts FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- cc_predictions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_predictions' AND policyname = 'Users can read own cc_predictions'
  ) THEN
    CREATE POLICY "Users can read own cc_predictions"
      ON cc_predictions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_predictions' AND policyname = 'Users can insert own cc_predictions'
  ) THEN
    CREATE POLICY "Users can insert own cc_predictions"
      ON cc_predictions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_predictions' AND policyname = 'Users can update own cc_predictions'
  ) THEN
    CREATE POLICY "Users can update own cc_predictions"
      ON cc_predictions FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- cc_review_queue
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_review_queue' AND policyname = 'Users can read own cc_review_queue'
  ) THEN
    CREATE POLICY "Users can read own cc_review_queue"
      ON cc_review_queue FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_review_queue' AND policyname = 'Users can insert own cc_review_queue'
  ) THEN
    CREATE POLICY "Users can insert own cc_review_queue"
      ON cc_review_queue FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_review_queue' AND policyname = 'Users can update own cc_review_queue'
  ) THEN
    CREATE POLICY "Users can update own cc_review_queue"
      ON cc_review_queue FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- cc_case_attempts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_case_attempts' AND policyname = 'Users can read own cc_case_attempts'
  ) THEN
    CREATE POLICY "Users can read own cc_case_attempts"
      ON cc_case_attempts FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_case_attempts' AND policyname = 'Users can insert own cc_case_attempts'
  ) THEN
    CREATE POLICY "Users can insert own cc_case_attempts"
      ON cc_case_attempts FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_case_attempts' AND policyname = 'Users can update own cc_case_attempts'
  ) THEN
    CREATE POLICY "Users can update own cc_case_attempts"
      ON cc_case_attempts FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- cc_reports
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_reports' AND policyname = 'Users can read own cc_reports'
  ) THEN
    CREATE POLICY "Users can read own cc_reports"
      ON cc_reports FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_reports' AND policyname = 'Users can insert own cc_reports'
  ) THEN
    CREATE POLICY "Users can insert own cc_reports"
      ON cc_reports FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_reports' AND policyname = 'Users can update own cc_reports'
  ) THEN
    CREATE POLICY "Users can update own cc_reports"
      ON cc_reports FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- cc_user_lane_progress
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_user_lane_progress' AND policyname = 'Users can read own cc_user_lane_progress'
  ) THEN
    CREATE POLICY "Users can read own cc_user_lane_progress"
      ON cc_user_lane_progress FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_user_lane_progress' AND policyname = 'Users can insert own cc_user_lane_progress'
  ) THEN
    CREATE POLICY "Users can insert own cc_user_lane_progress"
      ON cc_user_lane_progress FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_user_lane_progress' AND policyname = 'Users can update own cc_user_lane_progress'
  ) THEN
    CREATE POLICY "Users can update own cc_user_lane_progress"
      ON cc_user_lane_progress FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- cc_user_badges
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_user_badges' AND policyname = 'Users can read own cc_user_badges'
  ) THEN
    CREATE POLICY "Users can read own cc_user_badges"
      ON cc_user_badges FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_user_badges' AND policyname = 'Users can insert own cc_user_badges'
  ) THEN
    CREATE POLICY "Users can insert own cc_user_badges"
      ON cc_user_badges FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_user_badges' AND policyname = 'Users can update own cc_user_badges'
  ) THEN
    CREATE POLICY "Users can update own cc_user_badges"
      ON cc_user_badges FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

COMMENT ON TABLE cc_scene_attempts IS 'Casebook Loop: one user attempt at a warm-up scene drill, with rubric verdict and terminal-seconds metering. Owner-only RLS.';
COMMENT ON TABLE cc_predictions IS 'Casebook Loop: a user''s prediction at a replay decision-point pause, denormalized quality + expert-match for analytics. Owner-only RLS.';
COMMENT ON TABLE cc_review_queue IS 'Casebook Loop: spaced-repetition queue for missed scenes/predictions/concepts, retires after 2 clean reps. Owner-only RLS.';
COMMENT ON TABLE cc_case_attempts IS 'Casebook Loop: one user attempt at a full live case, with evidence rail, verdict, report, move-diff, and grade. Owner-only RLS.';
COMMENT ON TABLE cc_reports IS 'Casebook Loop: frozen shareable snapshot of a filed case report, keyed by short slug. Owner-only RLS for now — a public-read policy for is_public = true rows arrives later with the share route (GET /api/casebook/reports/[slug]).';
COMMENT ON TABLE cc_user_lane_progress IS 'Casebook Loop: per-user, per-skill-lane mastery counters (clean scenes vs attempted) driving the new/training/fluent level. Owner-only RLS.';
COMMENT ON TABLE cc_user_badges IS 'Casebook Loop: track-completion badges awarded to a user. Owner-only RLS.';
