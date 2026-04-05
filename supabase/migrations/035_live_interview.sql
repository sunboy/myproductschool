-- Add interview persona columns to company_profiles
ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS interview_persona_prompt TEXT,
  ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['PM','SWE','Data Engineer','ML Engineer'];

-- Live interview sessions table
CREATE TABLE IF NOT EXISTS live_interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  company_id UUID REFERENCES company_profiles(id),
  role_id TEXT NOT NULL DEFAULT 'swe' CHECK (role_id IN ('PM', 'SWE', 'Data Engineer', 'ML Engineer')),
  status TEXT CHECK (status IN ('pending','active','completed','abandoned')) DEFAULT 'pending',
  system_prompt TEXT,
  calibration_snapshot JSONB,
  flow_coverage JSONB DEFAULT '{"frame":0,"list":0,"optimize":0,"win":0}',
  debrief_json JSONB,
  total_turns INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Per-turn transcript + signals
CREATE TABLE IF NOT EXISTS live_interview_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES live_interview_sessions(id) ON DELETE CASCADE,
  turn_index INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('luma','user')),
  content TEXT NOT NULL,
  flow_move_detected TEXT CHECK (flow_move_detected IN ('frame','list','optimize','win')),
  competency_signals JSONB,
  score_delta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_interview_sessions_user ON live_interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_live_interview_turns_session ON live_interview_turns(session_id, turn_index);

-- Row Level Security
ALTER TABLE live_interview_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_own" ON live_interview_sessions
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "sessions_service" ON live_interview_sessions
  FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE live_interview_turns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "turns_own" ON live_interview_turns
  FOR ALL USING (
    session_id IN (SELECT id FROM live_interview_sessions WHERE user_id = auth.uid())
  );
CREATE POLICY "turns_service" ON live_interview_turns
  FOR ALL USING (auth.role() = 'service_role');
