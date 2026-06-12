-- Raise free tier: 20 challenge starts + 5 AI interview starts per rolling 30d.
-- Supersedes 20260527120000_lock_free_quota_3_1.sql.

UPDATE plan_limits SET limit_value = 20, description = 'Free challenge starts per rolling month'
  WHERE plan = 'free' AND feature = 'challenges';

UPDATE plan_limits SET limit_value = 5, description = 'Free AI interview starts per rolling month'
  WHERE plan = 'free' AND feature = 'interviews';
