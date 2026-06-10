-- Public fit reports — the anonymous viral surface for CareerOps.
-- One row per anonymous run of the public /job-fit tool (job_fit or
-- resume_roast mode). Rows are read/written exclusively through the admin
-- client (RLS enabled, no policies). A signup with the matching claim cookie
-- copies the report into career_fit_evaluations and marks the row claimed.

CREATE TABLE IF NOT EXISTS public_fit_reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id         TEXT NOT NULL UNIQUE,
  claim_token_hash TEXT NOT NULL,
  mode             TEXT NOT NULL CHECK (mode IN ('job_fit','resume_roast')),
  company          TEXT,
  role_title       TEXT,
  jd_text          TEXT,
  resume_text      TEXT,
  score            NUMERIC,
  grade            TEXT,
  breakdown        JSONB,
  gaps             JSONB,
  readiness_map    JSONB,
  report_md        TEXT,
  roast            JSONB,
  include_score    BOOLEAN NOT NULL DEFAULT TRUE,
  ip_hash          TEXT,
  claimed_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_fit_reports_claim
  ON public_fit_reports(claim_token_hash) WHERE claimed_by IS NULL;

ALTER TABLE public_fit_reports ENABLE ROW LEVEL SECURITY;

-- Members' fit evaluations get the same public share surface.
ALTER TABLE career_fit_evaluations ADD COLUMN IF NOT EXISTS share_id TEXT UNIQUE;
