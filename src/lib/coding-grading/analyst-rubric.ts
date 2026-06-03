// lib/coding-grading/analyst-rubric.ts
//
// The analyst_v1 rubric for Claude Code Analytics sessions. Seven weighted
// dimensions; weights sum to 1.0. Each dimension scores 1.0 / 0.5 / 0.0
// (strong / partial / needs_work). The headline dimension is skill_construction
// — it rewards the user teaching the agent via .claude/skills/*.md, the move the
// whole feature exists to build.

export interface AnalystDimension {
  key: string
  label: string
  weight: number
  /** What earns each score band, fed to the grader prompt. */
  anchors: { strong: string; partial: string; needs_work: string }
}

export const ANALYST_DIMENSIONS: AnalystDimension[] = [
  {
    key: 'problem_framing',
    label: 'Problem framing',
    weight: 0.15,
    anchors: {
      strong: 'Asked the right first question and inspected the schema before querying. Framed what to find, not just what to run.',
      partial: 'Started querying with a reasonable goal but skipped orienting on the data first.',
      needs_work: 'Dove into queries with no framing; restated the prompt without sharpening it.',
    },
  },
  {
    key: 'connection_setup',
    label: 'Connection and setup',
    weight: 0.10,
    anchors: {
      strong: 'Connected the BigQuery MCP and confirmed the dataset and tables before analysis.',
      partial: 'Connected eventually but fumbled the setup or worked partly blind.',
      needs_work: 'Never got the dataset connected, or queried without confirming what was there.',
    },
  },
  {
    key: 'query_rigor',
    label: 'Query rigor',
    weight: 0.20,
    anchors: {
      strong: 'Queries isolate the cause: ranked the funnel steps and quantified the drop with real numbers from the data.',
      partial: 'Queried the right area but restated the symptom rather than isolating where it happens.',
      needs_work: 'Queries were off-target, broken, or never produced a usable result.',
    },
  },
  {
    key: 'segmentation',
    label: 'Segmentation',
    weight: 0.15,
    anchors: {
      strong: 'Broke the funnel down past the aggregate (device, region, cohort) and located where the drop concentrates.',
      partial: 'Attempted one segmentation but did not land a clear comparative read.',
      needs_work: 'Stayed at the aggregate; never segmented.',
    },
  },
  {
    key: 'evidence',
    label: 'Evidence',
    weight: 0.15,
    anchors: {
      strong: 'Every claim is backed by a number pulled from the data, not a guess.',
      partial: 'Mixed real numbers with unsupported assertions.',
      needs_work: 'Conclusions rest on assumptions the data does not show.',
    },
  },
  {
    key: 'communication',
    label: 'Communication of the finding',
    weight: 0.15,
    anchors: {
      strong: 'Landed a crisp answer to the original question, with a recommended change and a named guardrail metric and threshold.',
      partial: 'Stated a finding but the recommendation or guardrail is vague.',
      needs_work: 'No clear answer to the question that was asked.',
    },
  },
  {
    key: 'skill_construction',
    label: 'Skill construction',
    weight: 0.10,
    anchors: {
      strong: 'Wrote a .claude/skills/*.md file that encodes a reusable, generalizing check (not a throwaway note) so the next session inherits the pattern.',
      partial: 'Wrote a skill file but it is thin, session-specific, or does not generalize.',
      needs_work: 'No skill written; nothing about the session compounds.',
    },
  },
]

// Sanity: weights sum to 1.0 (guards against future edits drifting).
const WEIGHT_SUM = ANALYST_DIMENSIONS.reduce((s, d) => s + d.weight, 0)
if (Math.abs(WEIGHT_SUM - 1) > 1e-9) {
  throw new Error(`analyst-rubric weights must sum to 1.0, got ${WEIGHT_SUM}`)
}

export type DimensionScore = 0 | 0.5 | 1

export interface AnalystDimensionResult {
  score: DimensionScore
  evidence: string
  note: string
}

export type AnalystDimensionResults = Record<string, AnalystDimensionResult>

/** Weighted 0-100 total from per-dimension 0/0.5/1 scores. */
export function computeAnalystScore(results: AnalystDimensionResults): number {
  let acc = 0
  for (const d of ANALYST_DIMENSIONS) {
    const s = results[d.key]?.score ?? 0
    acc += d.weight * s
  }
  return Math.round(acc * 100)
}

/** Maps a 0-100 total to the grade label used across the product. */
export function analystGradeLabel(total: number): string {
  if (total >= 80) return 'Sharp'
  if (total >= 55) return 'Solid'
  if (total >= 30) return 'Surface'
  return 'Missed'
}

/**
 * Serializable, display-ready view of one graded dimension. Joins the grader's
 * raw score/note with the rubric's label + weight. Used by the session mirror,
 * the share page, and the OG image so they render dimensions identically.
 */
export interface AnalystDimensionView {
  key: string
  label: string
  weight: number
  score: DimensionScore
  note: string
}

/**
 * Turn a final_artifact's `dimensions` map into ordered, labeled views. Returns
 * null when the artifact isn't analyst_v1 or has no dimensions, so callers can
 * cleanly omit the chart. Tolerant of partial/missing dimension entries.
 */
export function toDimensionViews(finalArtifact: unknown): AnalystDimensionView[] | null {
  const fa = (finalArtifact ?? {}) as { rubric?: unknown; dimensions?: unknown }
  if (fa.rubric !== 'analyst_v1') return null
  const dims = (fa.dimensions ?? {}) as Record<string, { score?: unknown; note?: unknown }>
  if (!dims || typeof dims !== 'object') return null
  const views: AnalystDimensionView[] = []
  for (const d of ANALYST_DIMENSIONS) {
    const entry = dims[d.key]
    if (!entry) continue
    const raw = typeof entry.score === 'number' ? entry.score : Number(entry.score)
    const score: DimensionScore = raw >= 0.75 ? 1 : raw >= 0.25 ? 0.5 : 0
    views.push({
      key: d.key,
      label: d.label,
      weight: d.weight,
      score,
      note: String(entry.note ?? ''),
    })
  }
  return views.length ? views : null
}
