-- Theme-based domains for the explore page.
--
-- The `domains` table previously held only 2 rows (product-strategy,
-- metrics-analytics), covering ~8% of published challenges. Domains are meant
-- to be a theme axis ("what is this about") distinct from challenge_type
-- ("what format is it", already surfaced on the practice page). This seeds the
-- full canonical set defined in src/lib/data/taxonomy.ts (DOMAINS) so every
-- published challenge can be classified into one.
--
-- Idempotent: upserts on the unique `slug`. Existing rows keep their id; their
-- title/description/icon/order_index are refreshed to the canonical values.
-- New rows use stable ids in the existing d0000001-...-000N pattern so the
-- classifier backfill can resolve slugs to ids deterministically.

INSERT INTO domains (id, slug, title, description, icon, order_index, is_published)
VALUES
  ('d0000001-0000-0000-0000-000000000001', 'product-strategy',   'Product Strategy',            'Positioning, bets, and long-term direction.',                         'map',                   1, true),
  ('d0000001-0000-0000-0000-000000000002', 'metrics-analytics',  'Metrics & Analytics',         'Defining success, instrumentation, and reading the numbers.',         'query_stats',           2, true),
  ('d0000001-0000-0000-0000-000000000003', 'ai-agents',          'AI Agents',                   'Autonomous systems, tool use, orchestration, and agent memory.',      'smart_toy',             3, true),
  ('d0000001-0000-0000-0000-000000000004', 'llms',               'LLMs & Prompting',            'Model internals, prompting, RAG, evaluation, and serving.',           'network_intelligence',  4, true),
  ('d0000001-0000-0000-0000-000000000005', 'conversions-growth', 'Conversions & Growth',        'Acquisition, activation, retention, and monetization loops.',         'trending_up',           5, true),
  ('d0000001-0000-0000-0000-000000000006', 'system-design',      'System Design',               'Scalable architecture, reliability, and distributed systems.',        'lan',                   6, true),
  ('d0000001-0000-0000-0000-000000000007', 'databases-data',     'Databases & Data',            'Data modeling, SQL, storage, and query design.',                      'database',              7, true),
  ('d0000001-0000-0000-0000-000000000008', 'algorithms',         'Algorithms & Data Structures','Core algorithmic problem solving and complexity.',                    'account_tree',          8, true)
ON CONFLICT (slug) DO UPDATE SET
  title        = EXCLUDED.title,
  description  = EXCLUDED.description,
  icon         = EXCLUDED.icon,
  order_index  = EXCLUDED.order_index,
  is_published = EXCLUDED.is_published;
