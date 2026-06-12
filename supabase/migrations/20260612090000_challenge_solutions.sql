-- Challenge solutions: one editorial solution document per challenge.
-- Content is a versioned JSONB blob (see src/lib/solutions/schema.ts for the
-- canonical shape): overview, 1-4 approaches (markdown + optional code,
-- complexity, diagram spec, tradeoffs), an AI-collaboration section, and
-- key takeaways. Generated once (backfill sub-agents or lazy runtime
-- generation) and then served read-only.

CREATE TABLE IF NOT EXISTS challenge_solutions (
  challenge_id TEXT PRIMARY KEY REFERENCES challenges(id) ON DELETE CASCADE,
  schema_version INT NOT NULL DEFAULT 1,
  content JSONB,                          -- null until generation succeeds
  generation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (generation_status IN ('pending', 'generating', 'ready', 'failed')),
  generation_started_at TIMESTAMPTZ,      -- stale-lock reclaim anchor for lazy generation
  generation_error TEXT,
  generated_by TEXT,                      -- 'backfill' | 'lazy'
  model TEXT,                             -- e.g. 'claude-sonnet-4-6' or 'claude-code-subagent'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE challenge_solutions ENABLE ROW LEVEL SECURITY;

-- Intentionally NO RLS policies. Solutions are gated (attempt-or-Pro) and the
-- gate is enforced in the API routes, which read/write through the
-- service-role client AFTER the entitlement check. With RLS enabled and no
-- policies, anon/authenticated PostgREST access is denied outright, so locked
-- content can never leak around the API.
