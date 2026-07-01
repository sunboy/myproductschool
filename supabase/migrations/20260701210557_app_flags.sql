-- app_flags: minimal generic runtime config table for boolean/JSON feature
-- flags read live by the server (no deploy needed to flip). Modeled on the
-- plan_limits pattern (see 046_paywall_usage.sql + /admin/paywall-config):
-- a small backend-configurable table + a cached server-side reader.
--
-- First consumer: onboarding_value_first (see src/lib/config/app-flags.ts).
-- Admin can flip via direct SQL/dashboard update until a dedicated admin UI
-- exists — the read path (getAppFlag) is what matters for the growth test.

CREATE TABLE IF NOT EXISTS app_flags (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_flags (key, value) VALUES
  ('onboarding_value_first', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE app_flags ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read flags (client-side gating reads via a thin
-- API route using the admin client, but keep RLS permissive+safe in case a
-- future surface reads this table directly with the anon/user client).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'app_flags' AND policyname = 'Authenticated users can read app_flags'
  ) THEN
    CREATE POLICY "Authenticated users can read app_flags"
      ON app_flags FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

COMMENT ON TABLE app_flags IS 'Generic runtime feature-flag/config store, key -> jsonb value. Service role writes; authenticated reads.';
