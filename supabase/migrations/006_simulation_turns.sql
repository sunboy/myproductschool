CREATE TABLE IF NOT EXISTS simulation_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES simulation_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'luma')),
  content text NOT NULL,
  turn_index integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS simulation_turns_session_idx ON simulation_turns(session_id, turn_index);

ALTER TABLE simulation_turns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own simulation turns" ON simulation_turns FOR SELECT
  USING (session_id IN (SELECT id FROM simulation_sessions WHERE user_id = auth.uid()));
CREATE POLICY "Service role manages simulation turns" ON simulation_turns FOR ALL USING (auth.role() = 'service_role');

-- Add status and debrief columns to simulation_sessions if not exists
ALTER TABLE simulation_sessions ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active','completed'));
ALTER TABLE simulation_sessions ADD COLUMN IF NOT EXISTS debrief_json jsonb;
ALTER TABLE simulation_sessions ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE simulation_sessions ADD COLUMN IF NOT EXISTS challenge_prompt_id uuid REFERENCES challenge_prompts(id);
