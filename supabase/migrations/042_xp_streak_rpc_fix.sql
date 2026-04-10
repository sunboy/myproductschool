-- Migration 042: Remove flat 10 XP from update_user_streak RPC
--
-- XP is now awarded by the challenge completion route using a difficulty-based
-- formula with streak multiplier. The RPC only tracks streak days now.
-- See: src/app/api/challenges/[id]/complete/route.ts

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
    UPDATE profiles SET streak_days = streak_days + 1 WHERE id = p_user_id;
  ELSE
    UPDATE profiles SET streak_days = 1 WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
