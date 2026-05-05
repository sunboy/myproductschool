-- Seed 4 published study plans — one per FLOW move
-- These are used for personalized plan routing after calibration

INSERT INTO study_plans (id, title, slug, description, move_tag, challenge_count, estimated_hours, is_published)
VALUES
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567801',
    'Frame Like a PM',
    'frame-like-a-pm',
    'Master problem framing — the upstream skill that determines whether everything else is worth building. Six challenges that drill root-cause thinking, scope definition, and the art of asking the right question.',
    'frame',
    6,
    3.5,
    true
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567802',
    'The List Move',
    'the-list-move',
    'Build the habit of structured option generation. You''ll practice mapping full solution spaces, uncovering second-order effects, and presenting options that make trade-offs visible.',
    'list',
    6,
    3.5,
    true
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567803',
    'Optimize Under Pressure',
    'optimize-under-pressure',
    'Real trade-offs under real constraints. Six challenges focused on naming the criterion, making the sacrifice explicit, and choosing with confidence when resources are limited.',
    'optimize',
    6,
    3.5,
    true
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567804',
    'Win the Room',
    'win-the-room',
    'The hardest move: landing a recommendation that sticks. Practice building falsifiable hypotheses, owning decisions under ambiguity, and communicating with executive precision.',
    'win',
    6,
    3.5,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  move_tag = EXCLUDED.move_tag,
  challenge_count = EXCLUDED.challenge_count,
  estimated_hours = EXCLUDED.estimated_hours,
  is_published = EXCLUDED.is_published;
