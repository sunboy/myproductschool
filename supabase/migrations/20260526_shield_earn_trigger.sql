-- Migration: Shield earn trigger
--
-- Patches update_user_streak so that hitting a 7-day milestone
-- (streak_days % 7 = 0) auto-grants +1 streak_shield_count, capped at 3.
--
-- Builds on 042_xp_streak_rpc_fix.sql (latest version of the RPC).

CREATE OR REPLACE FUNCTION update_user_streak(p_user_id uuid)
RETURNS void AS $$
DECLARE
  today date := CURRENT_DATE;
  yesterday date := CURRENT_DATE - 1;
  already_done boolean;
  had_yesterday boolean;
  v_new_streak int;
  v_shield_count int;
BEGIN
  SELECT EXISTS(SELECT 1 FROM user_streaks WHERE user_id = p_user_id AND date = today) INTO already_done;
  IF already_done THEN RETURN; END IF;

  SELECT EXISTS(SELECT 1 FROM user_streaks WHERE user_id = p_user_id AND date = yesterday) INTO had_yesterday;

  INSERT INTO user_streaks (user_id, date, completed) VALUES (p_user_id, today, true);

  IF had_yesterday THEN
    UPDATE profiles SET streak_days = streak_days + 1 WHERE id = p_user_id
    RETURNING streak_days INTO v_new_streak;
  ELSE
    UPDATE profiles SET streak_days = 1 WHERE id = p_user_id
    RETURNING streak_days INTO v_new_streak;
  END IF;

  -- Grant a shield at every 7-day milestone (mod 7 = 0), cap at 3
  IF v_new_streak % 7 = 0 THEN
    SELECT streak_shield_count INTO v_shield_count FROM profiles WHERE id = p_user_id;
    IF v_shield_count < 3 THEN
      UPDATE profiles SET streak_shield_count = streak_shield_count + 1 WHERE id = p_user_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
