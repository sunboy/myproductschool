-- ============================================================
-- Migration 083: Taxonomy Overhaul — Seed Data
--
-- Part 2 of 2 (see 082 for schema changes).
--
-- Populates:
-- 1. topics   — 64 entries matching TOPICS in src/lib/data/taxonomy.ts
-- 2. techniques — 50 entries matching TECHNIQUES in src/lib/data/taxonomy.ts
-- 3. company_profiles — aliases + interview_loop_disciplines for 30 companies
--
-- Slug source of truth: src/lib/data/taxonomy.ts
-- Discipline values: coding | system_design | data_modeling | sql | product_sense | ai_engineering
-- ============================================================


-- ============================================================
-- STEP 1: Seed topics
-- ============================================================
-- Uses ON CONFLICT DO NOTHING so re-running is safe.
-- Updates discipline + parent_slug on existing rows if slug already exists.
-- ============================================================

BEGIN;

INSERT INTO topics (slug, label, discipline) VALUES

  -- coding (14)
  ('arrays',             'Arrays',               'coding'),
  ('strings',            'Strings',              'coding'),
  ('hash-tables',        'Hash Tables',          'coding'),
  ('linked-lists',       'Linked Lists',         'coding'),
  ('trees',              'Trees',                'coding'),
  ('graphs',             'Graphs',               'coding'),
  ('heap',               'Heap / Priority Queue','coding'),
  ('stack-queue',        'Stack & Queue',        'coding'),
  ('dynamic-programming','Dynamic Programming',  'coding'),
  ('greedy',             'Greedy Algorithms',    'coding'),
  ('math',               'Math & Number Theory', 'coding'),
  ('bit-manipulation',   'Bit Manipulation',     'coding'),
  ('two-pointers',       'Two Pointers',         'coding'),
  ('intervals',          'Intervals',            'coding'),

  -- system_design (12)
  ('caching',       'Caching',               'system_design'),
  ('load-balancing','Load Balancing',         'system_design'),
  ('sharding',      'Sharding & Partitioning','system_design'),
  ('queues',        'Message Queues',         'system_design'),
  ('consistency',   'Consistency & CAP',      'system_design'),
  ('storage',       'Storage Systems',        'system_design'),
  ('search',        'Search & Indexing',      'system_design'),
  ('realtime',      'Real-time Systems',      'system_design'),
  ('rate-limiting', 'Rate Limiting',          'system_design'),
  ('cdn',           'CDN & Edge',             'system_design'),
  ('observability', 'Observability',          'system_design'),
  ('security',      'Security & Auth',        'system_design'),

  -- data_modeling (9)
  ('oltp',                 'OLTP Design',          'data_modeling'),
  ('olap',                 'OLAP / Analytical',    'data_modeling'),
  ('dimensional-modeling', 'Dimensional Modeling', 'data_modeling'),
  ('event-sourcing',       'Event Sourcing',       'data_modeling'),
  ('normalization',        'Normalization',        'data_modeling'),
  ('denormalization',      'Denormalization',      'data_modeling'),
  ('time-series',          'Time-Series Data',     'data_modeling'),
  ('graph-data',           'Graph Data Models',    'data_modeling'),
  ('document-stores',      'Document Stores',      'data_modeling'),

  -- sql (8)
  ('joins',            'Joins',                    'sql'),
  ('aggregations',     'Aggregations & GROUP BY',  'sql'),
  ('window-functions', 'Window Functions',         'sql'),
  ('ctes',             'CTEs',                     'sql'),
  ('subqueries',       'Subqueries',               'sql'),
  ('set-operations',   'Set Operations',           'sql'),
  ('indexes',          'Indexes',                  'sql'),
  ('query-optimization','Query Optimization',      'sql'),

  -- product_sense (11)
  ('jtbd',               'Jobs-to-be-Done',      'product_sense'),
  ('north-star',         'North Star Metric',     'product_sense'),
  ('acquisition',        'Acquisition',           'product_sense'),
  ('retention',          'Retention',             'product_sense'),
  ('monetization',       'Monetization',          'product_sense'),
  ('growth',             'Growth Loops',          'product_sense'),
  ('onboarding',         'Onboarding',            'product_sense'),
  ('churn',              'Churn & Resurrection',  'product_sense'),
  ('marketplace-dynamics','Marketplace Dynamics', 'product_sense'),
  ('network-effects',    'Network Effects',       'product_sense'),
  ('pricing',            'Pricing Strategy',      'product_sense'),

  -- ai_engineering (10)
  ('rag',              'Retrieval-Augmented Generation','ai_engineering'),
  ('embeddings',       'Embeddings',                   'ai_engineering'),
  ('evals',            'Evals & Benchmarking',         'ai_engineering'),
  ('prompting',        'Prompt Engineering',           'ai_engineering'),
  ('agents',           'AI Agents',                    'ai_engineering'),
  ('fine-tuning',      'Fine-tuning',                  'ai_engineering'),
  ('tool-use',         'Tool Use / Function Calling',  'ai_engineering'),
  ('multi-modal',      'Multi-modal AI',               'ai_engineering'),
  ('safety',           'AI Safety & Alignment',        'ai_engineering'),
  ('cost-optimization','Cost Optimization',            'ai_engineering')

ON CONFLICT (slug) DO UPDATE SET
  label      = EXCLUDED.label,
  discipline = EXCLUDED.discipline;

COMMIT;


-- ============================================================
-- STEP 2: Seed techniques
-- ============================================================

BEGIN;

INSERT INTO techniques (slug, label, discipline, description) VALUES

  -- coding (13)
  ('two-pointers',     'Two Pointers',          'coding', 'Left/right pointer scan to find pairs or reduce search space.'),
  ('sliding-window',   'Sliding Window',         'coding', 'Maintain a window over a sequence to compute sub-array properties.'),
  ('bfs',              'Breadth-First Search',   'coding', 'Level-order traversal using a queue.'),
  ('dfs',              'Depth-First Search',     'coding', 'Recursive or stack-based exhaustive traversal.'),
  ('dijkstra',         'Dijkstra''s Algorithm',  'coding', 'Single-source shortest path on non-negative weighted graphs.'),
  ('binary-search',    'Binary Search',          'coding', 'O(log n) search on sorted arrays or answer spaces.'),
  ('monotonic-stack',  'Monotonic Stack',        'coding', 'Stack maintaining monotonic ordering to find next greater/smaller element.'),
  ('topological-sort', 'Topological Sort',       'coding', 'Linear ordering of a DAG for dependency resolution.'),
  ('union-find',       'Union-Find (DSU)',        'coding', 'Disjoint Set Union for connected component tracking.'),
  ('trie',             'Trie',                   'coding', 'Prefix tree for efficient string matching and autocomplete.'),
  ('segment-tree',     'Segment Tree',           'coding', 'Tree for range queries and point updates in O(log n).'),
  ('kmp',              'KMP Algorithm',          'coding', 'Linear-time substring search using failure function.'),
  ('dp-on-trees',      'DP on Trees',            'coding', 'Dynamic programming over tree structures using DFS.'),

  -- system_design (11)
  ('cache-aside',         'Cache-Aside',        'system_design', 'Application manages cache population on miss.'),
  ('write-through',       'Write-Through',      'system_design', 'Write to cache and DB synchronously.'),
  ('write-back',          'Write-Back',         'system_design', 'Write to cache; persist to DB asynchronously.'),
  ('consistent-hashing',  'Consistent Hashing', 'system_design', 'Distribute keys across nodes with minimal remapping on resize.'),
  ('leader-election',     'Leader Election',    'system_design', 'Select a single coordinator node using Raft or Paxos.'),
  ('circuit-breaker',     'Circuit Breaker',    'system_design', 'Stop cascading failures by short-circuiting unhealthy dependencies.'),
  ('bulkhead',            'Bulkhead Pattern',   'system_design', 'Isolate workload pools to prevent full-system failure.'),
  ('saga',                'Saga Pattern',       'system_design', 'Manage distributed transactions via compensating actions.'),
  ('cqrs',                'CQRS',               'system_design', 'Separate read and write models for independent scaling.'),
  ('event-sourcing-pattern','Event Sourcing',   'system_design', 'Persist state as an immutable log of events.'),
  ('sharding-key-design', 'Sharding Key Design','system_design', 'Choose partition keys to minimize hotspots and cross-shard queries.'),

  -- data_modeling (6)
  ('star-schema',               'Star Schema',                'data_modeling', 'Central fact table surrounded by dimension tables.'),
  ('snowflake-schema',          'Snowflake Schema',           'data_modeling', 'Normalized extension of star schema with sub-dimensions.'),
  ('slowly-changing-dimensions','Slowly Changing Dimensions', 'data_modeling', 'Track historical changes in dimension attributes (SCD types 1-3).'),
  ('fact-table',                'Fact Table Design',          'data_modeling', 'Choosing granularity and measures for transactional facts.'),
  ('dimension-table',           'Dimension Table Design',     'data_modeling', 'Structuring descriptive attributes for analytical queries.'),
  ('surrogate-key',             'Surrogate Keys',             'data_modeling', 'System-generated primary keys to decouple from business keys.'),

  -- sql (8)
  ('analytic-functions', 'Analytic / Window Functions', 'sql', 'RANK, ROW_NUMBER, LAG, LEAD, and frame-based aggregations.'),
  ('recursive-cte',      'Recursive CTEs',        'sql', 'Hierarchical or iterative queries using WITH RECURSIVE.'),
  ('anti-join',          'Anti-Join',             'sql', 'NOT EXISTS / LEFT JOIN + IS NULL to find non-matching rows.'),
  ('pivot',              'Pivot / CROSSTAB',      'sql', 'Rotate rows into columns for report-friendly output.'),
  ('lateral-join',       'LATERAL Join',          'sql', 'Correlated subquery in the FROM clause for row-level computation.'),
  ('lag-lead',           'LAG / LEAD',            'sql', 'Access prior or next row values within a partition.'),
  ('percentile',         'Percentile Functions',  'sql', 'PERCENTILE_CONT / PERCENTILE_DISC for distribution analysis.'),
  ('rolling-aggregation','Rolling Aggregations',  'sql', 'Moving averages and cumulative sums using window frames.'),

  -- product_sense (4)
  ('taste-frame',         'Taste Frame',         'product_sense', 'Evaluate product decisions by feel for what real users actually value.'),
  ('jobs-mapping',        'Jobs Mapping',        'product_sense', 'Map functional, emotional, and social jobs users hire a product to do.'),
  ('retention-cohorts',   'Retention Cohorts',   'product_sense', 'Segment users by join date to identify retention trends.'),
  ('north-star-cascade',  'North Star Cascade',  'product_sense', 'Break down a north star metric into input and output metrics.'),

  -- ai_engineering (8)
  ('chunking',         'Chunking Strategies',     'ai_engineering', 'Split documents into retrieval-optimal segments.'),
  ('reranking',        'Reranking',               'ai_engineering', 'Score and reorder retrieved candidates with a cross-encoder.'),
  ('hybrid-search',    'Hybrid Search',           'ai_engineering', 'Combine sparse (BM25) and dense (vector) retrieval.'),
  ('function-calling', 'Function Calling',           'ai_engineering','Let models invoke external APIs via structured JSON schemas.'),
  ('prompt-caching',   'Prompt Caching',          'ai_engineering', 'Cache stable system prompt prefixes to cut token costs.'),
  ('structured-output','Structured Output',       'ai_engineering', 'Enforce JSON schema via constrained decoding or grammar.'),
  ('eval-harness',     'Eval Harness',            'ai_engineering', 'Automated test suite for measuring model quality regressions.'),
  ('llm-as-judge',     'LLM-as-Judge',            'ai_engineering', 'Use a stronger model to grade outputs of the model under test.')

ON CONFLICT (slug) DO UPDATE SET
  label       = EXCLUDED.label,
  discipline  = EXCLUDED.discipline,
  description = EXCLUDED.description;

COMMIT;


-- ============================================================
-- STEP 3: Seed company_profiles — aliases + interview_loop_disciplines
-- ============================================================
-- Only updates these two new columns; leaves all other company data intact.
-- Inserts company if missing (slug unique); otherwise updates the two columns.
-- ============================================================

BEGIN;

INSERT INTO company_profiles (slug, name, aliases, interview_loop_disciplines) VALUES
  ('google',     'Google',     ARRAY['Alphabet', 'DeepMind'],           ARRAY['coding','system_design','data_modeling','sql','ai_engineering']),
  ('meta',       'Meta',       ARRAY['Facebook', 'Instagram', 'WhatsApp'], ARRAY['coding','system_design','data_modeling','product_sense','ai_engineering']),
  ('amazon',     'Amazon',     ARRAY['AWS', 'Alexa'],                   ARRAY['coding','system_design','data_modeling','sql','product_sense']),
  ('apple',      'Apple',      ARRAY[]::TEXT[],                         ARRAY['coding','system_design','product_sense']),
  ('microsoft',  'Microsoft',  ARRAY['Azure', 'GitHub', 'LinkedIn'],    ARRAY['coding','system_design','data_modeling','sql','ai_engineering']),
  ('netflix',    'Netflix',    ARRAY[]::TEXT[],                         ARRAY['coding','system_design','data_modeling','product_sense']),
  ('stripe',     'Stripe',     ARRAY[]::TEXT[],                         ARRAY['coding','system_design','data_modeling','sql']),
  ('airbnb',     'Airbnb',     ARRAY[]::TEXT[],                         ARRAY['coding','system_design','data_modeling','product_sense','sql']),
  ('uber',       'Uber',       ARRAY[]::TEXT[],                         ARRAY['coding','system_design','data_modeling','product_sense']),
  ('lyft',       'Lyft',       ARRAY[]::TEXT[],                         ARRAY['coding','system_design','data_modeling','product_sense']),
  ('notion',     'Notion',     ARRAY[]::TEXT[],                         ARRAY['coding','system_design','product_sense']),
  ('figma',      'Figma',      ARRAY[]::TEXT[],                         ARRAY['coding','system_design','product_sense']),
  ('anthropic',  'Anthropic',  ARRAY[]::TEXT[],                         ARRAY['coding','system_design','ai_engineering']),
  ('openai',     'OpenAI',     ARRAY[]::TEXT[],                         ARRAY['coding','system_design','ai_engineering']),
  ('databricks', 'Databricks', ARRAY['Delta Lake', 'MLflow'],           ARRAY['coding','system_design','data_modeling','sql','ai_engineering']),
  ('shopify',    'Shopify',    ARRAY[]::TEXT[],                         ARRAY['coding','system_design','data_modeling','product_sense']),
  ('github',     'GitHub',     ARRAY[]::TEXT[],                         ARRAY['coding','system_design','product_sense']),
  ('gitlab',     'GitLab',     ARRAY[]::TEXT[],                         ARRAY['coding','system_design','product_sense']),
  ('slack',      'Slack',      ARRAY[]::TEXT[],                         ARRAY['coding','system_design','product_sense']),
  ('zoom',       'Zoom',       ARRAY[]::TEXT[],                         ARRAY['coding','system_design','product_sense']),
  ('linkedin',   'LinkedIn',   ARRAY[]::TEXT[],                         ARRAY['coding','system_design','data_modeling','product_sense','sql']),
  ('spotify',    'Spotify',    ARRAY[]::TEXT[],                         ARRAY['coding','system_design','data_modeling','product_sense']),
  ('doordash',   'DoorDash',   ARRAY[]::TEXT[],                         ARRAY['coding','system_design','data_modeling','product_sense']),
  ('instacart',  'Instacart',  ARRAY[]::TEXT[],                         ARRAY['coding','system_design','product_sense']),
  ('robinhood',  'Robinhood',  ARRAY[]::TEXT[],                         ARRAY['coding','system_design','data_modeling','product_sense']),
  ('coinbase',   'Coinbase',   ARRAY[]::TEXT[],                         ARRAY['coding','system_design','data_modeling','product_sense']),
  ('plaid',      'Plaid',      ARRAY[]::TEXT[],                         ARRAY['coding','system_design','data_modeling']),
  ('datadog',    'Datadog',    ARRAY[]::TEXT[],                         ARRAY['coding','system_design','data_modeling','sql']),
  ('snowflake',  'Snowflake',  ARRAY[]::TEXT[],                         ARRAY['data_modeling','sql','ai_engineering']),
  ('mongodb',    'MongoDB',    ARRAY['Mongo'],                           ARRAY['coding','system_design','data_modeling'])

ON CONFLICT (slug) DO UPDATE SET
  aliases                    = EXCLUDED.aliases,
  interview_loop_disciplines = EXCLUDED.interview_loop_disciplines;

COMMIT;
