-- Idle reaper + resume support for Claude Code Analytics sessions.
--
-- last_activity_at: refreshed by the /state poll, an activity heartbeat, and
--   each 30s autosave. The server reaper frees the pinned Cloud Run instance of
--   any `active` session whose activity is stale (independent of the 30-min TTL),
--   without losing work (the workspace autosaves every 30s).
--
-- The latest workspace snapshot pointer is the EXISTING `transcript_uri` column
-- (the snapshot route overwrites it with the newest tarball path each loop), so
-- resume reuses that — no separate column needed.

ALTER TABLE claude_code_sessions
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now();

-- The reaper sweeps active sessions ordered by staleness.
CREATE INDEX IF NOT EXISTS idx_ccs_active_activity
  ON claude_code_sessions (last_activity_at)
  WHERE status = 'active';
