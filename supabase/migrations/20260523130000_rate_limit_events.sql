-- Rate limiting table — sliding window counter per user
CREATE TABLE IF NOT EXISTS rate_limit_events (
  id          bigserial PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for the sliding window query (user + time range lookup)
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_user_created
  ON rate_limit_events (user_id, created_at DESC);

-- Row-level security — users cannot read or write other users' events
ALTER TABLE rate_limit_events ENABLE ROW LEVEL SECURITY;
-- The server client uses the service role which bypasses RLS automatically.
-- No policies are needed for service-role-only access.
