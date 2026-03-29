-- Add upvoted_by array to track unique voters
ALTER TABLE challenge_discussions
  ADD COLUMN IF NOT EXISTS upvoted_by uuid[] DEFAULT '{}';

-- Add denormalized reply_count
ALTER TABLE challenge_discussions
  ADD COLUMN IF NOT EXISTS reply_count int DEFAULT 0;

-- Trigger to keep reply_count in sync
CREATE OR REPLACE FUNCTION sync_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE challenge_discussions
    SET reply_count = (SELECT COUNT(*) FROM discussion_replies WHERE discussion_id = COALESCE(NEW.discussion_id, OLD.discussion_id))
  WHERE id = COALESCE(NEW.discussion_id, OLD.discussion_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_reply_count ON discussion_replies;
CREATE TRIGGER trg_sync_reply_count
  AFTER INSERT OR DELETE ON discussion_replies
  FOR EACH ROW EXECUTE FUNCTION sync_reply_count();

-- Allow upvote updates
DROP POLICY IF EXISTS "Users can upvote discussions" ON challenge_discussions;
CREATE POLICY "Users can upvote discussions" ON challenge_discussions
  FOR UPDATE USING (true) WITH CHECK (true);
