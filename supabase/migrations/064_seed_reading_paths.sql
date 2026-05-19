-- 064_seed_reading_paths.sql
-- Seeds 3 curated reading paths from the FIRST_50_TOPICS queue.
-- Slugs must match story slugs in src/lib/autopsies/data.ts exactly.

-- 1. Retention Masterclass
INSERT INTO autopsy_reading_paths (id, slug, title, dek, cover_emoji) VALUES (
  'a1b2c3d4-0001-0001-0001-000000000001',
  'retention-masterclass',
  'The Retention Masterclass',
  'Seven decisions that turned one-time visitors into daily habits. Study these in order.',
  '🔁'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO autopsy_reading_path_items (path_id, company_slug, story_slug, position) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'spotify',   'spotify-wrapped',                1),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'duolingo',  'duolingo-streak',                2),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'netflix',   'netflix-are-you-still-watching', 3),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'youtube',   'youtube-autoplay',               4),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'facebook',  'facebook-birthday-reminders',    5),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'wordle',    'wordle-one-puzzle-a-day',        6),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'whatsapp',  'whatsapp-blue-ticks',            7)
ON CONFLICT DO NOTHING;

-- 2. Onboarding That Stuck
INSERT INTO autopsy_reading_paths (id, slug, title, dek, cover_emoji) VALUES (
  'a1b2c3d4-0002-0002-0002-000000000002',
  'onboarding-that-stuck',
  'Onboarding That Stuck',
  'Six first-day experiences that created lifelong users. Each one shipped a different kind of aha moment.',
  '🚪'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO autopsy_reading_path_items (path_id, company_slug, story_slug, position) VALUES
  ('a1b2c3d4-0002-0002-0002-000000000002', 'superhuman', 'superhuman-onboarding',        1),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'dropbox',    'dropbox-referral-program',     2),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'robinhood',  'robinhood-waitlist',           3),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'airbnb',     'airbnb-craigslist-hack',       4),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'slack',      'slack-origin-pivot',           5),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'buffer',     'buffer-fake-landing-page-mvp', 6)
ON CONFLICT DO NOTHING;

-- 3. Pricing Pivots
INSERT INTO autopsy_reading_paths (id, slug, title, dek, cover_emoji) VALUES (
  'a1b2c3d4-0003-0003-0003-000000000003',
  'pricing-pivots',
  'Pricing Pivots',
  'When free becomes a strategy and price signals intent. Five decisions that rewrote the unit economics.',
  '💰'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO autopsy_reading_path_items (path_id, company_slug, story_slug, position) VALUES
  ('a1b2c3d4-0003-0003-0003-000000000003', 'honey',     'honey-coupon-checkout',         1),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'gumroad',   'gumroad-creator-sell-flow',     2),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'unsplash',  'unsplash-free-photo-supply',    3),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'calendly',  'calendly-scheduling-link',      4),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'hotmail',   'hotmail-ps-i-love-you',         5)
ON CONFLICT DO NOTHING;
