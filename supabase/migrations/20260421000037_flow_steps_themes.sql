-- Add intellectual theme columns to flow_steps
ALTER TABLE flow_steps
  ADD COLUMN IF NOT EXISTS theme TEXT,
  ADD COLUMN IF NOT EXISTS theme_name TEXT;
