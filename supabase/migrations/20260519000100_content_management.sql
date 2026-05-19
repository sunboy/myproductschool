-- supabase/migrations/035_content_management.sql

CREATE TABLE IF NOT EXISTS generation_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  input_type    text NOT NULL CHECK (input_type IN ('url', 'text', 'question')),
  input_raw     text NOT NULL,
  scraped_text  text,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','scraping','generating','review','published','failed')),
  mode          text NOT NULL DEFAULT 'local' CHECK (mode IN ('local','api')),
  result_challenge_id text REFERENCES challenges(id) ON DELETE SET NULL,
  error_message text,
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS draft_challenges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          uuid UNIQUE REFERENCES generation_jobs(id) ON DELETE CASCADE,
  challenge_json  jsonb NOT NULL,
  review_status   text NOT NULL DEFAULT 'pending_review'
                  CHECK (review_status IN ('pending_review','approved','rejected')),
  step_approvals  jsonb NOT NULL DEFAULT '{}',
  reviewer_notes  text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS generation_jobs_status_idx ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS generation_jobs_created_at_idx ON generation_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS draft_challenges_job_id_idx ON draft_challenges(job_id);

-- RLS: only admins and service role can access these tables
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_challenges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "generation_jobs_service" ON generation_jobs
    FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "draft_challenges_service" ON draft_challenges
    FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- updated_at triggers (function update_updated_at() already exists from 001_initial_schema.sql)
DO $$ BEGIN
  CREATE TRIGGER generation_jobs_updated_at
    BEFORE UPDATE ON generation_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER draft_challenges_updated_at
    BEFORE UPDATE ON draft_challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
