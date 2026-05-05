/**
 * Canonical controlled vocabularies for the platform.
 *
 * This is the single source of truth for discipline slugs, topic slugs,
 * technique slugs, and company slugs. The seed migration (082) and all
 * app code must reference this file — never hardcode slugs elsewhere.
 *
 * Slug conventions:
 * - Disciplines: lowercase with underscores (system_design, ai_engineering)
 * - Topics & Techniques: lowercase kebab-case (hash-tables, cache-aside)
 * - Companies: lowercase single word or hyphenated (google, doordash)
 */

// ── Disciplines ───────────────────────────────────────────────────────────────

export const DISCIPLINES = [
  'coding',
  'system_design',
  'data_modeling',
  'sql',
  'product_sense',
  'ai_engineering',
] as const

export type Discipline = (typeof DISCIPLINES)[number]

// ── Entry shapes ──────────────────────────────────────────────────────────────

export interface TopicEntry {
  slug: string
  label: string
  parent_slug?: string
}

export interface TechniqueEntry {
  slug: string
  label: string
  description?: string
}

export interface CompanyEntry {
  slug: string
  label: string
  aliases: string[]
  disciplines: Discipline[]
}

// ── Topics ────────────────────────────────────────────────────────────────────

export const TOPICS: Record<Discipline, ReadonlyArray<TopicEntry>> = {
  coding: [
    { slug: 'arrays', label: 'Arrays' },
    { slug: 'strings', label: 'Strings' },
    { slug: 'hash-tables', label: 'Hash Tables' },
    { slug: 'linked-lists', label: 'Linked Lists' },
    { slug: 'trees', label: 'Trees' },
    { slug: 'graphs', label: 'Graphs' },
    { slug: 'heap', label: 'Heap / Priority Queue' },
    { slug: 'stack-queue', label: 'Stack & Queue' },
    { slug: 'dynamic-programming', label: 'Dynamic Programming' },
    { slug: 'greedy', label: 'Greedy Algorithms' },
    { slug: 'math', label: 'Math & Number Theory' },
    { slug: 'bit-manipulation', label: 'Bit Manipulation' },
    { slug: 'two-pointers', label: 'Two Pointers' },
    { slug: 'intervals', label: 'Intervals' },
  ],

  system_design: [
    { slug: 'caching', label: 'Caching' },
    { slug: 'load-balancing', label: 'Load Balancing' },
    { slug: 'sharding', label: 'Sharding & Partitioning' },
    { slug: 'queues', label: 'Message Queues' },
    { slug: 'consistency', label: 'Consistency & CAP' },
    { slug: 'storage', label: 'Storage Systems' },
    { slug: 'search', label: 'Search & Indexing' },
    { slug: 'realtime', label: 'Real-time Systems' },
    { slug: 'rate-limiting', label: 'Rate Limiting' },
    { slug: 'cdn', label: 'CDN & Edge' },
    { slug: 'observability', label: 'Observability' },
    { slug: 'security', label: 'Security & Auth' },
  ],

  data_modeling: [
    { slug: 'oltp', label: 'OLTP Design' },
    { slug: 'olap', label: 'OLAP / Analytical' },
    { slug: 'dimensional-modeling', label: 'Dimensional Modeling' },
    { slug: 'event-sourcing', label: 'Event Sourcing' },
    { slug: 'normalization', label: 'Normalization' },
    { slug: 'denormalization', label: 'Denormalization' },
    { slug: 'time-series', label: 'Time-Series Data' },
    { slug: 'graph-data', label: 'Graph Data Models' },
    { slug: 'document-stores', label: 'Document Stores' },
  ],

  sql: [
    { slug: 'joins', label: 'Joins' },
    { slug: 'aggregations', label: 'Aggregations & GROUP BY' },
    { slug: 'window-functions', label: 'Window Functions' },
    { slug: 'ctes', label: 'CTEs' },
    { slug: 'subqueries', label: 'Subqueries' },
    { slug: 'set-operations', label: 'Set Operations' },
    { slug: 'indexes', label: 'Indexes' },
    { slug: 'query-optimization', label: 'Query Optimization' },
  ],

  product_sense: [
    { slug: 'jtbd', label: 'Jobs-to-be-Done' },
    { slug: 'north-star', label: 'North Star Metric' },
    { slug: 'acquisition', label: 'Acquisition' },
    { slug: 'retention', label: 'Retention' },
    { slug: 'monetization', label: 'Monetization' },
    { slug: 'growth', label: 'Growth Loops' },
    { slug: 'onboarding', label: 'Onboarding' },
    { slug: 'churn', label: 'Churn & Resurrection' },
    { slug: 'marketplace-dynamics', label: 'Marketplace Dynamics' },
    { slug: 'network-effects', label: 'Network Effects' },
    { slug: 'pricing', label: 'Pricing Strategy' },
  ],

  ai_engineering: [
    { slug: 'rag', label: 'Retrieval-Augmented Generation' },
    { slug: 'embeddings', label: 'Embeddings' },
    { slug: 'evals', label: 'Evals & Benchmarking' },
    { slug: 'prompting', label: 'Prompt Engineering' },
    { slug: 'agents', label: 'AI Agents' },
    { slug: 'fine-tuning', label: 'Fine-tuning' },
    { slug: 'tool-use', label: 'Tool Use / Function Calling' },
    { slug: 'multi-modal', label: 'Multi-modal AI' },
    { slug: 'safety', label: 'AI Safety & Alignment' },
    { slug: 'cost-optimization', label: 'Cost Optimization' },
  ],
} as const

// ── Techniques ────────────────────────────────────────────────────────────────

export const TECHNIQUES: Record<Discipline, ReadonlyArray<TechniqueEntry>> = {
  coding: [
    { slug: 'two-pointers', label: 'Two Pointers', description: 'Left/right pointer scan to find pairs or reduce search space.' },
    { slug: 'sliding-window', label: 'Sliding Window', description: 'Maintain a window over a sequence to compute sub-array properties.' },
    { slug: 'bfs', label: 'Breadth-First Search', description: 'Level-order traversal using a queue.' },
    { slug: 'dfs', label: 'Depth-First Search', description: 'Recursive or stack-based exhaustive traversal.' },
    { slug: 'dijkstra', label: "Dijkstra's Algorithm", description: 'Single-source shortest path on non-negative weighted graphs.' },
    { slug: 'binary-search', label: 'Binary Search', description: 'O(log n) search on sorted arrays or answer spaces.' },
    { slug: 'monotonic-stack', label: 'Monotonic Stack', description: 'Stack maintaining monotonic ordering to find next greater/smaller element.' },
    { slug: 'topological-sort', label: 'Topological Sort', description: 'Linear ordering of a DAG for dependency resolution.' },
    { slug: 'union-find', label: 'Union-Find (DSU)', description: 'Disjoint Set Union for connected component tracking.' },
    { slug: 'trie', label: 'Trie', description: 'Prefix tree for efficient string matching and autocomplete.' },
    { slug: 'segment-tree', label: 'Segment Tree', description: 'Tree for range queries and point updates in O(log n).' },
    { slug: 'kmp', label: 'KMP Algorithm', description: 'Linear-time substring search using failure function.' },
    { slug: 'dp-on-trees', label: 'DP on Trees', description: 'Dynamic programming over tree structures using DFS.' },
  ],

  system_design: [
    { slug: 'cache-aside', label: 'Cache-Aside', description: 'Application manages cache population on miss.' },
    { slug: 'write-through', label: 'Write-Through', description: 'Write to cache and DB synchronously.' },
    { slug: 'write-back', label: 'Write-Back', description: 'Write to cache; persist to DB asynchronously.' },
    { slug: 'consistent-hashing', label: 'Consistent Hashing', description: 'Distribute keys across nodes with minimal remapping on resize.' },
    { slug: 'leader-election', label: 'Leader Election', description: 'Select a single coordinator node using Raft or Paxos.' },
    { slug: 'circuit-breaker', label: 'Circuit Breaker', description: 'Stop cascading failures by short-circuiting unhealthy dependencies.' },
    { slug: 'bulkhead', label: 'Bulkhead Pattern', description: 'Isolate workload pools to prevent full-system failure.' },
    { slug: 'saga', label: 'Saga Pattern', description: 'Manage distributed transactions via compensating actions.' },
    { slug: 'cqrs', label: 'CQRS', description: 'Separate read and write models for independent scaling.' },
    { slug: 'event-sourcing-pattern', label: 'Event Sourcing', description: 'Persist state as an immutable log of events.' },
    { slug: 'sharding-key-design', label: 'Sharding Key Design', description: 'Choose partition keys to minimize hotspots and cross-shard queries.' },
  ],

  data_modeling: [
    { slug: 'star-schema', label: 'Star Schema', description: 'Central fact table surrounded by dimension tables.' },
    { slug: 'snowflake-schema', label: 'Snowflake Schema', description: 'Normalized extension of star schema with sub-dimensions.' },
    { slug: 'slowly-changing-dimensions', label: 'Slowly Changing Dimensions', description: 'Track historical changes in dimension attributes (SCD types 1-3).' },
    { slug: 'fact-table', label: 'Fact Table Design', description: 'Choosing granularity and measures for transactional facts.' },
    { slug: 'dimension-table', label: 'Dimension Table Design', description: 'Structuring descriptive attributes for analytical queries.' },
    { slug: 'surrogate-key', label: 'Surrogate Keys', description: 'System-generated primary keys to decouple from business keys.' },
  ],

  sql: [
    { slug: 'analytic-functions', label: 'Analytic / Window Functions', description: 'RANK, ROW_NUMBER, LAG, LEAD, and frame-based aggregations.' },
    { slug: 'recursive-cte', label: 'Recursive CTEs', description: 'Hierarchical or iterative queries using WITH RECURSIVE.' },
    { slug: 'anti-join', label: 'Anti-Join', description: 'NOT EXISTS / LEFT JOIN + IS NULL to find non-matching rows.' },
    { slug: 'pivot', label: 'Pivot / CROSSTAB', description: 'Rotate rows into columns for report-friendly output.' },
    { slug: 'lateral-join', label: 'LATERAL Join', description: 'Correlated subquery in the FROM clause for row-level computation.' },
    { slug: 'lag-lead', label: 'LAG / LEAD', description: 'Access prior or next row values within a partition.' },
    { slug: 'percentile', label: 'Percentile Functions', description: 'PERCENTILE_CONT / PERCENTILE_DISC for distribution analysis.' },
    { slug: 'rolling-aggregation', label: 'Rolling Aggregations', description: 'Moving averages and cumulative sums using window frames.' },
  ],

  product_sense: [
    { slug: 'taste-frame', label: 'Taste Frame', description: 'Evaluate product decisions by feel for what real users actually value.' },
    { slug: 'jobs-mapping', label: 'Jobs Mapping', description: 'Map functional, emotional, and social jobs users hire a product to do.' },
    { slug: 'retention-cohorts', label: 'Retention Cohorts', description: 'Segment users by join date to identify retention trends.' },
    { slug: 'north-star-cascade', label: 'North Star Cascade', description: 'Break down a north star metric into input and output metrics.' },
  ],

  ai_engineering: [
    { slug: 'chunking', label: 'Chunking Strategies', description: 'Split documents into retrieval-optimal segments.' },
    { slug: 'reranking', label: 'Reranking', description: 'Score and reorder retrieved candidates with a cross-encoder.' },
    { slug: 'hybrid-search', label: 'Hybrid Search', description: 'Combine sparse (BM25) and dense (vector) retrieval.' },
    { slug: 'function-calling', label: 'Function Calling', description: 'Let models invoke external APIs via structured JSON schemas.' },
    { slug: 'prompt-caching', label: 'Prompt Caching', description: 'Cache stable system prompt prefixes to cut token costs.' },
    { slug: 'structured-output', label: 'Structured Output', description: 'Enforce JSON schema via constrained decoding or grammar.' },
    { slug: 'eval-harness', label: 'Eval Harness', description: 'Automated test suite for measuring model quality regressions.' },
    { slug: 'llm-as-judge', label: 'LLM-as-Judge', description: 'Use a stronger model to grade outputs of the model under test.' },
  ],
} as const

// ── Companies ─────────────────────────────────────────────────────────────────

export const COMPANIES: ReadonlyArray<CompanyEntry> = [
  { slug: 'google', label: 'Google', aliases: ['Alphabet', 'DeepMind'], disciplines: ['coding', 'system_design', 'data_modeling', 'sql', 'ai_engineering'] },
  { slug: 'meta', label: 'Meta', aliases: ['Facebook', 'Instagram', 'WhatsApp'], disciplines: ['coding', 'system_design', 'data_modeling', 'product_sense', 'ai_engineering'] },
  { slug: 'amazon', label: 'Amazon', aliases: ['AWS', 'Alexa'], disciplines: ['coding', 'system_design', 'data_modeling', 'sql', 'product_sense'] },
  { slug: 'apple', label: 'Apple', aliases: [], disciplines: ['coding', 'system_design', 'product_sense'] },
  { slug: 'microsoft', label: 'Microsoft', aliases: ['Azure', 'GitHub', 'LinkedIn'], disciplines: ['coding', 'system_design', 'data_modeling', 'sql', 'ai_engineering'] },
  { slug: 'netflix', label: 'Netflix', aliases: [], disciplines: ['coding', 'system_design', 'data_modeling', 'product_sense'] },
  { slug: 'stripe', label: 'Stripe', aliases: [], disciplines: ['coding', 'system_design', 'data_modeling', 'sql'] },
  { slug: 'airbnb', label: 'Airbnb', aliases: [], disciplines: ['coding', 'system_design', 'data_modeling', 'product_sense', 'sql'] },
  { slug: 'uber', label: 'Uber', aliases: [], disciplines: ['coding', 'system_design', 'data_modeling', 'product_sense'] },
  { slug: 'lyft', label: 'Lyft', aliases: [], disciplines: ['coding', 'system_design', 'data_modeling', 'product_sense'] },
  { slug: 'notion', label: 'Notion', aliases: [], disciplines: ['coding', 'system_design', 'product_sense'] },
  { slug: 'figma', label: 'Figma', aliases: [], disciplines: ['coding', 'system_design', 'product_sense'] },
  { slug: 'anthropic', label: 'Anthropic', aliases: [], disciplines: ['coding', 'system_design', 'ai_engineering'] },
  { slug: 'openai', label: 'OpenAI', aliases: [], disciplines: ['coding', 'system_design', 'ai_engineering'] },
  { slug: 'databricks', label: 'Databricks', aliases: ['Delta Lake', 'MLflow'], disciplines: ['coding', 'system_design', 'data_modeling', 'sql', 'ai_engineering'] },
  { slug: 'shopify', label: 'Shopify', aliases: [], disciplines: ['coding', 'system_design', 'data_modeling', 'product_sense'] },
  { slug: 'github', label: 'GitHub', aliases: [], disciplines: ['coding', 'system_design', 'product_sense'] },
  { slug: 'gitlab', label: 'GitLab', aliases: [], disciplines: ['coding', 'system_design', 'product_sense'] },
  { slug: 'slack', label: 'Slack', aliases: [], disciplines: ['coding', 'system_design', 'product_sense'] },
  { slug: 'zoom', label: 'Zoom', aliases: [], disciplines: ['coding', 'system_design', 'product_sense'] },
  { slug: 'linkedin', label: 'LinkedIn', aliases: [], disciplines: ['coding', 'system_design', 'data_modeling', 'product_sense', 'sql'] },
  { slug: 'spotify', label: 'Spotify', aliases: [], disciplines: ['coding', 'system_design', 'data_modeling', 'product_sense'] },
  { slug: 'doordash', label: 'DoorDash', aliases: [], disciplines: ['coding', 'system_design', 'data_modeling', 'product_sense'] },
  { slug: 'instacart', label: 'Instacart', aliases: [], disciplines: ['coding', 'system_design', 'product_sense'] },
  { slug: 'robinhood', label: 'Robinhood', aliases: [], disciplines: ['coding', 'system_design', 'data_modeling', 'product_sense'] },
  { slug: 'coinbase', label: 'Coinbase', aliases: [], disciplines: ['coding', 'system_design', 'data_modeling', 'product_sense'] },
  { slug: 'plaid', label: 'Plaid', aliases: [], disciplines: ['coding', 'system_design', 'data_modeling'] },
  { slug: 'datadog', label: 'Datadog', aliases: [], disciplines: ['coding', 'system_design', 'data_modeling', 'sql'] },
  { slug: 'snowflake', label: 'Snowflake', aliases: [], disciplines: ['data_modeling', 'sql', 'ai_engineering'] },
  { slug: 'mongodb', label: 'MongoDB', aliases: ['Mongo'], disciplines: ['coding', 'system_design', 'data_modeling'] },
] as const

// ── Helper functions ──────────────────────────────────────────────────────────

/**
 * Returns all topics for a given discipline.
 */
export function getTopicsForDiscipline(discipline: Discipline): ReadonlyArray<TopicEntry> {
  return TOPICS[discipline]
}

/**
 * Returns all techniques for a given discipline.
 */
export function getTechniquesForDiscipline(discipline: Discipline): ReadonlyArray<TechniqueEntry> {
  return TECHNIQUES[discipline]
}

/**
 * Returns the display label for a topic slug within a discipline, or undefined if not found.
 */
export function getTopicLabel(discipline: Discipline, slug: string): string | undefined {
  return TOPICS[discipline].find(t => t.slug === slug)?.label
}

/**
 * Returns the display label for a technique slug within a discipline, or undefined if not found.
 */
export function getTechniqueLabel(discipline: Discipline, slug: string): string | undefined {
  return TECHNIQUES[discipline].find(t => t.slug === slug)?.label
}

/**
 * Returns true if the slug is a valid topic within the given discipline.
 */
export function isValidTopic(discipline: Discipline, slug: string): boolean {
  return TOPICS[discipline].some(t => t.slug === slug)
}

/**
 * Returns true if the slug is a valid technique within the given discipline.
 */
export function isValidTechnique(discipline: Discipline, slug: string): boolean {
  return TECHNIQUES[discipline].some(t => t.slug === slug)
}

/**
 * Returns the display label for a company slug, or undefined if not found.
 */
export function getCompanyLabel(slug: string): string | undefined {
  return COMPANIES.find(c => c.slug === slug)?.label
}

/**
 * Returns all companies that cover a given discipline.
 */
export function getCompaniesForDiscipline(discipline: Discipline): ReadonlyArray<CompanyEntry> {
  return COMPANIES.filter(c => c.disciplines.includes(discipline))
}

/**
 * Returns true if the slug is a valid topic in ANY discipline.
 * Used by the content validator which sees only the finished ChallengeJson.
 */
export function isValidTopicAny(slug: string): boolean {
  return DISCIPLINES.some(d => TOPICS[d].some(t => t.slug === slug))
}

/**
 * Returns true if the slug is a valid technique in ANY discipline.
 * Used by the content validator which sees only the finished ChallengeJson.
 */
export function isValidTechniqueAny(slug: string): boolean {
  return DISCIPLINES.some(d => TECHNIQUES[d].some(t => t.slug === slug))
}

/**
 * Type guard: narrows a string to Discipline.
 */
export function isDiscipline(value: string): value is Discipline {
  return (DISCIPLINES as ReadonlyArray<string>).includes(value)
}

/**
 * Returns the display label for a topic slug searching across ALL disciplines.
 * Used when the calling component doesn't know the discipline.
 */
export function getTopicLabelAny(slug: string): string | undefined {
  for (const d of DISCIPLINES) {
    const found = TOPICS[d].find(t => t.slug === slug)
    if (found) return found.label
  }
  return undefined
}

/**
 * Returns the display label for a technique slug searching across ALL disciplines.
 * Used when the calling component doesn't know the discipline.
 */
export function getTechniqueLabelAny(slug: string): string | undefined {
  for (const d of DISCIPLINES) {
    const found = TECHNIQUES[d].find(t => t.slug === slug)
    if (found) return found.label
  }
  return undefined
}
