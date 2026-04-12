-- Live interview sessions table
CREATE TABLE IF NOT EXISTS live_interview_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id            TEXT,
  role_id               TEXT NOT NULL DEFAULT 'PM',
  status                TEXT NOT NULL DEFAULT 'active', -- active | completed | abandoned
  started_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at              TIMESTAMPTZ,
  duration_seconds      INTEGER,
  system_prompt         TEXT,
  calibration_snapshot  JSONB NOT NULL DEFAULT '{}',
  debrief_json          JSONB,
  flow_coverage         JSONB NOT NULL DEFAULT '{"frame":0,"list":0,"optimize":0,"win":0}',
  total_turns           INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE live_interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own live sessions"
  ON live_interview_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_live_sessions_user ON live_interview_sessions(user_id, created_at DESC);

-- Live interview turns table
CREATE TABLE IF NOT EXISTS live_interview_turns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES live_interview_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL, -- 'luma' | 'user'
  content     TEXT NOT NULL,
  turn_index  INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE live_interview_turns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own live turns"
  ON live_interview_turns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM live_interview_sessions s
      WHERE s.id = live_interview_turns.session_id
        AND s.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_live_turns_session ON live_interview_turns(session_id, turn_index);

-- Company profiles for live interview personas
CREATE TABLE IF NOT EXISTS company_profiles (
  id                       TEXT PRIMARY KEY,
  name                     TEXT NOT NULL,
  icon                     TEXT NOT NULL DEFAULT 'corporate_fare',
  roles                    TEXT[] NOT NULL DEFAULT '{}',
  interview_persona_prompt TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company profiles are public read"
  ON company_profiles FOR SELECT USING (true);
