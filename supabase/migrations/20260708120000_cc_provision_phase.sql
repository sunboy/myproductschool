-- Cold-start UX: expose provisioning sub-phase + failure code to the client.
--
-- The client renders staged progress (waking database → starting gateway →
-- booting sandbox → ready) and silently retries known-cold failures. Both need
-- server truth, so provisionSession stamps the furthest phase reached and, on
-- failure, the failure code onto the session row; the /state route returns them.
--
-- Additive + nullable, no defaults/constraints: dev and prod share this DB, so
-- the migration goes live for currently-deployed prod code the moment it lands.
-- A plain nullable add is safe there — existing writes are unaffected (the column
-- is simply null until the new code writes it).

alter table public.claude_code_sessions
  add column if not exists provision_phase text,
  add column if not exists failure_code text;

comment on column public.claude_code_sessions.provision_phase is
  'Furthest provisioning phase reached (waking_database|starting_gateway|booting_sandbox|ready). Null before provisioning writes it. Rendered as staged startup progress; monotonic (never steps back).';
comment on column public.claude_code_sessions.failure_code is
  'Provision failure code when status=failed (sql_wake_timeout|gateway_key_mint|create_session|readiness_timeout). Drives the client''s silent cold-start retry (only sql_wake_timeout / gateway_key_mint are retried).';
