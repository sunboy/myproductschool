-- Achievement definitions (seeded)
CREATE TABLE IF NOT EXISTS achievement_definitions (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text,
  xp_reward integer DEFAULT 0,
  criteria_type text CHECK (criteria_type IN ('challenge_count','streak_days','pattern_cleared','simulation_complete')),
  criteria_value integer
);

-- User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id text REFERENCES achievement_definitions(id),
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages achievements" ON user_achievements FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads achievement definitions" ON achievement_definitions FOR SELECT USING (true);

-- Seed definitions
INSERT INTO achievement_definitions (id, name, description, icon, xp_reward, criteria_type, criteria_value) VALUES
  ('first_challenge', 'First Step', 'Complete your first challenge', 'star', 50, 'challenge_count', 1),
  ('ten_challenges', 'Product Thinker', 'Complete 10 challenges', 'trophy', 200, 'challenge_count', 10),
  ('fifty_challenges', 'Product Architect', 'Complete 50 challenges', 'crown', 500, 'challenge_count', 50),
  ('week_streak', 'Consistent', 'Maintain a 7-day streak', 'flame', 150, 'streak_days', 7),
  ('month_streak', 'Dedicated', 'Maintain a 30-day streak', 'diamond', 500, 'streak_days', 30),
  ('first_simulation', 'In the Hot Seat', 'Complete your first interview simulation', 'mic', 200, 'simulation_complete', 1),
  ('pattern_cleared', 'Self-Aware', 'Improve a recurring failure pattern', 'eye', 300, 'pattern_cleared', 1)
ON CONFLICT (id) DO NOTHING;

-- Streak RPC function
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id uuid)
RETURNS void AS $$
DECLARE
  today date := CURRENT_DATE;
  yesterday date := CURRENT_DATE - 1;
  already_done boolean;
  had_yesterday boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM user_streaks WHERE user_id = p_user_id AND date = today) INTO already_done;
  IF already_done THEN RETURN; END IF;

  SELECT EXISTS(SELECT 1 FROM user_streaks WHERE user_id = p_user_id AND date = yesterday) INTO had_yesterday;

  INSERT INTO user_streaks (user_id, date, completed) VALUES (p_user_id, today, true);

  IF had_yesterday THEN
    UPDATE profiles SET streak_days = streak_days + 1, xp_total = xp_total + 10 WHERE id = p_user_id;
  ELSE
    UPDATE profiles SET streak_days = 1, xp_total = xp_total + 10 WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
