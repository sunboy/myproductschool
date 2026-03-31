-- Migration 016: Add scaffold_options to challenge_steps
-- Pre-generated Claude scaffold sentence starters for each FLOW step

ALTER TABLE challenge_steps
  ADD COLUMN IF NOT EXISTS scaffold_options text[] DEFAULT '{}';
