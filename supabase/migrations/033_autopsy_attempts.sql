-- Migration 033: autopsy_attempts — tracks showcase challenge submissions
CREATE TABLE autopsy_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_slug TEXT NOT NULL,
  decision_index INTEGER NOT NULL,
  selected_option_label TEXT NOT NULL,
  points INTEGER CHECK (points BETWEEN 0 AND 3),
  grade_label TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, product_slug, decision_index)
);

ALTER TABLE autopsy_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own attempts"
  ON autopsy_attempts
  FOR ALL
  USING (auth.uid() = user_id);
