-- Durable failure diagnostics for Claude Code Analytics sessions.
--
-- "Sandbox failed to start" was an opaque catch-all: three distinct backend
-- failures (Cloud SQL wake timeout, LiteLLM gateway key-mint failure, Cloud Run
-- createSession failure) all wrote status='failed' with no reason, and the
-- client only read `status`. With Vercel log retention too short to catch the
-- failing step after the fact, the actual cause was unrecoverable. These columns
-- persist the failing step + a human reason on the row itself, so any failure is
-- diagnosable with a single query regardless of log retention.

ALTER TABLE claude_code_sessions
  ADD COLUMN IF NOT EXISTS failure_code text,
  ADD COLUMN IF NOT EXISTS failure_reason text;

COMMENT ON COLUMN claude_code_sessions.failure_code IS
  'Machine-readable failing step when status=failed: sql_wake_timeout | gateway_mint_failed | sandbox_create_failed.';
COMMENT ON COLUMN claude_code_sessions.failure_reason IS
  'Human-readable failure detail (server error/state) captured at markFailed time.';
