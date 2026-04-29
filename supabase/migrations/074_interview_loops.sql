-- supabase/migrations/074_interview_loops.sql

-- Parent loop container
CREATE TABLE IF NOT EXISTS interview_loops (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  target_company       TEXT,
  target_role          TEXT,
  status               TEXT NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft','active','paused','completed','abandoned')),
  round_order          TEXT[] NOT NULL DEFAULT '{}',
  current_round_index  INTEGER NOT NULL DEFAULT 0,
  cross_round_memory   JSONB NOT NULL DEFAULT '[]',
  loop_debrief_json    JSONB,
  started_at           TIMESTAMPTZ,
  completed_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-round rows
CREATE TABLE IF NOT EXISTS loop_rounds (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loop_id             UUID NOT NULL REFERENCES interview_loops(id) ON DELETE CASCADE,
  round_index         INTEGER NOT NULL,
  discipline          TEXT NOT NULL
                        CHECK (discipline IN ('product_sense','system_design','data_modeling','coding')),
  session_id          UUID REFERENCES live_interview_sessions(id),
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','active','paused','completed')),
  paused_at           TIMESTAMPTZ,
  resumed_at          TIMESTAMPTZ,
  pause_snapshot      JSONB,
  round_score         INTEGER,
  round_debrief_json  JSONB,
  context_injected    JSONB,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  UNIQUE (loop_id, round_index)
);

-- Additive columns on live_interview_sessions
ALTER TABLE live_interview_sessions
  ADD COLUMN IF NOT EXISTS loop_id             UUID REFERENCES interview_loops(id),
  ADD COLUMN IF NOT EXISTS round_index         INTEGER,
  ADD COLUMN IF NOT EXISTS prior_round_context JSONB;

-- Extend live_interview_sessions status to allow 'paused'
-- No existing CHECK constraint found, so we add one that covers all values
ALTER TABLE live_interview_sessions
  ADD CONSTRAINT live_interview_sessions_status_check
  CHECK (status IN ('active','paused','completed','abandoned'));

-- RLS
ALTER TABLE interview_loops ENABLE ROW LEVEL SECURITY;
ALTER TABLE loop_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own loops"
  ON interview_loops FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage rounds of own loops"
  ON loop_rounds FOR ALL
  USING (
    EXISTS (SELECT 1 FROM interview_loops WHERE id = loop_id AND user_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS interview_loops_user_id_idx ON interview_loops (user_id);
CREATE INDEX IF NOT EXISTS loop_rounds_loop_id_idx ON loop_rounds (loop_id);
CREATE INDEX IF NOT EXISTS live_interview_sessions_loop_id_idx ON live_interview_sessions (loop_id) WHERE loop_id IS NOT NULL;
