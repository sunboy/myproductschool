-- Casebook Loop — content tables (admin-authored, read-only for end users).
--
-- One authored "case" is cut into three surfaces: an annotated expert-session replay
-- with prediction pause-points, warm-up drills ("scenes") excised from its decision
-- points, and the full live case as the capstone. These 5 tables hold the authored
-- content; user progress/state lives in a separate migration (cc_scene_attempts,
-- cc_case_attempts, etc).
--
-- All ids are TEXT SLUGS (e.g. 'tuesday-dip'), never uuid — matches the rest of the
-- casebook schema and the API routes which validate ids as slugs, not uuids.
--
-- Strictly additive: CREATE TABLE IF NOT EXISTS only, no ALTER/DROP of any
-- pre-existing table. dev and prod share this database.

CREATE TABLE IF NOT EXISTS cc_tracks (
  id          TEXT PRIMARY KEY,                        -- 'funnel-forensics'
  title       TEXT NOT NULL,
  outcome_copy TEXT NOT NULL,                           -- "After this track you can run a funnel investigation end-to-end"
  ordinal     INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS cc_cases (
  id          TEXT PRIMARY KEY,                         -- 'tuesday-dip'
  track_id    TEXT REFERENCES cc_tracks(id),
  title       TEXT NOT NULL,
  hook        TEXT NOT NULL,                            -- one-sentence mystery
  brief_md    TEXT NOT NULL,
  difficulty  TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  est_minutes INT NOT NULL DEFAULT 45,
  warehouse_dataset TEXT NOT NULL,                      -- BigQuery dataset id, shared read-only
  objectives  JSONB NOT NULL,                           -- [{id, label, detector: {kind:'regex'|'llm', pattern|prompt}}]
  verdict_spec JSONB NOT NULL,                           -- expected cause tags + falsifiable-check requirement
  unlock_lane TEXT,                                     -- optional lane-mastery gate ('join-discipline')
  unlock_level TEXT,                                    -- 'training' | 'fluent'
  is_free     BOOLEAN NOT NULL DEFAULT false,           -- exactly one case true at launch
  is_published BOOLEAN NOT NULL DEFAULT false,
  ordinal     INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cc_expert_sessions (
  id          TEXT PRIMARY KEY,                         -- 'tuesday-dip-expert-v1'
  case_id     TEXT NOT NULL REFERENCES cc_cases(id),
  duration_s  INT NOT NULL,
  transcript  JSONB NOT NULL,                           -- [{t, role:'user'|'assistant'|'tool', text, annotation?:{title,body}}]
  moves       JSONB NOT NULL,                           -- [{id, t, label, description}] the reference move list for diffing
  decision_points JSONB NOT NULL,                       -- [{id, t, question, options:[{id,text,quality,explanation}], expert_option_id, expert_move_id}]
  is_published BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON COLUMN cc_expert_sessions.decision_points IS
  'Each option carries a quality tier reused from the autopsy system: best | good_but_incomplete | surface | plausible_wrong. NEVER an is_correct boolean — the system is multi-tier, not binary.';

CREATE TABLE IF NOT EXISTS cc_scenes (                  -- warm-up drills
  id          TEXT PRIMARY KEY,                         -- 'tuesday-dip-s1'
  case_id     TEXT NOT NULL REFERENCES cc_cases(id),
  ordinal     INT NOT NULL,
  title       TEXT NOT NULL,
  goal_md     TEXT NOT NULL,
  skill_lane  TEXT NOT NULL,                            -- fk-by-convention to cc_skill_lanes.key
  decision_point_id TEXT,                               -- which expert moment it's cut from
  preload     JSONB NOT NULL,                           -- {context_md, seed_transcript?, visible_tables:[...]}
  time_budget_s INT NOT NULL DEFAULT 300,
  rubric      JSONB NOT NULL,                           -- {required_moves:[{id,label,detector}], bonus_moves:[...], fail_conditions:[...]}
  is_published BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS cc_skill_lanes (
  key         TEXT PRIMARY KEY,                         -- 'driving-the-agent'
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  ordinal     INT NOT NULL
);

-- RLS: content tables are admin-authored; end users only ever SELECT published rows.
-- Writes are service-role only — no INSERT/UPDATE/DELETE policies are created here,
-- so the service role (which bypasses RLS) is the only writer.
ALTER TABLE cc_tracks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_cases           ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_expert_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_scenes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_skill_lanes     ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_tracks' AND policyname = 'Authenticated users can read published cc_tracks'
  ) THEN
    CREATE POLICY "Authenticated users can read published cc_tracks"
      ON cc_tracks FOR SELECT
      USING (auth.role() = 'authenticated' AND is_published = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_cases' AND policyname = 'Authenticated users can read published cc_cases'
  ) THEN
    CREATE POLICY "Authenticated users can read published cc_cases"
      ON cc_cases FOR SELECT
      USING (auth.role() = 'authenticated' AND is_published = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_expert_sessions' AND policyname = 'Authenticated users can read published cc_expert_sessions'
  ) THEN
    CREATE POLICY "Authenticated users can read published cc_expert_sessions"
      ON cc_expert_sessions FOR SELECT
      USING (auth.role() = 'authenticated' AND is_published = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_scenes' AND policyname = 'Authenticated users can read published cc_scenes'
  ) THEN
    CREATE POLICY "Authenticated users can read published cc_scenes"
      ON cc_scenes FOR SELECT
      USING (auth.role() = 'authenticated' AND is_published = true);
  END IF;
END $$;

-- cc_skill_lanes has no is_published column — it's a small fixed taxonomy, all rows
-- are readable by any authenticated user.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cc_skill_lanes' AND policyname = 'Authenticated users can read cc_skill_lanes'
  ) THEN
    CREATE POLICY "Authenticated users can read cc_skill_lanes"
      ON cc_skill_lanes FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

COMMENT ON TABLE cc_tracks IS 'Casebook Loop: a named sequence of cases with a shared skill outcome (e.g. funnel-forensics). Admin-authored, service-role write only.';
COMMENT ON TABLE cc_cases IS 'Casebook Loop: one authored investigation case (the content atom). Cut into a replay, warm-up scenes, and the full live case. Admin-authored, service-role write only.';
COMMENT ON TABLE cc_expert_sessions IS 'Casebook Loop: the annotated expert-session transcript for a case, used for the replay player, prediction pause-points, and move-diff grading. Admin-authored, service-role write only.';
COMMENT ON TABLE cc_scenes IS 'Casebook Loop: a warm-up drill excised from one decision point of a case''s expert session. Admin-authored, service-role write only.';
COMMENT ON TABLE cc_skill_lanes IS 'Casebook Loop: the fixed taxonomy of skill lanes (e.g. driving-the-agent) that scenes and lane-progress tracking key off of. Admin-authored, service-role write only.';
