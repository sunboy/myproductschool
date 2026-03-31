ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS dashboard_card_sizes JSONB DEFAULT '{}'::jsonb;
