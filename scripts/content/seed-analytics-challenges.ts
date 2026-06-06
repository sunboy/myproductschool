/**
 * Seed the Claude Code Analytics curriculum.
 *
 * Idempotent upsert (by challenge `id`) of a sequenced set of analytics challenges
 * built on real `bigquery-public-data.*` datasets across complexity/normalization/
 * business-domain levels. The DB trigger auto-assigns display_number in the 8000
 * band; we set is_published=true so they appear in the Practice "Analytics" tab when
 * the feature flag / per-user allowlist is on.
 *
 * KEY CONTRACT (see src/components/v2/mediums/analyticsArc.ts `mergeArc`):
 *  - metadata.claude_code.sub_problems are OVERRIDES merged onto the default arc BY
 *    ID. The id MUST be one of the real arc step ids:
 *      mcp_setup | explore_schema | data_layout | analyze | segment | answer | report | skill
 *    Any other id (the old sp1/sp2/sp3) is silently ignored. We only override
 *    objective / successCriterion / suggestedPrompts / teachingNote — never kind/sequence.
 *  - BigQuery: BQ_PROJECT/BQ_DATASET are the DATA coordinates (public-data project +
 *    dataset). dataset_billing_project stays our project so our read-only SA can run
 *    the job (the bq-mcp server bills to BQ_BILLING_PROJECT). For public datasets we
 *    set dataset_billing_project to GCP_PROJECT via the route default, so we omit it
 *    here unless a challenge needs a specific billing project.
 *
 * Run: npx tsx scripts/content/seed-analytics-challenges.ts
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// ── env ──────────────────────────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }),
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// The default analytics domain (reused from cc_001).
const ANALYTICS_DOMAIN_ID = 'd0000001-0000-0000-0000-000000000001'

type ArcStepId = 'mcp_setup' | 'explore_schema' | 'data_layout' | 'analyze' | 'segment' | 'answer' | 'report' | 'skill'

interface SubProblemOverride {
  id: ArcStepId
  objective?: string
  successCriterion?: string
  suggestedPrompts?: string[]
  teachingNote?: string
}

// DB CHECK allows easy|medium|hard. arcForDifficulty treats `easy` as the 4-step
// beginner subset and medium/hard as the full 8-step arc.
interface ChallengeSeed {
  id: string
  slug: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedMinutes: number
  paradigm: 'ai_assisted'
  bqProject: string
  bqDataset: string
  companyTags?: string[]
  scenario: { context: string; trigger: string; question: string }
  claudeMd: string
  subProblems: SubProblemOverride[]
}

// ──────────────────────────────────────────────────────────────────────────────
// Curriculum. Datasets verified queryable by cc-bq-readonly@hackproduct (cross
// project to bigquery-public-data, billing to hackproduct).
// ──────────────────────────────────────────────────────────────────────────────

const CHALLENGES: ChallengeSeed[] = [
  // 1 — Re-seed cc_001 with CORRECT sub_problem ids (was sp1/sp2/sp3, silently
  //     ignored). Same dataset/scenario as the existing live challenge; this only
  //     repairs the sub_problems so per-step coaching is specific. is_published
  //     stays true; the upsert overwrites the broken metadata.
  {
    id: 'cc_001_checkout_funnel',
    slug: 'checkout-funnel-drop',
    title: 'Checkout funnel drop-off',
    difficulty: 'medium',
    estimatedMinutes: 30,
    paradigm: 'ai_assisted',
    bqProject: 'hackproduct',
    bqDataset: 'case_001_checkout_funnel',
    scenario: {
      context: 'Mobile checkout completion rate has dropped week-over-week for three consecutive weeks. Revenue from mobile sessions is 58% of volume but 23% of completed purchases. The engineering team flagged a payment form rework that shipped 22 days ago. No one has looked at the event data yet.',
      trigger: "The head of growth wants a read before Friday's product review. The full checkout funnel is in BigQuery: 30 days, ~10K events, six steps from cart through confirmed order. The data is clean and loaded. There is no existing analysis.",
      question: 'Where exactly is conversion breaking down, which device segment is driving it, and what is the one product change most likely to recover it?',
    },
    claudeMd: [
      '# Checkout funnel drop-off',
      '',
      'The `events` table holds 30 days of checkout events: `session_id`, `step`',
      '(the funnel stage), `device`, `region`, `created_at`.',
      '',
      'Goal: rank the funnel steps by drop-off, segment the worst step by device and',
      'region, then recommend one product change with a guardrail metric. Inspect the',
      'schema and the distinct step values before assuming the funnel order.',
      '',
      'Dataset: `hackproduct.case_001_checkout_funnel` (table `events`).',
    ].join('\n'),
    subProblems: [
      { id: 'explore_schema', objective: 'Inspect the events table and list the distinct step values to establish the funnel order.', successCriterion: 'Paste the column list and the distinct funnel step values.', suggestedPrompts: ['Show the events schema and the distinct step values', 'Show a few sessions of events in time order'] },
      { id: 'analyze', objective: 'Rank the funnel steps by drop-off and find the biggest leak.', successCriterion: 'State the worst step and its drop, e.g. "payment entry to submit: 47% drop".', suggestedPrompts: ['Conversion between each funnel step', 'Which step has the biggest drop-off, with the percentage?'] },
      { id: 'segment', objective: 'Segment the worst step by device and region.', successCriterion: 'State where the drop concentrates, e.g. "mobile 31% vs desktop 68% at submit".', suggestedPrompts: ['Break the worst step down by device', 'Compare mobile, desktop, tablet at the leak step'] },
      { id: 'answer', objective: 'Recommend one product change with the proving number and a guardrail.', successCriterion: 'Paste a finding: cause + number + recommendation + guardrail metric.', suggestedPrompts: ['Summarize the cause, the number, and one product change', 'What guardrail metric would catch a regression?'] },
    ],
  },

  // 2 — Iowa liquor: single flat table, beginner rank/trend.
  {
    id: 'cc-002-liquor-growth',
    slug: 'iowa-liquor-growth',
    title: 'Which liquor categories are growing',
    difficulty: 'easy',
    estimatedMinutes: 25,
    paradigm: 'ai_assisted',
    bqProject: 'bigquery-public-data',
    bqDataset: 'iowa_liquor_sales',
    companyTags: [],
    scenario: {
      context: 'A regional distributor sells across Iowa and wants to rebalance its catalog. Every wholesale purchase by retailers since 2012 sits in one table: store, county, category, bottles sold, and dollar amount per sale.',
      trigger: 'The category manager has a planning meeting Monday and no read on what is actually growing. The full sales table is in BigQuery and ready to query.',
      question: 'Which liquor categories and counties are growing fastest year over year, and where should the next quarter of inventory go?',
    },
    claudeMd: [
      '# Iowa liquor sales — what is growing',
      '',
      'One wide table, `sales`, holds every wholesale purchase by Iowa retailers.',
      'Useful columns: `category_name`, `county`, `date`, `bottles_sold`, `sale_dollars`.',
      '',
      'Goal: rank categories and counties by year-over-year growth and recommend',
      'where the next quarter of inventory should go. Start by reading the schema,',
      'then aggregate by category and year before you compare growth.',
      '',
      'Dataset: `bigquery-public-data.iowa_liquor_sales.sales`.',
    ].join('\n'),
    subProblems: [
      { id: 'explore_schema', objective: 'List the dataset and inspect the `sales` table columns and types before aggregating.', successCriterion: 'Paste the column list of the sales table, naming category_name, county, date, and sale_dollars.', suggestedPrompts: ['List the tables in this dataset and show the sales table schema', 'Show me 5 sample rows so I understand one row of sales'] },
      { id: 'analyze', objective: 'Compute total sale_dollars by category by year, then the year-over-year growth rate.', successCriterion: 'State the fastest-growing category and its YoY growth, e.g. "Tequila up 34% YoY".', suggestedPrompts: ['Total sale_dollars by category_name by year', 'Rank categories by year-over-year growth rate'] },
      { id: 'answer', objective: 'Name the categories and counties to invest in next quarter, with the growth number that justifies it.', successCriterion: 'Paste a one-paragraph recommendation citing a category, a county, and a growth figure.', suggestedPrompts: ['Summarize which categories and counties to stock more of and why', 'What is a guardrail metric to watch if we overstock a growing category?'] },
    ],
  },

  // 3 — Stack Overflow: two tables, beginner+ activation/cohort.
  {
    id: 'cc-003-so-activation',
    slug: 'stackoverflow-activation',
    title: 'Do new users actually stick',
    difficulty: 'easy',
    estimatedMinutes: 35,
    paradigm: 'ai_assisted',
    bqProject: 'bigquery-public-data',
    bqDataset: 'stackoverflow',
    scenario: {
      context: 'A community platform measures health by whether new accounts become contributors. Stack Overflow is the proxy: a `users` table with each account and its creation date, and a `posts_questions` table with every question and who asked it.',
      trigger: 'Growth keeps celebrating signups, but no one has checked whether new accounts ever contribute. The data is in BigQuery and joinable on user id.',
      question: 'What share of new users post a question within 30 days of joining, and is that activation rate improving or declining over recent signup cohorts?',
    },
    claudeMd: [
      '# Stack Overflow — new-user activation',
      '',
      'Two tables join on the user id:',
      '- `users` (`id`, `creation_date`, ...)',
      '- `posts_questions` (`owner_user_id`, `creation_date`, ...)',
      '',
      'Activation = a user posts their first question within 30 days of `creation_date`.',
      'Goal: compute the activation rate, then cohort it by signup month to see the',
      'trend. Inspect both schemas first; mind that these tables are large, so filter',
      'to a recent window of signup cohorts.',
      '',
      'Dataset: `bigquery-public-data.stackoverflow`.',
    ].join('\n'),
    subProblems: [
      { id: 'explore_schema', objective: 'Inspect users and posts_questions; identify the join key and the two creation_date columns.', successCriterion: 'Name the join (users.id = posts_questions.owner_user_id) and both date columns.', suggestedPrompts: ['Show the schema of users and posts_questions', 'How do these two tables join?'] },
      { id: 'analyze', objective: 'Compute the share of users who posted a question within 30 days of joining.', successCriterion: 'State the overall 30-day activation rate as a percentage.', suggestedPrompts: ['What % of users post a question within 30 days of creation_date?', 'Filter to a recent signup window so the query stays cheap'] },
      { id: 'segment', objective: 'Cohort the activation rate by signup month and compare recent cohorts.', successCriterion: 'State whether activation is rising or falling across recent monthly cohorts, with two numbers.', suggestedPrompts: ['Break activation rate down by signup month cohort', 'Compare the most recent cohorts to six months earlier'] },
      { id: 'answer', objective: 'State the activation trend and one lever to improve it, with the number that proves the trend.', successCriterion: 'Paste a finding naming the trend, a number, and a recommendation.', suggestedPrompts: ['Summarize the activation trend and one thing to try', 'What guardrail would tell us a change backfired?'] },
    ],
  },

  // 4 — theLook revenue dip: normalized joins, root-cause (the flagship intermediate).
  {
    id: 'cc-004-thelook-revenue-dip',
    slug: 'thelook-revenue-dip',
    title: 'Revenue dipped, find why',
    difficulty: 'medium',
    estimatedMinutes: 45,
    paradigm: 'ai_assisted',
    bqProject: 'bigquery-public-data',
    bqDataset: 'thelook_ecommerce',
    companyTags: [],
    scenario: {
      context: 'theLook is an online apparel retailer. Orders, line items, products, and users sit in a normalized schema. Revenue is the sum of completed `order_items.sale_price`, and it slipped last month.',
      trigger: 'The CEO saw the monthly number dip and wants a read before the board update. Nothing has been decomposed yet. The full schema is in BigQuery.',
      question: 'Is the revenue dip driven by fewer orders, smaller baskets, or a mix shift, and which segment (channel, category, or region) is responsible?',
    },
    claudeMd: [
      '# theLook eCommerce — revenue dip root-cause',
      '',
      'Normalized schema; the fact table is `order_items`:',
      '- `order_items` (`order_id`, `user_id`, `product_id`, `status`, `sale_price`, `created_at`, `returned_at`)',
      '- `orders` (`order_id`, `user_id`, `status`, `created_at`, `num_of_item`)',
      '- `products` (`id`, `category`, `brand`, `cost`, `retail_price`)',
      '- `users` (`id`, `traffic_source`, `country`, `age`, ...)',
      '',
      'Revenue = sum of `sale_price` for non-returned/non-cancelled `order_items`.',
      'Decompose the dip: orders x basket size x average price x mix. Then segment by',
      '`users.traffic_source`, `products.category`, and `users.country` to localize it.',
      'Read the schemas and confirm join keys before writing the revenue query.',
      '',
      'Dataset: `bigquery-public-data.thelook_ecommerce`.',
    ].join('\n'),
    subProblems: [
      { id: 'explore_schema', objective: 'Inspect order_items, orders, products, users; confirm the join keys and the order_items.status values.', successCriterion: 'Name the joins and the status values that count as revenue (exclude Returned/Cancelled).', suggestedPrompts: ['Show schemas for order_items, orders, products, users', 'What status values does order_items.status take?'] },
      { id: 'data_layout', objective: 'Confirm the date column to filter on (created_at) and the rough monthly volume so queries stay scoped.', successCriterion: 'State which column bounds the month and the approximate orders per month.', suggestedPrompts: ['How many order_items per month, by created_at?', 'Which column should I filter to compare last month vs the prior month?'] },
      { id: 'analyze', objective: 'Decompose the month-over-month revenue change into orders, basket size, and average price.', successCriterion: 'State which factor moved most, e.g. "orders flat, average price down 9%".', suggestedPrompts: ['Compare revenue, order count, and average order value month over month', 'Decompose the revenue change into volume vs price vs mix'] },
      { id: 'segment', objective: 'Segment the change by traffic_source, category, and country to localize the dip.', successCriterion: 'State the segment carrying the dip, e.g. "Display traffic revenue fell 30% while others held".', suggestedPrompts: ['Break the revenue change down by users.traffic_source', 'Which product category lost the most revenue month over month?'] },
      { id: 'answer', objective: 'State the cause, the proving number, a recommended action, and a guardrail.', successCriterion: 'Paste a finding paragraph: cause + number + recommendation + guardrail.', suggestedPrompts: ['Summarize the cause, the number, and one recommended action', 'What guardrail metric catches a fix that backfires?'] },
      { id: 'report', objective: 'Write the finding and the queries you ran to /workspace/report.md.', successCriterion: 'Confirm the report path, e.g. /workspace/report.md.', suggestedPrompts: ['Write the finding and the queries to /workspace/report.md', 'Add the segment table to the report'] },
      { id: 'skill', objective: 'Encode the decompose-then-segment move as a reusable .claude/skills file.', successCriterion: 'Confirm the skill filename you wrote.', suggestedPrompts: ['Write .claude/skills/revenue-decomposition.md that generalizes this', 'Make the skill work for any revenue metric, not just theLook'] },
    ],
  },

  // 5 — theLook returns: joins + margin, rank-by-impact.
  {
    id: 'cc-005-thelook-returns',
    slug: 'thelook-returns-margin',
    title: 'Which categories bleed margin on returns',
    difficulty: 'medium',
    estimatedMinutes: 40,
    paradigm: 'ai_assisted',
    bqProject: 'bigquery-public-data',
    bqDataset: 'thelook_ecommerce',
    scenario: {
      context: 'theLook eats the shipping and restocking cost on every return. Some categories get returned far more than others, and the margin hit is uneven because product cost varies.',
      trigger: 'Ops wants to know where return losses concentrate so they can tighten sizing guidance or drop a category. The data joins order_items (with returned_at) to products (with cost).',
      question: 'Which product categories drive the highest return rate, and once you weight by product cost, which ones actually destroy the most margin?',
    },
    claudeMd: [
      '# theLook eCommerce — returns and margin',
      '',
      '`order_items.status` includes `Returned`; `order_items.returned_at` is set on a',
      'return. Join to `products` for `category` and `cost`. Return rate is returned',
      'items over total items; the margin hit weights returns by `cost` (and lost',
      '`sale_price`).',
      '',
      'Goal: rank categories by return rate, then re-rank by total margin destroyed.',
      'The interesting move is that the highest-return category is not always the most',
      'expensive mistake. Inspect schemas and the status values first.',
      '',
      'Dataset: `bigquery-public-data.thelook_ecommerce`.',
    ].join('\n'),
    subProblems: [
      { id: 'explore_schema', objective: 'Inspect order_items and products; find status/returned_at and category/cost.', successCriterion: 'Name the return signal (status=Returned or returned_at) and the product join.', suggestedPrompts: ['Show order_items and products schemas', 'How do I tell a returned item apart in order_items?'] },
      { id: 'analyze', objective: 'Compute return rate by category.', successCriterion: 'State the highest return-rate category and its rate.', suggestedPrompts: ['Return rate by product category', 'Rank categories by return rate'] },
      { id: 'segment', objective: 'Re-rank categories by total margin destroyed (returns weighted by cost), not just rate.', successCriterion: 'Name the category that destroys the most margin and how it differs from the highest-rate one.', suggestedPrompts: ['Weight returns by product cost to get margin lost per category', 'Compare the rank by rate vs the rank by margin lost'] },
      { id: 'answer', objective: 'Recommend the one category to act on, with the margin number and a guardrail.', successCriterion: 'Paste a finding: which category, the margin lost, the action, and a guardrail.', suggestedPrompts: ['Summarize which category to fix first and the dollar impact', 'What guardrail confirms a sizing change reduced returns without hurting sales?'] },
      { id: 'skill', objective: 'Encode the rate-then-weight-by-cost prioritization as a reusable skill.', successCriterion: 'Confirm the skill filename.', suggestedPrompts: ['Write .claude/skills/impact-ranking.md for rate-then-cost-weighting', 'Generalize it beyond returns to any rate x cost prioritization'] },
    ],
  },

  // 6 — theLook funnel: clickstream events, funnel-leak.
  {
    id: 'cc-006-thelook-funnel',
    slug: 'thelook-browse-funnel',
    title: 'Find the leak in the browse funnel',
    difficulty: 'medium',
    estimatedMinutes: 40,
    paradigm: 'ai_assisted',
    bqProject: 'bigquery-public-data',
    bqDataset: 'thelook_ecommerce',
    scenario: {
      context: 'theLook logs web behavior in an `events` table: one row per event with an `event_type` (home, department, product, cart, purchase), a session id, and a traffic source.',
      trigger: 'Conversion from browse to purchase feels low and nobody has mapped the funnel from the raw event log. The events table is in BigQuery.',
      question: 'Build the browse-to-purchase funnel from the event log, find the step with the biggest drop-off, and say which traffic source it concentrates in.',
    },
    claudeMd: [
      '# theLook eCommerce — browse funnel leak',
      '',
      'The `events` table is the clickstream: `session_id`, `event_type`',
      '(home, department, product, cart, purchase), `traffic_source`, `created_at`.',
      '',
      'Goal: define the ordered funnel steps, count sessions reaching each step,',
      'compute step-to-step conversion, and find the biggest leak. Then segment the',
      'leak by `traffic_source`. Inspect the distinct `event_type` values before you',
      'assume the step order.',
      '',
      'Dataset: `bigquery-public-data.thelook_ecommerce` (table `events`).',
    ].join('\n'),
    subProblems: [
      { id: 'explore_schema', objective: 'Inspect events and list the distinct event_type values to establish the funnel order.', successCriterion: 'Paste the distinct event_type values and the intended step order.', suggestedPrompts: ['Show the events schema and the distinct event_type values', 'Show a few sessions worth of events in time order'] },
      { id: 'analyze', objective: 'Count sessions reaching each step and compute step-to-step conversion; find the biggest drop.', successCriterion: 'State the worst step and its drop, e.g. "product to cart: 71% drop".', suggestedPrompts: ['Count distinct sessions reaching each event_type step', 'Which step has the biggest drop-off, with the percentage?'] },
      { id: 'segment', objective: 'Segment the worst step by traffic_source.', successCriterion: 'State which source converts worst at the leak step, with two compared numbers.', suggestedPrompts: ['Break the worst step down by traffic_source', 'Compare Organic vs Display conversion at the leak step'] },
      { id: 'answer', objective: 'State the leak, the segment, a fix, and a guardrail.', successCriterion: 'Paste a finding: leak step + segment + number + recommendation + guardrail.', suggestedPrompts: ['Summarize the leak, the worst source, and one fix', 'What guardrail watches for a fix that shifts the leak downstream?'] },
    ],
  },

  // 7 — NYC taxi: large + year-sharded, two-sided + partition discipline.
  {
    id: 'cc-007-taxi-supply-demand',
    slug: 'nyc-taxi-supply-demand',
    title: 'When does taxi demand outrun supply',
    difficulty: 'medium',
    estimatedMinutes: 45,
    paradigm: 'ai_assisted',
    bqProject: 'bigquery-public-data',
    bqDataset: 'new_york_taxi_trips',
    scenario: {
      context: 'A dispatch team wants to pre-position drivers. Every NYC yellow-cab trip is logged with pickup time, pickup zone, fare, and tip. Trips are split into large per-year tables, so scans must be bounded.',
      trigger: 'The ops lead wants the worst demand-vs-supply windows so they can shift driver shifts. The trip tables are huge, so the query has to filter by date and zone, not scan everything.',
      question: 'In which hour-of-day and pickup-zone windows does trip demand spike hardest, and where is that likely to outrun available supply?',
    },
    claudeMd: [
      '# NYC taxi — demand vs supply windows',
      '',
      'Trips live in per-year tables, e.g. `tlc_yellow_trips_2022`. Each row is a trip:',
      'pickup datetime, pickup location id, fare, tip, passenger count. There is a',
      '`taxi_zone_geom` table mapping location ids to zones.',
      '',
      'These tables are large. Always filter to ONE year table and a bounded date',
      'range; do not scan all years. Goal: find the hour x zone windows with the',
      'highest pickup demand as a proxy for where supply is most strained, using trip',
      'volume and any wait/utilization signal you can derive.',
      '',
      'Dataset: `bigquery-public-data.new_york_taxi_trips`.',
    ].join('\n'),
    subProblems: [
      { id: 'explore_schema', objective: 'Inspect one yellow-trips year table and taxi_zone_geom; find the pickup time and location columns.', successCriterion: 'Name the pickup datetime and pickup location columns and the zone join.', suggestedPrompts: ['Show the schema of tlc_yellow_trips_2022 and taxi_zone_geom', 'Show 5 sample trips'] },
      { id: 'data_layout', objective: 'Establish the table is large and bound the query to one year + a date range.', successCriterion: 'State the chosen year table and the date filter that keeps the scan bounded.', suggestedPrompts: ['How big is one year table and how do I bound the scan?', 'Filter to a single month of one year to keep bytes scanned low'] },
      { id: 'analyze', objective: 'Aggregate trip demand by hour-of-day and pickup zone; rank the busiest windows.', successCriterion: 'Name the top hour x zone demand windows with counts.', suggestedPrompts: ['Trip count by hour of day and pickup zone', 'Rank the hour x zone windows by demand'] },
      { id: 'segment', objective: 'Identify where demand is most concentrated vs spread (the strained windows).', successCriterion: 'State the windows most likely to outrun supply and why.', suggestedPrompts: ['Which zones spike in a narrow set of hours?', 'Where is demand most peaked rather than steady?'] },
      { id: 'answer', objective: 'Recommend where to pre-position drivers, with the demand numbers and a guardrail.', successCriterion: 'Paste a finding: the windows, the numbers, the shift recommendation, a guardrail.', suggestedPrompts: ['Summarize where and when to add drivers', 'What guardrail tells us repositioning helped without starving other zones?'] },
    ],
  },

  // 8 — GA4: nested + sharded, ambiguous conversion (advanced capstone).
  {
    id: 'cc-008-ga4-conversion',
    slug: 'ga4-conversion-soft',
    title: 'Conversion is soft, where and for whom',
    difficulty: 'hard',
    estimatedMinutes: 60,
    paradigm: 'ai_assisted',
    bqProject: 'bigquery-public-data',
    bqDataset: 'ga4_obfuscated_sample_ecommerce',
    scenario: {
      context: 'The Google Merchandise Store exports GA4 events to BigQuery: one row per event, with the event name (view_item, begin_checkout, add_payment_info, purchase, and more) and a nested event_params record. Tables are sharded by day (events_YYYYMMDD).',
      trigger: 'Conversion looks soft and the team only has the raw GA4 export. The funnel has to be built from event rows, which means unnesting params and querying across day shards with a bounded suffix range.',
      question: 'Build the purchase funnel from the GA4 events, find where conversion breaks down, and identify which device or channel the weakness concentrates in.',
    },
    claudeMd: [
      '# GA4 sample — conversion funnel from raw events',
      '',
      'One row per event in daily-sharded tables `events_YYYYMMDD`. Key fields:',
      '`event_name`, `user_pseudo_id`, `event_timestamp`, a REPEATED `event_params`',
      'record (key/value), and `device`/`traffic_source` records.',
      '',
      'Inspect the real event_name values first; the meaningful purchase funnel in',
      'this store is `view_item` -> `begin_checkout` -> `add_payment_info` ->',
      '`purchase` (note: add_to_cart is essentially unused here, which is itself a',
      'finding). You must UNNEST event_params for some values and filter the wildcard',
      'with `_TABLE_SUFFIX` to a bounded date range so you do not scan every shard.',
      '',
      'Dataset: `bigquery-public-data.ga4_obfuscated_sample_ecommerce` (events_* shards).',
    ].join('\n'),
    subProblems: [
      { id: 'explore_schema', objective: 'Inspect one events_YYYYMMDD shard; find event_name, the nested event_params, and the device/traffic records.', successCriterion: 'Name the funnel event_name values and how event_params is structured (REPEATED record).', suggestedPrompts: ['Show the schema of one events_ shard', 'List the distinct event_name values and their counts for one day'] },
      { id: 'data_layout', objective: 'Establish the sharded layout and bound the query with _TABLE_SUFFIX.', successCriterion: 'State the date range chosen and the _TABLE_SUFFIX filter used.', suggestedPrompts: ['How are these tables sharded and how do I query a date range cheaply?', 'Use _TABLE_SUFFIX to scan only a two-week window'] },
      { id: 'analyze', objective: 'Build the funnel by event_name across the window and find the biggest drop.', successCriterion: 'State the worst funnel step and its drop, e.g. "view_item to begin_checkout: 96% drop".', suggestedPrompts: ['Count users at each funnel event_name across the window', 'Which funnel step has the biggest drop-off?'] },
      { id: 'segment', objective: 'Segment the worst step by device category and/or traffic source (unnesting as needed).', successCriterion: 'State the segment carrying the weakness, with two compared numbers.', suggestedPrompts: ['Break the worst step down by device.category', 'Compare mobile vs desktop at the weak step'] },
      { id: 'answer', objective: 'State the cause, segment, recommendation, and guardrail.', successCriterion: 'Paste a finding paragraph with cause + number + recommendation + guardrail.', suggestedPrompts: ['Summarize where conversion breaks and for whom', 'What guardrail metric watches the fix?'] },
      { id: 'report', objective: 'Write the finding and the unnesting queries to /workspace/report.md.', successCriterion: 'Confirm the report path.', suggestedPrompts: ['Write the finding and the GA4 queries to /workspace/report.md', 'Include the funnel table and the device segment in the report'] },
      { id: 'skill', objective: 'Encode the GA4 funnel-from-events pattern (unnest + suffix bound) as a reusable skill.', successCriterion: 'Confirm the skill filename.', suggestedPrompts: ['Write .claude/skills/ga4-funnel.md capturing the unnest + _TABLE_SUFFIX pattern', 'Generalize it to any GA4 funnel, not just this store'] },
    ],
  },

  // 9 — GA4 retention: nested cohort, advanced.
  {
    id: 'cc-009-ga4-retention',
    slug: 'ga4-retention-cohort',
    title: 'Which acquisition cohort comes back',
    difficulty: 'hard',
    estimatedMinutes: 55,
    paradigm: 'ai_assisted',
    bqProject: 'bigquery-public-data',
    bqDataset: 'ga4_obfuscated_sample_ecommerce',
    scenario: {
      context: 'Same GA4 export. Retention is whether a user returns in the days after first being seen. First-seen date and acquisition channel both have to be derived from the event stream across day-sharded tables.',
      trigger: 'Marketing wants to know which acquisition channels bring users who come back, not just users who land once. Only the raw GA4 events are available.',
      question: 'Build a day-N return cohort by first-seen date, and say which acquisition channel produces the best returning users.',
    },
    claudeMd: [
      '# GA4 sample — retention by acquisition cohort',
      '',
      'Daily-sharded `events_YYYYMMDD`. Derive each `user_pseudo_id` first-seen date',
      'from `MIN(event_date)`, the acquisition channel from the first-touch',
      '`traffic_source`, and a return as any session on a later day.',
      '',
      'Goal: a Day-1 / Day-7 return rate by signup cohort, then split by acquisition',
      'channel. Bound the shards with `_TABLE_SUFFIX`. Inspect the schema first and',
      'decide what counts as a return before writing the cohort query.',
      '',
      'Dataset: `bigquery-public-data.ga4_obfuscated_sample_ecommerce`.',
    ].join('\n'),
    subProblems: [
      { id: 'explore_schema', objective: 'Inspect the shard; find user_pseudo_id, event_date/timestamp, and the traffic_source record.', successCriterion: 'Name the columns used for first-seen, return, and acquisition channel.', suggestedPrompts: ['Show the schema and the traffic_source fields', 'How do I get each user first-seen date from the shards?'] },
      { id: 'data_layout', objective: 'Bound the shard range and confirm the day grain.', successCriterion: 'State the _TABLE_SUFFIX window and the day grain used for cohorts.', suggestedPrompts: ['Bound the events_ range with _TABLE_SUFFIX', 'Confirm one row per event and how to roll up to per-user-per-day'] },
      { id: 'analyze', objective: 'Compute Day-1 and Day-7 return rate by first-seen cohort.', successCriterion: 'State the overall Day-7 return rate and how it varies across cohorts.', suggestedPrompts: ['Compute Day-1 and Day-7 return rate by signup cohort', 'Show the retention curve across cohorts'] },
      { id: 'segment', objective: 'Split retention by acquisition channel.', successCriterion: 'Name the best and worst channel for returning users, with numbers.', suggestedPrompts: ['Break Day-7 retention down by acquisition channel', 'Which channel brings the stickiest users?'] },
      { id: 'answer', objective: 'Recommend where to shift acquisition spend, with the retention numbers and a guardrail.', successCriterion: 'Paste a finding: channel + retention number + recommendation + guardrail.', suggestedPrompts: ['Summarize which channel to invest in for retention', 'What guardrail catches a channel that brings volume but no retention?'] },
    ],
  },

  // 10 — NYC taxi fare anomaly: large table, anomaly detection + bounded-scan
  //      discipline. Distinct business case from cc-007 (supply/demand). Verified
  //      a one-month daily aggregate scans ~0.87 GB, well under the 2 GB cap, so
  //      the intended query is runnable (crypto_bitcoin was ~11 GB/query and would
  //      hit the cap, so it was swapped out).
  {
    id: 'cc-010-taxi-fare-anomaly',
    slug: 'nyc-taxi-fare-anomaly',
    title: 'Spot the day fares went weird',
    difficulty: 'hard',
    estimatedMinutes: 50,
    paradigm: 'ai_assisted',
    bqProject: 'bigquery-public-data',
    bqDataset: 'new_york_taxi_trips',
    scenario: {
      context: 'A taxi operations team watches daily fare and tip behavior for billing integrity. Every yellow-cab trip is logged per year with pickup time, fare, tip, distance, and passenger count. The yearly tables are large, so scans must be bounded to a window.',
      trigger: 'Finance flagged a day where the average fare looked off and wants it confirmed and explained from the trip data, not the summary dashboard. Only the raw trip tables are available.',
      question: 'Find the day in the window where fare or tip behavior is anomalous, and decide whether it is a real event, a data-quality artifact, or normal variance.',
    },
    claudeMd: [
      '# NYC taxi — fare/tip anomaly',
      '',
      'Yellow-cab trips live in per-year tables, e.g. `tlc_yellow_trips_2022`. One row',
      'per trip: `pickup_datetime`, `fare_amount`, `tip_amount`, `trip_distance`,',
      '`passenger_count`, `total_amount`.',
      '',
      'These tables are large. Filter `pickup_datetime` to ONE month so the scan stays',
      'bounded, and select only the columns you need. Goal: build a daily series of',
      'average fare, average tip rate, and trip count, flag the outlier day, then decide',
      'if it is a real event, a data-quality artifact (e.g. a fare-amount spike that is',
      'clearly bad data), or normal variance.',
      '',
      'Dataset: `bigquery-public-data.new_york_taxi_trips` (table `tlc_yellow_trips_2022`).',
    ].join('\n'),
    subProblems: [
      { id: 'explore_schema', objective: 'Inspect tlc_yellow_trips_2022; find pickup_datetime, fare_amount, tip_amount, trip_distance.', successCriterion: 'Name the columns used for the daily fare/tip series.', suggestedPrompts: ['Show the tlc_yellow_trips_2022 schema', 'Show 5 sample trips with fare and tip'] },
      { id: 'data_layout', objective: 'Bound the query to one month of pickup_datetime so the scan stays cheap.', successCriterion: 'State the month chosen and why bounding the date keeps bytes scanned low.', suggestedPrompts: ['Filter pickup_datetime to a single month', 'Why does selecting fewer columns and a tight date keep the scan small?'] },
      { id: 'analyze', objective: 'Build a daily series of average fare, average tip rate, and trip count; flag the outlier.', successCriterion: 'Name the anomalous day and the metric that moved, e.g. "avg fare 2.3x on Mar 14".', suggestedPrompts: ['Daily average fare, tip rate, and trip count for the month', 'Which day is the clearest outlier and on which metric?'] },
      { id: 'segment', objective: 'Test whether the anomaly is broad or driven by a few extreme trips / bad rows.', successCriterion: 'State whether it is a real shift or a data-quality artifact, with numbers.', suggestedPrompts: ['Is the spike from many trips or a few extreme fare_amount values?', 'Check for impossible values (negative or huge fares) on that day'] },
      { id: 'answer', objective: 'Conclude real vs artifact vs variance, with the numbers, and name a monitor.', successCriterion: 'Paste a finding: the day, the magnitude, the verdict, and a monitoring rule.', suggestedPrompts: ['Summarize the anomaly and whether it is real or bad data', 'What automated rule would flag a day like this?'] },
      { id: 'skill', objective: 'Encode the bounded daily-series + outlier-flag pattern as a reusable skill.', successCriterion: 'Confirm the skill filename.', suggestedPrompts: ['Write .claude/skills/anomaly-scan.md for bounded daily anomaly detection', 'Generalize it to any large event table with a timestamp'] },
    ],
  },
]

// ──────────────────────────────────────────────────────────────────────────────

function buildRow(c: ChallengeSeed) {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    challenge_type: 'claude_code_analytics',
    difficulty: c.difficulty,
    estimated_minutes: c.estimatedMinutes,
    is_published: true,
    paradigm: c.paradigm,
    domain_id: ANALYTICS_DOMAIN_ID,
    scenario_context: c.scenario.context,
    scenario_trigger: c.scenario.trigger,
    scenario_question: c.scenario.question,
    company_tags: c.companyTags ?? [],
    metadata: {
      claude_code: {
        BQ_PROJECT: c.bqProject,
        BQ_DATASET: c.bqDataset,
        claude_md: c.claudeMd,
        sub_problems: c.subProblems,
      },
    },
  }
}

async function main() {
  let ok = 0
  for (const c of CHALLENGES) {
    const row = buildRow(c)
    const { error } = await sb.from('challenges').upsert(row, { onConflict: 'id' })
    if (error) {
      console.error(`FAIL ${c.id}:`, error.message)
    } else {
      ok++
      console.log(`upserted ${c.id} (${c.bqProject}.${c.bqDataset}, ${c.difficulty})`)
    }
  }
  console.log(`\n${ok}/${CHALLENGES.length} analytics challenges seeded.`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
