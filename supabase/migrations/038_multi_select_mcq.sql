-- Multi-select MCQ support
-- allow_multiple on step_questions opts a question into checkbox mode
-- selected_option_ids on step_attempts stores the array for multi-select answers

ALTER TABLE step_questions
  ADD COLUMN IF NOT EXISTS allow_multiple BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE step_attempts
  ADD COLUMN IF NOT EXISTS selected_option_ids TEXT[] DEFAULT NULL;
