-- Migration 072: Coding Subquestions — extend schema for multi-part coding challenges
-- Reuses the FLOW shape (flow_steps / step_questions / step_attempts) to support
-- coding challenges with multiple subquestions under a shared context.
-- A coding challenge gets a single flow_steps row (step='coding') with 1..N step_questions.
-- Backwards compatible: coding challenges with no flow_steps row stay on the single-prompt path.
-- Idempotent: safe to re-run.

-- 1. Extend flow_steps.step CHECK to include 'coding'
ALTER TABLE flow_steps DROP CONSTRAINT IF EXISTS flow_steps_step_check;
ALTER TABLE flow_steps ADD CONSTRAINT flow_steps_step_check
  CHECK (step IN ('frame','list','optimize','win','coding'));

-- 2. Extend step_questions.response_type CHECK to include 'coding_subtask'
ALTER TABLE step_questions DROP CONSTRAINT IF EXISTS step_questions_response_type_check;
ALTER TABLE step_questions ADD CONSTRAINT step_questions_response_type_check
  CHECK (response_type IN ('pure_mcq','mcq_plus_elaboration','modified_option','freeform','coding_subtask'));

-- 3. Add coding-specific columns to step_questions
--    coding_test_case_ids: JSONB array of test case IDs (keys from challenges.metadata.test_cases)
--                          scoping which test cases belong to this subquestion
--    coding_starter_code:  JSONB map of language -> starter code string for this subtask
--    coding_subtask_prompt: markdown body for this subtask (the per-part problem statement)
ALTER TABLE step_questions
  ADD COLUMN IF NOT EXISTS coding_test_case_ids JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS coding_starter_code JSONB,
  ADD COLUMN IF NOT EXISTS coding_subtask_prompt TEXT;

-- 4. Add coding-specific columns to step_attempts
--    coding_final_code:     the user's submitted code for this subtask
--    coding_final_language: the language used (e.g. 'python', 'javascript', 'sql')
--    coding_test_results:   JSONB snapshot of per-test-case pass/fail results at submit time
ALTER TABLE step_attempts
  ADD COLUMN IF NOT EXISTS coding_final_code TEXT,
  ADD COLUMN IF NOT EXISTS coding_final_language TEXT,
  ADD COLUMN IF NOT EXISTS coding_test_results JSONB;

-- 5. Extend step_attempts.step CHECK to include 'coding'
--    (step_attempts.step mirrors the flow_steps.step that the attempt belongs to)
ALTER TABLE step_attempts DROP CONSTRAINT IF EXISTS step_attempts_step_check;
ALTER TABLE step_attempts ADD CONSTRAINT step_attempts_step_check
  CHECK (step IN ('frame','list','optimize','win','coding'));

-- 6. Extend step_attempts.response_type CHECK to include 'coding_subtask'
ALTER TABLE step_attempts DROP CONSTRAINT IF EXISTS step_attempts_response_type_check;
ALTER TABLE step_attempts ADD CONSTRAINT step_attempts_response_type_check
  CHECK (response_type IN ('pure_mcq','mcq_plus_elaboration','modified_option','freeform','coding_subtask'));
