ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interview_meta JSONB DEFAULT '{}'::jsonb;
