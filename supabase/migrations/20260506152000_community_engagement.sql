-- ============================================================
-- Day-one community engagement primitives
-- Answer gallery, feedback trades, normalized reactions, badges,
-- weekly rooms, and activity feed.
-- ============================================================

CREATE TABLE IF NOT EXISTS community_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  attempt_id UUID REFERENCES challenge_attempts(id) ON DELETE SET NULL,
  display_mode TEXT NOT NULL DEFAULT 'anonymous'
    CHECK (display_mode IN ('anonymous', 'named')),
  status TEXT NOT NULL DEFAULT 'private'
    CHECK (status IN ('private', 'published', 'featured', 'hidden')),
  response_text TEXT NOT NULL DEFAULT '',
  excerpt TEXT NOT NULL DEFAULT '',
  lens_tag TEXT NOT NULL DEFAULT 'interesting_miss'
    CHECK (lens_tag IN ('metric-first', 'segment-first', 'tradeoff-aware', 'strong win', 'interesting miss')),
  score NUMERIC(5,2),
  hatch_summary TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (attempt_id),
  UNIQUE (user_id, challenge_id, attempt_id)
);

CREATE INDEX IF NOT EXISTS idx_community_submissions_gallery
  ON community_submissions(challenge_id, status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_submissions_user
  ON community_submissions(user_id, created_at DESC);

ALTER TABLE community_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own community submissions"
    ON community_submissions FOR ALL
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users view published community submissions"
    ON community_submissions FOR SELECT
    USING (status IN ('published', 'featured'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage community submissions"
    ON community_submissions FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER community_submissions_updated_at
    BEFORE UPDATE ON community_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS community_feedback_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES community_submissions(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  one_sharp_thing TEXT NOT NULL,
  one_question TEXT NOT NULL,
  suggested_rewrite TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (submission_id, reviewer_user_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_trades_reviewer_challenge
  ON community_feedback_trades(reviewer_user_id, challenge_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_trades_recipient
  ON community_feedback_trades(recipient_user_id, created_at DESC);

ALTER TABLE community_feedback_trades ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users create own feedback trades"
    ON community_feedback_trades FOR INSERT
    WITH CHECK ((select auth.uid()) = reviewer_user_id AND reviewer_user_id <> recipient_user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users view feedback they gave or received"
    ON community_feedback_trades FOR SELECT
    USING ((select auth.uid()) = reviewer_user_id OR (select auth.uid()) = recipient_user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins view feedback trades"
    ON community_feedback_trades FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS community_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL
    CHECK (target_type IN ('discussion', 'community_submission', 'feedback_trade')),
  target_id UUID NOT NULL,
  reaction_type TEXT NOT NULL
    CHECK (reaction_type IN (
      'upvote',
      'strong_win',
      'interesting_miss',
      'metric_hawk',
      'tradeoff_catcher',
      'clarity_builder'
    )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_community_reactions_target
  ON community_reactions(target_type, target_id, reaction_type);
CREATE INDEX IF NOT EXISTS idx_community_reactions_user
  ON community_reactions(user_id, created_at DESC);

ALTER TABLE community_reactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own community reactions"
    ON community_reactions FOR ALL
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users view community reactions"
    ON community_reactions FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO community_reactions (user_id, target_type, target_id, reaction_type, created_at)
SELECT voter_id, 'discussion', d.id, 'upvote', now()
FROM challenge_discussions d
CROSS JOIN LATERAL unnest(COALESCE(d.upvoted_by, '{}'::uuid[])) AS voter_id
ON CONFLICT (user_id, target_type, target_id, reaction_type) DO NOTHING;

CREATE TABLE IF NOT EXISTS community_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL
    CHECK (badge_key IN ('frame_sharpener', 'metric_hawk', 'tradeoff_catcher', 'clarity_builder')),
  source_type TEXT NOT NULL DEFAULT 'reaction'
    CHECK (source_type IN ('reaction', 'expert_pick', 'feedback_trade')),
  source_id UUID,
  source_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_key, source_type, source_id)
);

CREATE INDEX IF NOT EXISTS idx_community_badges_user
  ON community_badges(user_id, created_at DESC);

ALTER TABLE community_badges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users view own community badges"
    ON community_badges FOR SELECT
    USING ((select auth.uid()) = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage community badges"
    ON community_badges FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS weekly_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_challenge_id UUID REFERENCES cohort_challenges(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'standard'
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'warmup', 'standard', 'staff_plus')),
  move_tag TEXT CHECK (move_tag IN ('frame', 'list', 'optimize', 'win')),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  hatch_digest TEXT,
  curated_highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_rooms_active
  ON weekly_rooms(is_active, week_start DESC);

ALTER TABLE weekly_rooms ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users view weekly rooms"
    ON weekly_rooms FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage weekly rooms"
    ON weekly_rooms FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER weekly_rooms_updated_at
    BEFORE UPDATE ON weekly_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS activity_feed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN (
      'completed_challenge',
      'shared_answer',
      'earned_badge',
      'expert_picked_answer',
      'weekly_room_milestone',
      'feedback_trade'
    )),
  challenge_id TEXT REFERENCES challenges(id) ON DELETE SET NULL,
  submission_id UUID REFERENCES community_submissions(id) ON DELETE SET NULL,
  badge_key TEXT CHECK (badge_key IS NULL OR badge_key IN ('frame_sharpener', 'metric_hawk', 'tradeoff_catcher', 'clarity_builder')),
  display_mode TEXT NOT NULL DEFAULT 'anonymous'
    CHECK (display_mode IN ('anonymous', 'named')),
  headline TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  visibility TEXT NOT NULL DEFAULT 'authenticated'
    CHECK (visibility IN ('public', 'authenticated', 'private')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_events_visible
  ON activity_feed_events(visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_events_actor
  ON activity_feed_events(actor_user_id, created_at DESC);

ALTER TABLE activity_feed_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users view community activity feed"
    ON activity_feed_events FOR SELECT
    USING (visibility IN ('public', 'authenticated') OR (select auth.uid()) = actor_user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages community activity feed"
    ON activity_feed_events FOR ALL
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
