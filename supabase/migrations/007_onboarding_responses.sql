CREATE TABLE IF NOT EXISTS onboarding_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  role_context text CHECK (role_context IN ('engineer_pm_interview','engineer_on_job','both')),
  experience_level text CHECK (experience_level IN ('beginner','intermediate','advanced')),
  calibration_answers jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own onboarding" ON onboarding_responses FOR ALL USING (auth.uid() = user_id);

-- Add role_context to profiles for quick access
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role_context text;
