-- Add challenge_id to autopsy_challenges so each autopsy maps to a real v2 challenge row
ALTER TABLE autopsy_challenges
  ADD COLUMN IF NOT EXISTS challenge_id TEXT REFERENCES challenges(id);
