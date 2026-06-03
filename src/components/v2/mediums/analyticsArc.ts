// The default analyst-course arc for Claude Code Analytics challenges.
//
// This is the single source of truth for the generic teaching copy (MCP setup,
// schema exploration, data layout, reporting, skill construction). A specific
// challenge can override any step by id via its metadata.sub_problems; missing
// steps fall back to this arc. Beginner challenges run BEGINNER_ARC (a subset);
// advanced run the full arc.

import type { AnalyticsSubProblem } from './types'

export const DEFAULT_ANALYTICS_ARC: AnalyticsSubProblem[] = [
  {
    id: 'mcp_setup',
    sequence: 1,
    title: 'Connect the data tools',
    objective: 'Give Claude the BigQuery tools it needs to list, inspect, and query the dataset.',
    successCriterion: 'The connection shows Connected, and you paste the line confirming the bigquery server is registered.',
    suggestedPrompts: [
      'claude mcp add bigquery -- bq-mcp',
      'What MCP servers are connected right now?',
      'Use the bigquery tools to confirm you can reach the dataset',
    ],
    kind: 'mcp_setup',
    rubricDimension: 'connection_setup',
    teachingNote:
      'MCP is the protocol that gives Claude real tools instead of guesses. Adding the BigQuery MCP lets it list tables, read schemas, and run SQL against the live dataset. You run the add command once, then every step after this uses those tools.',
  },
  {
    id: 'explore_schema',
    sequence: 2,
    title: 'See what data exists',
    objective: 'List the tables, then inspect one table’s columns and types before writing any analysis query.',
    successCriterion: 'Paste the column list (name and type) of the main events table.',
    suggestedPrompts: [
      'List the datasets and tables available through the bigquery MCP',
      'Get the table info for the events table, columns and types',
      'Show me 5 sample rows so I understand the grain of this table',
    ],
    kind: 'explore_schema',
    rubricDimension: 'problem_framing',
    teachingNote:
      'Good analysis starts by looking, not guessing. Read the schema first so you know which columns exist and what one row represents. The grain (one row per event? per session?) decides every query that follows.',
    learnChecklist: [
      'Which tables exist in the dataset',
      'The columns and types of the events table',
      'The grain: one row per what?',
    ],
  },
  {
    id: 'data_layout',
    sequence: 3,
    title: 'Understand the layout',
    objective: 'Check the row count and how the table is partitioned so your queries stay fast and cheap.',
    successCriterion: 'State the row count and the partition or date column, e.g. "8.2M rows, partitioned on event_date".',
    suggestedPrompts: [
      'How many rows are in the events table, and what is it partitioned on?',
      'Which column should I filter on to avoid scanning the whole table?',
    ],
    kind: 'data_layout',
    rubricDimension: 'problem_framing',
    teachingNote:
      'Tables this size are split into partitions, usually by date. If you filter on the partition column, the query only reads the slices it needs and stays fast and cheap. Find that column now so every later query uses it.',
    learnChecklist: [
      'Roughly how many rows',
      'The partition column (usually a date)',
      'Why filtering on it keeps queries cheap',
    ],
  },
  {
    id: 'analyze',
    sequence: 4,
    title: 'Find the overall drop',
    objective: 'Measure step-by-step conversion and rank where the largest drop happens.',
    successCriterion: 'State the worst step and its drop, e.g. "Cart to checkout: 42% drop".',
    suggestedPrompts: [
      'Compute the conversion rate between each funnel step',
      'Which step has the biggest drop-off, with the percentage?',
    ],
    kind: 'analyze',
    rubricDimension: 'query_rigor',
    teachingNote:
      'Isolate the cause, do not restate the symptom. Rank the steps by drop so you know exactly where the funnel leaks before you start segmenting.',
  },
  {
    id: 'segment',
    sequence: 5,
    title: 'Break it apart',
    objective: 'Segment the worst step by a dimension like device or region to find where the drop concentrates.',
    successCriterion: 'State the segmented read, e.g. "Mobile cart-to-checkout 31% vs desktop 68%".',
    suggestedPrompts: [
      'Break the worst step down by device type',
      'Compare mobile vs desktop conversion at the drop step',
    ],
    kind: 'segment',
    rubricDimension: 'segmentation',
    teachingNote:
      'An aggregate hides the story. Segmenting by device, region, or cohort is how you turn "the funnel drops" into "the funnel drops for mobile users at payment entry".',
  },
  {
    id: 'answer',
    sequence: 6,
    title: 'Land the answer',
    objective: 'Write the one-paragraph finding: the cause, the number that proves it, a recommended change, and a guardrail metric.',
    successCriterion: 'Paste your finding paragraph with a cause, a number, and a recommendation.',
    suggestedPrompts: [
      'Summarize the cause, the number that proves it, and one recommended change',
      'What guardrail metric would tell us if the fix backfired?',
    ],
    kind: 'answer',
    rubricDimension: 'communication',
    teachingNote:
      'A finding without a number is an opinion. State the cause, cite the metric that proves it, recommend one change, and name the guardrail you would watch so a fix that backfires is caught.',
  },
  {
    id: 'report',
    sequence: 7,
    title: 'Generate the report',
    objective: 'Have Claude write the finding and the supporting queries to a report file in the workspace.',
    successCriterion: 'Confirm the report file path, e.g. /workspace/report.md.',
    suggestedPrompts: [
      'Write the finding and the queries you ran to /workspace/report.md',
      'Add the segmented numbers as a table in the report',
    ],
    kind: 'report',
    rubricDimension: 'evidence',
    teachingNote:
      'A report is the deliverable a stakeholder reads. Capturing the finding plus the exact queries makes the analysis reproducible and is the artifact you can share as proof of the work.',
  },
  {
    id: 'skill',
    sequence: 8,
    title: 'Write a skill',
    objective: 'Encode the reusable analysis as a .claude/skills file so the next session inherits it.',
    successCriterion: 'Confirm the skill file name you wrote.',
    suggestedPrompts: [
      'Write a .claude/skills/funnel-analyst.md that captures these steps',
      'Make the skill generalize to any funnel, not just this dataset',
    ],
    kind: 'skill',
    rubricDimension: 'skill_construction',
    teachingNote:
      'Teaching Claude a skill is the move that compounds. Encode what you just learned as a reusable check and every future session starts smarter, on any dataset.',
  },
]

// Beginner challenges run a shorter arc that still covers the full loop end to
// end (setup, explore, analyze, answer) without the deeper layout/segment/report
// /skill steps. Advanced challenges run the full DEFAULT_ANALYTICS_ARC.
const BEGINNER_KINDS = new Set(['mcp_setup', 'explore_schema', 'analyze', 'answer'])

export function arcForDifficulty(difficulty?: string | null): AnalyticsSubProblem[] {
  const isBeginner = (difficulty ?? '').toLowerCase() === 'beginner'
  const steps = isBeginner
    ? DEFAULT_ANALYTICS_ARC.filter((s) => BEGINNER_KINDS.has(s.kind))
    : DEFAULT_ANALYTICS_ARC
  // Re-sequence so the stepper numbering is contiguous after filtering.
  return steps.map((s, i) => ({ ...s, sequence: i + 1 }))
}

/**
 * Merge per-challenge overrides (from metadata.sub_problems) onto the default
 * arc by id. Anything the challenge does not supply falls back to the default,
 * so the generic MCP/EDA/report teaching copy stays consistent everywhere while
 * a challenge can still tailor the analyze/segment/answer specifics.
 */
export function mergeArc(
  difficulty: string | null | undefined,
  overrides: Partial<AnalyticsSubProblem>[] | undefined,
): AnalyticsSubProblem[] {
  const base = arcForDifficulty(difficulty)
  if (!overrides?.length) return base
  const byId = new Map(overrides.filter((o) => o.id).map((o) => [o.id as string, o]))
  return base.map((step) => {
    const ov = byId.get(step.id)
    return ov ? { ...step, ...ov, kind: step.kind, sequence: step.sequence } : step
  })
}
