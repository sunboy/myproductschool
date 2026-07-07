-- Widen the hatch_context context_type CHECK to include the types the code
-- actually writes and reads. The calibration submit route writes
-- 'interview_date' and 'target_company', and the context composer in
-- src/lib/notes/embeddings.ts reads 'interview_date' and 'notes_summary' —
-- all rejected by the v2 constraint since the 019 → v2 table migration
-- (found by the 2026-07-04 vector audit; every such insert failed silently).
-- Additive only: the new set is a strict superset of the old one.

ALTER TABLE public.hatch_context
  DROP CONSTRAINT IF EXISTS luma_context_v2_context_type_check;

ALTER TABLE public.hatch_context
  ADD CONSTRAINT luma_context_v2_context_type_check CHECK (context_type IN (
    'calibration', 'challenge_insight', 'weakness_alert',
    'streak_note', 'plan_progress', 'role_observation',
    'interview_date', 'target_company', 'notes_summary'
  ));
