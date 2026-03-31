-- Add response_type to step_questions (missed during 024 because table already existed)
ALTER TABLE step_questions
  ADD COLUMN IF NOT EXISTS response_type TEXT NOT NULL DEFAULT 'pure_mcq'
    CHECK (response_type IN ('pure_mcq', 'mcq_plus_elaboration', 'modified_option', 'freeform'));

-- Also copy to worktree
