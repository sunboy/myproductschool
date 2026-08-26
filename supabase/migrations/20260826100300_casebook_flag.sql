-- Casebook lab feature flag (Phase 0). Gates all Casebook lab surfaces once
-- they land; the lab itself is NOT built in this phase. Ships dark: default
-- value is 'false' so no user-visible behavior changes until a later phase
-- flips it on (mirrors lab_debugging's accessFlag mechanism, see
-- src/lib/labs/server.ts + src/lib/config/app-flags.ts).
--
-- Strictly additive: no table/column/policy changes, only a row insert.

INSERT INTO app_flags (key, value) VALUES
  ('lab_casebook', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
