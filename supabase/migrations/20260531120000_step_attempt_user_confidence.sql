-- Persist the learner's self-reported confidence per question answer.
-- 0-3 index into CONF_LABELS = ['Guessing','Not sure','Fairly sure','Rock solid'].
-- Distinct from grading_confidence (the grader's confidence in its own score).
-- Previously collected in the UI but dropped on submit; the FLOW step batch
-- submit now stores it so calibration analytics can use it.

ALTER TABLE step_attempts
  ADD COLUMN IF NOT EXISTS confidence smallint NULL
  CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 3));

COMMENT ON COLUMN step_attempts.confidence IS
  'Learner self-reported confidence, 0-3 index (Guessing/Not sure/Fairly sure/Rock solid). Null if not rated.';
