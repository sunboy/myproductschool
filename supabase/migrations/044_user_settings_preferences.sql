-- Add learning preference columns to user_settings
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS flow_focus TEXT DEFAULT 'List',
  ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'Mixed',
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata';
