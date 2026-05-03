-- 079_competency_signal_rename.sql
--
-- Rename `step_attempts.competency_signal.primary` → `competency` so it matches
-- the per-item shape used by `live_interview_sessions.debrief_json.competencySignals[]`.
-- Idempotent: only updates rows that still have `primary` and don't already have `competency`.

UPDATE step_attempts
SET competency_signal =
  (competency_signal - 'primary')
  || jsonb_build_object('competency', competency_signal->'primary')
WHERE competency_signal ? 'primary'
  AND NOT (competency_signal ? 'competency');
