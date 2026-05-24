import { createHash } from 'node:crypto'
import { getLiveInterviewDisciplineContract } from '@/lib/live-interview/discipline-contracts'
import { normalizeDiscipline, type LiveInterviewDiscipline } from '@/lib/live-interview/disciplines'
import type { LiveInterviewArtifactSnapshot } from '@/lib/live-interview/snapshot-schema'

export type WorkspaceSignalState =
  | 'missing'
  | 'empty'
  | 'thin'
  | 'started'
  | 'substantive'
  | 'failed_tests'
  | 'passing_signal'

export interface LiveWorkspaceSignal {
  state: WorkspaceSignalState
  type: 'canvas' | 'editor' | 'none'
  discipline: LiveInterviewDiscipline
  digest: string
  summary: string
  evidence: string[]
  gaps: string[]
  nextProbe: string
}

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}

function digestFor(value: unknown) {
  return createHash('sha1').update(safeJson(value)).digest('hex').slice(0, 16)
}

function labelText(snapshot: LiveInterviewArtifactSnapshot) {
  const fromLabels = Array.isArray(snapshot.textLabels) ? snapshot.textLabels : []
  const fromScene = snapshot.sceneSummary
    ? [
        ...snapshot.sceneSummary.entities.map((entity) => entity.label),
        ...snapshot.sceneSummary.freeText,
        ...snapshot.sceneSummary.connections.map((connection) => [connection.from, connection.to, connection.label].filter(Boolean).join(' -> ')),
      ]
    : []
  return [...new Set([...fromLabels, ...fromScene].map((label) => label.trim()).filter(Boolean))].slice(0, 24)
}

function runResultText(runResult: unknown) {
  if (!runResult) return ''
  if (typeof runResult === 'string') return runResult.toLowerCase()
  return safeJson(runResult).toLowerCase()
}

function classifyRunResult(runResult: unknown): 'none' | 'failed' | 'passing' {
  if (!runResult) return 'none'
  if (typeof runResult === 'object' && runResult !== null) {
    const record = runResult as Record<string, unknown>
    const passed = typeof record.testsPassed === 'number' ? record.testsPassed : null
    const total = typeof record.testsTotal === 'number' ? record.testsTotal : null
    if (total && passed === total && total > 0) return 'passing'
    if (total && passed !== null && passed < total) return 'failed'
  }

  const text = runResultText(runResult)
  if (/\b(fail|failed|error|exception|timeout|wrong answer)\b/.test(text)) return 'failed'
  if (/\b(pass|passed|success|accepted)\b/.test(text)) return 'passing'
  return 'none'
}

function dataModelGaps(snapshot: LiveInterviewArtifactSnapshot) {
  const scene = snapshot.sceneSummary
  const labels = labelText(snapshot).join(' ').toLowerCase()
  const entities = scene?.entities ?? []
  const hasPk = entities.some((entity) => entity.columns.some((column) => column.constraints.includes('PK'))) || /\bpk\b|primary key/.test(labels)
  const hasFk = (scene?.foreignKeys.length ?? 0) > 0 || entities.some((entity) => entity.columns.some((column) => column.constraints.includes('FK'))) || /\bfk\b|foreign key/.test(labels)
  const hasCardinality = /\b(1:1|1:n|n:1|m:n|one-to-many|many-to-many|cardinality)\b/i.test(labels)
  const hasGrain = /\b(grain|row|per )\b/.test(labels)
  const gaps: string[] = []
  if (!hasGrain) gaps.push('state the row grain')
  if (!hasPk) gaps.push('mark primary keys')
  if (!hasFk) gaps.push('show foreign keys or relationships')
  if (!hasCardinality) gaps.push('add cardinality')
  return gaps
}

function systemDesignGaps(snapshot: LiveInterviewArtifactSnapshot) {
  const labels = labelText(snapshot).join(' ').toLowerCase()
  const scene = snapshot.sceneSummary
  const componentCount = scene?.entities.length ?? (snapshot.textLabels?.length ?? 0)
  const hasFlow = (scene?.connections.length ?? 0) > 0 || /\b(api|event|queue|stream|request|flow|writes?|reads?)\b/.test(labels)
  const hasScale = /\b(scale|latency|qps|throughput|cache|partition|shard|fail|retry|fallback|observability|monitor)\b/.test(labels)
  const gaps: string[] = []
  if (componentCount < 3) gaps.push('add the core components')
  if (!hasFlow) gaps.push('trace one request or data flow')
  if (!hasScale) gaps.push('name a scale or failure constraint')
  return gaps
}

function editorLines(code: string | undefined) {
  const trimmed = code?.trim() ?? ''
  if (!trimmed) return 0
  return trimmed.split(/\r?\n/).length
}

export function buildLiveWorkspaceSignal(
  snapshot?: LiveInterviewArtifactSnapshot | null,
  fallbackDiscipline?: LiveInterviewDiscipline | string | null,
): LiveWorkspaceSignal {
  const discipline = normalizeDiscipline(snapshot?.discipline ?? fallbackDiscipline ?? null) ?? 'product_sense'
  const contract = getLiveInterviewDisciplineContract(discipline)

  if (!snapshot) {
    return {
      state: 'missing',
      type: 'none',
      discipline,
      digest: 'missing',
      summary: 'No workspace snapshot has been captured yet.',
      evidence: [],
      gaps: contract.artifactKind === 'none' ? [] : [contract.minimumUsefulArtifact],
      nextProbe: contract.emptyReply,
    }
  }

  if (snapshot.type === 'canvas') {
    const elementCount = snapshot.sceneSummary?.elementCount ?? snapshot.elementCount ?? 0
    const labels = labelText(snapshot)
    const entityCount = snapshot.sceneSummary?.entities.length ?? 0
    const connectionCount = snapshot.sceneSummary?.connections.length ?? 0
    const evidence = [
      `${elementCount} canvas elements`,
      labels.length ? `labels: ${labels.slice(0, 6).join(', ')}` : 'no visible labels',
      entityCount ? `${entityCount} labeled components/entities` : '',
      connectionCount ? `${connectionCount} connections` : '',
    ].filter(Boolean)

    if (elementCount === 0) {
      return {
        state: 'empty',
        type: 'canvas',
        discipline,
        digest: digestFor(snapshot),
        summary: 'Canvas is open but empty.',
        evidence,
        gaps: [contract.minimumUsefulArtifact],
        nextProbe: contract.emptyReply,
      }
    }

    const gaps = discipline === 'data_modeling'
      ? dataModelGaps(snapshot)
      : systemDesignGaps(snapshot)
    const state: WorkspaceSignalState =
      gaps.length === 0 && elementCount >= 3
        ? 'substantive'
        : elementCount >= 3 || labels.length >= 2
          ? 'started'
          : 'thin'

    return {
      state,
      type: 'canvas',
      discipline,
      digest: digestFor(snapshot),
      summary: `${discipline === 'data_modeling' ? 'Data model' : 'System design'} canvas has ${elementCount} elements${labels.length ? ` and labels ${labels.slice(0, 6).join(', ')}` : ''}.`,
      evidence,
      gaps,
      nextProbe: gaps.length ? `Next, ${gaps[0]}.` : 'Stress-test the first bottleneck or rule.',
    }
  }

  const code = typeof snapshot.code === 'string' ? snapshot.code : ''
  const language = snapshot.language ?? (discipline === 'sql' ? 'sql' : 'code')
  const lines = editorLines(code)
  const runState = classifyRunResult(snapshot.runResult)
  const evidence = [
    `${language} editor`,
    lines ? `${lines} lines` : 'empty editor',
    runState === 'failed' ? 'last run has failing tests/errors' : '',
    runState === 'passing' ? 'last run has passing signal' : '',
  ].filter(Boolean)

  if (!code.trim() && !snapshot.runResult) {
    return {
      state: 'empty',
      type: 'editor',
      discipline,
      digest: digestFor(snapshot),
      summary: `${language} editor is open but empty.`,
      evidence,
      gaps: [contract.minimumUsefulArtifact],
      nextProbe: contract.emptyReply,
    }
  }

  if (runState === 'failed') {
    return {
      state: 'failed_tests',
      type: 'editor',
      discipline,
      digest: digestFor(snapshot),
      summary: `${language} work has a failing test or runtime error.`,
      evidence,
      gaps: discipline === 'sql' ? ['validate joins, filters, nulls, and duplicates'] : ['debug the failing case before moving on'],
      nextProbe: discipline === 'sql'
        ? 'Point to the failing row shape: is it the join, filter, grouping, nulls, or duplicates?'
        : 'Use the failing output. What input breaks this, and which branch of your code handles it?',
    }
  }

  if (runState === 'passing') {
    return {
      state: 'passing_signal',
      type: 'editor',
      discipline,
      digest: digestFor(snapshot),
      summary: `${language} work has a passing test signal.`,
      evidence,
      gaps: discipline === 'sql' ? ['explain result grain and validation'] : ['explain complexity and edge cases'],
      nextProbe: discipline === 'sql'
        ? 'Now explain the result grain and the duplicate/null check.'
        : 'Now explain complexity and the edge case you would test next.',
    }
  }

  const sqlLooksThin = discipline === 'sql' && (
    code.trim().length < 20 ||
    !/\bselect\b/i.test(code) ||
    !/\bfrom\b/i.test(code)
  )
  const codeLooksThin = discipline !== 'sql' && (lines < 3 || code.trim().length < 40)
  const state: WorkspaceSignalState = sqlLooksThin || codeLooksThin ? 'thin' : lines >= 8 ? 'substantive' : 'started'
  const gaps = discipline === 'sql'
    ? [
        !/\bselect\b/i.test(code) ? 'write the SELECT' : '',
        !/\bfrom\b/i.test(code) ? 'name the source table' : '',
        !/\bjoin\b/i.test(code) ? 'confirm whether a join is needed' : '',
        'state the result grain',
      ].filter(Boolean)
    : [
        lines < 3 ? 'write the core logic' : '',
        'run at least one visible test',
        'name the edge case you are covering',
      ].filter(Boolean)

  return {
    state,
    type: 'editor',
    discipline,
    digest: digestFor(snapshot),
    summary: `${language} editor has ${lines} lines and no run result yet.`,
    evidence,
    gaps,
    nextProbe: state === 'thin' ? contract.thinReply : gaps[0] ? `Next, ${gaps[0]}.` : 'Talk me through the correctness check.',
  }
}

export function buildWorkspacePromptNote(signal: LiveWorkspaceSignal) {
  if (signal.state === 'missing') return ''
  return `[LIVE WORKSPACE SIGNAL]
Discipline: ${signal.discipline.replace(/_/g, ' ')}
Workspace: ${signal.type}
State: ${signal.state}
Summary: ${signal.summary}
Evidence: ${signal.evidence.length ? signal.evidence.join(' | ') : 'none'}
Gaps: ${signal.gaps.length ? signal.gaps.join(' | ') : 'none'}
Best next probe: ${signal.nextProbe}`
}

export function buildDeterministicWorkspaceReply(signal: LiveWorkspaceSignal, message = '') {
  const words = message.trim().split(/\s+/).filter(Boolean)
  const contract = getLiveInterviewDisciplineContract(signal.discipline)
  const doneLike = /\b(done|finished|submit|ready|that's it|that is it|idk|not sure)\b/i.test(message)
  if (signal.state === 'empty' && (doneLike || words.length <= 4)) return contract.emptyReply
  if (signal.state === 'thin' && (doneLike || words.length <= 8)) return contract.thinReply
  return null
}

export function isSubstantiveWorkspaceSignal(signal: LiveWorkspaceSignal) {
  return ['substantive', 'failed_tests', 'passing_signal'].includes(signal.state)
}
