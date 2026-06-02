-- Make claude_code_sessions host-agnostic.
--
-- The original schema (20260507120000) hard-coded Fly.io columns
-- (fly_machine_id, fly_app_name). The sandbox host is moving to GCP Cloud Run
-- behind a portable HostProvider abstraction, so the columns are renamed to
-- provider-neutral names and a wss_url column is added for the browser to
-- connect to the live session.
--
-- Rename is done defensively: only rename if the old column still exists, and
-- only add the new column if it does not. This keeps the migration idempotent
-- across environments where 20260507120000 may or may not have shipped the
-- Fly-named columns.

DO $$
BEGIN
  -- fly_machine_id -> host_instance_id (provider-specific instance/service id)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'claude_code_sessions' AND column_name = 'fly_machine_id'
  ) THEN
    ALTER TABLE claude_code_sessions RENAME COLUMN fly_machine_id TO host_instance_id;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'claude_code_sessions' AND column_name = 'host_instance_id'
  ) THEN
    ALTER TABLE claude_code_sessions ADD COLUMN host_instance_id text;
  END IF;

  -- fly_app_name -> host_app (provider-specific app/service grouping)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'claude_code_sessions' AND column_name = 'fly_app_name'
  ) THEN
    ALTER TABLE claude_code_sessions RENAME COLUMN fly_app_name TO host_app;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'claude_code_sessions' AND column_name = 'host_app'
  ) THEN
    ALTER TABLE claude_code_sessions ADD COLUMN host_app text;
  END IF;
END $$;

-- Which provider owns this session: 'cloud_run' | 'gke' | 'e2b' | 'fly'.
ALTER TABLE claude_code_sessions
  ADD COLUMN IF NOT EXISTS host_provider text NOT NULL DEFAULT 'cloud_run';

-- The wss endpoint the browser connects to for the live terminal.
ALTER TABLE claude_code_sessions
  ADD COLUMN IF NOT EXISTS wss_url text;

-- Soft TTL: the orchestrator reaper terminates sessions past this.
ALTER TABLE claude_code_sessions
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;
