// analyticsArtifact — the single source of truth for the session's deliverable.
//
// The "artifact spine" is the row of milestones a session fills as it runs,
// derived purely from signals the medium already tracks (no new state, no
// backend): the MCP/REPL connection, the marked findings per step, the report
// path, the skills written, and the final graded dimensions. The header strip
// renders these so the user always sees what is captured and what remains:
// the artifact IS the progress and IS the thing they walk out with.
//
// Ported from the cc-analytics-hero worktree, rewritten for the ADAPTIVE arc:
// rows are derived by walking `subProblems` in order (not a static row list),
// so open-mode compression, beginner subsets, and mid-session injections
// (Regroup/Stretch steps) all appear in the spine automatically.

import type {
  AnalyticsSubProblem,
  ArtifactRow,
  ArtifactRowKey,
  MarkedFinding,
} from './types'
import type { AnalystDimensionView } from '@/lib/coding-grading/analyst-rubric'
import type { LabSpineConfig } from '@/lib/labs/types'

interface DeriveArgs {
  /** Lab spine config (kind→row + row labels). Defaults to the analytics lab. */
  spine?: LabSpineConfig
  scenarioQuestion?: string | null
  mcpConnected: boolean
  replRunning: boolean
  markedFindings: MarkedFinding[]
  reportPath?: string | null
  skillsWritten: string[]
  dimensions?: AnalystDimensionView[] | null
  /** The live arc, in order — including any injected adaptive steps. */
  subProblems: AnalyticsSubProblem[]
  /** The active step id, to mark the current in-progress row as 'active'. */
  activeStepId?: string | null
}

const DEFAULT_ROW_META: Partial<Record<ArtifactRowKey, { label: string; icon: string; accent?: boolean }>> = {
  question:   { label: 'Question',   icon: 'help' },
  connection: { label: 'Connected',  icon: 'database', accent: true }, // tools / MCP
  schema:     { label: 'Schema',     icon: 'table' },
  drop:       { label: 'The drop',   icon: 'trending_down' },
  segment:    { label: 'Segment',    icon: 'splitscreen' },
  verdict:    { label: 'Verdict',    icon: 'gavel' },
  report:     { label: 'Report',     icon: 'description' },
  skill:      { label: 'Skill',      icon: 'construction', accent: true }, // the differentiator
  grade:      { label: 'Grade',      icon: 'workspace_premium' },
}

// kind → evidence row key for the standard analyst phases. The three data-
// orientation kinds all dedupe into one `schema` row (open-mode compression
// replaces two steps with map_the_data; the spine shows one milestone either way).
const DEFAULT_KIND_TO_ROW: Record<string, ArtifactRowKey> = {
  mcp_setup: 'connection',
  connect: 'connection',
  explore_schema: 'schema',
  data_layout: 'schema',
  map_the_data: 'schema',
  analyze: 'drop',
  segment: 'segment',
  answer: 'verdict',
  report: 'report',
  skill: 'skill',
}

/** Short label for a stretch step (its title, clipped for the 48px strip). */
function shortTitle(title: string, max = 18): string {
  return title.length <= max ? title : title.slice(0, max - 1).trimEnd() + '…'
}

function passOrPartialText(findings: MarkedFinding[], stepIds: string[]): string | undefined {
  for (const f of findings) {
    if (stepIds.includes(f.id) && (f.verdict === 'pass' || f.verdict === 'partial')) return f.text
  }
  return undefined
}

export function deriveArtifactRows(args: DeriveArgs): ArtifactRow[] {
  const {
    scenarioQuestion, mcpConnected, replRunning, markedFindings,
    reportPath, skillsWritten, dimensions, subProblems, activeStepId,
  } = args
  const KIND_TO_ROW = (args.spine?.kindToRow ?? DEFAULT_KIND_TO_ROW) as Record<string, ArtifactRowKey>
  const ROW_META = args.spine?.rowMeta ?? DEFAULT_ROW_META

  const rows: ArtifactRow[] = []

  // Bookend: the question.
  rows.push({
    key: 'question',
    label: 'Question',
    icon: 'help',
    state: scenarioQuestion?.trim() ? 'filled' : 'pending',
    value: scenarioQuestion?.trim() || undefined,
  })

  // Walk the live arc in order. Standard kinds dedupe by row key (all steps
  // backing the same milestone contribute their ids); adaptive kinds emit a
  // per-step row at their arc position.
  const seenRowIdx = new Map<ArtifactRowKey, number>()

  for (const step of subProblems) {
    const kind = step.kind as string

    if (kind === 'scaffold_explainer') {
      rows.push({
        key: 'regroup',
        label: 'Regroup',
        icon: 'support',
        state: 'pending',
        stepId: step.id,
        badge: 'Regroup',
        ariaTitle: step.title,
        value: passOrPartialText(markedFindings, [step.id]),
      })
      continue
    }
    if (kind === 'stakeholder_tension' || kind === 'metric_definition') {
      rows.push({
        key: 'stretch',
        label: shortTitle(step.title),
        icon: kind === 'stakeholder_tension' ? 'forum' : 'straighten',
        state: 'pending',
        stepId: step.id,
        badge: 'Stretch',
        accent: true,
        ariaTitle: step.title,
        value: passOrPartialText(markedFindings, [step.id]),
      })
      continue
    }

    const rowKey = KIND_TO_ROW[kind]
    if (!rowKey) continue
    const meta = ROW_META[rowKey]
    if (!meta) continue

    if (seenRowIdx.has(rowKey)) {
      // Another step backs the same milestone (e.g. explore_schema +
      // data_layout both → schema). Its id joins the row via stepIdsByRow
      // below, so any backing step can fill or activate the row.
      continue
    }
    seenRowIdx.set(rowKey, rows.length)
    rows.push({
      key: rowKey,
      label: meta.label,
      icon: meta.icon,
      state: 'pending',
      accent: meta.accent,
      stepId: step.id,
      ariaTitle: step.title,
    })
  }

  // Bookend: the grade.
  rows.push({
    key: 'grade',
    label: 'Grade',
    icon: 'workspace_premium',
    state: dimensions && dimensions.length > 0 ? 'filled' : 'pending',
  })

  // Fill + activate. Evidence rows fill from findings on ANY step backing the
  // row's milestone; connection/report/skill fill from their dedicated signals.
  const stepIdsByRow = new Map<number, string[]>()
  subProblems.forEach((step) => {
    const kind = step.kind as string
    const rowKey =
      kind === 'scaffold_explainer' ? 'regroup'
      : kind === 'stakeholder_tension' || kind === 'metric_definition' ? 'stretch'
      : KIND_TO_ROW[kind]
    if (!rowKey) return
    const idx = rows.findIndex((r) =>
      r.key === rowKey && (r.key !== 'regroup' && r.key !== 'stretch' ? true : r.stepId === step.id),
    )
    if (idx < 0) return
    const list = stepIdsByRow.get(idx) ?? []
    list.push(step.id)
    stepIdsByRow.set(idx, list)
  })

  rows.forEach((row, idx) => {
    const backingIds = stepIdsByRow.get(idx) ?? []
    switch (row.key) {
      case 'question':
      case 'grade':
        return
      case 'connection':
        row.state = mcpConnected && replRunning ? 'filled' : row.state
        row.value = mcpConnected && replRunning ? 'BigQuery live' : undefined
        break
      case 'report':
        if (reportPath) { row.state = 'filled'; row.value = reportPath }
        break
      case 'skill':
        if (skillsWritten.length > 0) { row.state = 'filled'; row.value = skillsWritten[0] }
        break
      default: {
        const text = passOrPartialText(markedFindings, backingIds)
        if (text) { row.state = 'filled'; row.value = text }
      }
    }
    // The active step's row pulses — keyed by step id so an injected scaffold
    // at the active index activates ITS row, not a sibling of the same kind.
    if (row.state !== 'filled' && activeStepId && backingIds.includes(activeStepId)) {
      row.state = 'active'
    }
  })

  return rows
}

export function artifactProgress(rows: ArtifactRow[]): { done: number; total: number } {
  return { done: rows.filter((r) => r.state === 'filled').length, total: rows.length }
}

/**
 * Compact one-line-per-milestone state string for Hatch (capped by callers).
 * Lets the coach name the exact missing deliverable.
 */
export function artifactSummaryText(rows: ArtifactRow[]): string {
  return rows
    .map((r) => {
      const mark = r.state === 'filled' ? 'done' : r.state === 'active' ? 'IN PROGRESS' : 'pending'
      const val = r.value ? `: ${r.value.slice(0, 60)}` : ''
      return `${r.ariaTitle ?? r.label} — ${mark}${val}`
    })
    .join('\n')
}
