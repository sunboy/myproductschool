-- Casebook Loop — persist the expert session's extracted SQL queries.
--
-- WHY
-- `scripts/casebook/annotate-session.ts` extracts every SQL statement the expert
-- ran into a `queries[]` array on the cc_expert_sessions row shape. That array is
-- load-bearing, not scratch:
--   * validate-case.ts TIME_BOMBS scans it for relative-date expressions
--     (CURRENT_DATE / NOW() / date('now')) that would drift on rerun.
--   * validate-case.ts WAREHOUSE re-executes each query against the seed
--     warehouse and diffs it against the stored `expected_rows`. This is the
--     Phase 1 exit criterion ("expert transcript queries reproduce").
-- The original casebook_content migration predates a real annotated session, so
-- the column was never added and publish-case.ts failed on upsert.
--
-- Phase 4 move-diff grading is expected to compare a learner's SQL against the
-- expert's, so the queries are persisted alongside the session rather than
-- dropped at publish time.
--
-- Shape (per element):
--   { t: int seconds from session start,
--     sql: string (VERBATIM — time-bomb scanning and reproduction depend on it),
--     nondeterministic_order: boolean (true when the query has no ORDER BY),
--     expected_rows?: object[] (real result set, used to verify reproduction),
--     failed_in_session?: boolean (query genuinely errored during the recording;
--       reported by the validator, never silently skipped, and never removed
--       from the array because TIME_BOMBS coverage must stay complete) }
--
-- Additive and nullable: existing rows keep NULL, no backfill required.

ALTER TABLE cc_expert_sessions
  ADD COLUMN IF NOT EXISTS queries JSONB;

COMMENT ON COLUMN cc_expert_sessions.queries IS
  'Extracted expert SQL: [{t, sql, nondeterministic_order, expected_rows?, failed_in_session?}]. SQL is stored verbatim — validate-case.ts scans it for date time bombs and re-runs it against the seed warehouse to prove the case still reproduces. A query that failed in-session is kept and flagged, never deleted.';
