import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IS_MOCK } from '@/lib/mock'

type FlowMove = 'frame' | 'list' | 'optimize' | 'win'
type DisciplineKey = 'product_sense' | 'system_design' | 'data_modeling' | 'sql' | 'coding'
type Trend = 'improving' | 'declining' | 'steady' | 'insufficient_data'
type SourceType = 'challenge' | 'workspace' | 'live_interview' | 'interview_loop'

interface ChallengeJoin {
  title?: string | null
  challenge_type?: string | null
}

interface AttemptRow {
  id: string
  challenge_id: string
  total_score: number | null
  max_score: number | null
  completed_at: string | null
  feedback_json: unknown
  challenges?: ChallengeJoin | ChallengeJoin[] | null
}

interface StepAttemptRow {
  attempt_id: string
  step: string
  score: number | null
  grading_explanation: string | null
  competency_signal?: { signal?: string; framework_hint?: string } | null
  created_at: string | null
}

interface InterviewGradeRow {
  attempt_id: string
  challenge_type: string
  overall_score: number | null
  rubric_scores: unknown
  top_strength: string | null
  top_improvement: string | null
  graded_at: string | null
}

interface LiveSessionRow {
  id: string
  challenge_id: string | null
  loop_id: string | null
  round_index: number | null
  status: string
  ended_at: string | null
  started_at: string | null
  debrief_json: unknown
  flow_coverage: unknown
}

interface LoopRoundRow {
  session_id: string | null
  discipline: string
  round_score: number | null
  round_debrief_json: unknown
  completed_at: string | null
}

interface SignalEvent {
  id: string
  discipline: DisciplineKey
  move: FlowMove
  score: number
  source: SourceType
  sourceLabel: string
  title: string
  evidence: string | null
  href: string
  occurredAt: string
}

interface TrajectoryCell {
  score: number | null
  trend: Trend
  delta: number
  sampleSize: number
  confidence: number
  history: number[]
  latestEvidence: string | null
}

const FLOW_MOVES: FlowMove[] = ['frame', 'list', 'optimize', 'win']

const DISCIPLINES: Record<DisciplineKey, { label: string; shortLabel: string; icon: string; color: string; href: string }> = {
  product_sense: { label: 'Product sense', shortLabel: 'Product', icon: 'psychology', color: '#4a7c59', href: '/challenges?discipline=product_sense' },
  system_design: { label: 'System design', shortLabel: 'Systems', icon: 'hub', color: '#7a5c2e', href: '/challenges?discipline=system_design' },
  data_modeling: { label: 'Data modeling', shortLabel: 'Data model', icon: 'account_tree', color: '#5b6f4d', href: '/challenges?discipline=data_modeling' },
  sql: { label: 'SQL', shortLabel: 'SQL', icon: 'database', color: '#5a3a7c', href: '/challenges?discipline=sql' },
  coding: { label: 'Coding', shortLabel: 'Coding', icon: 'data_object', color: '#3a5a7c', href: '/challenges?discipline=algorithm' },
}

const DISCIPLINE_ORDER: DisciplineKey[] = ['product_sense', 'system_design', 'data_modeling', 'sql', 'coding']

function normalizeDiscipline(input: unknown): DisciplineKey {
  if (input === 'system_design') return 'system_design'
  if (input === 'data_modeling') return 'data_modeling'
  if (input === 'sql') return 'sql'
  if (input === 'algorithm' || input === 'coding') return 'coding'
  return 'product_sense'
}

function normalizeMove(input: unknown, discipline: DisciplineKey): FlowMove | null {
  if (input === 'frame' || input === 'list' || input === 'optimize' || input === 'win') return input
  if (input === 'coding') return discipline === 'sql' || discipline === 'coding' ? 'optimize' : 'win'
  return null
}

function getChallenge(row: AttemptRow): ChallengeJoin {
  const joined = row.challenges
  if (Array.isArray(joined)) return joined[0] ?? {}
  return joined ?? {}
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function normalizeScore(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return null
  if (n <= 1.05) return Math.max(0, Math.min(100, Math.round(n * 100)))
  if (n <= 5.05) return Math.max(0, Math.min(100, Math.round(n * 20)))
  return Math.max(0, Math.min(100, Math.round(n)))
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function trendFromScores(scores: number[]): { trend: Trend; delta: number } {
  if (scores.length < 2) return { trend: 'insufficient_data', delta: 0 }
  const midpoint = Math.ceil(scores.length / 2)
  const early = average(scores.slice(0, midpoint)) ?? scores[0]
  const recent = average(scores.slice(-midpoint)) ?? scores[scores.length - 1]
  const delta = Math.round(recent - early)
  if (delta >= 6) return { trend: 'improving', delta }
  if (delta <= -6) return { trend: 'declining', delta }
  return { trend: 'steady', delta }
}

function mapRubricKeyToMove(key: string): FlowMove {
  const normalized = key.toLowerCase()
  if (normalized.includes('entity') || normalized.includes('requirement') || normalized.includes('problem') || normalized.includes('completeness')) return 'frame'
  if (normalized.includes('relationship') || normalized.includes('component') || normalized.includes('coverage') || normalized.includes('approach')) return 'list'
  if (normalized.includes('schema') || normalized.includes('index') || normalized.includes('scal') || normalized.includes('correct') || normalized.includes('complex') || normalized.includes('evolution')) return 'optimize'
  if (normalized.includes('narr') || normalized.includes('clarity') || normalized.includes('collaboration') || normalized.includes('explain') || normalized.includes('communication')) return 'win'
  return 'optimize'
}

function extractRubricScore(value: unknown): number | null {
  if (typeof value === 'number') return normalizeScore(value)
  const record = toRecord(value)
  return normalizeScore(record.score)
}

function flowScoresFromDebrief(debrief: unknown): Partial<Record<FlowMove, number>> {
  const record = toRecord(debrief)
  const flowScores = toRecord(record.flowScores)
  const result: Partial<Record<FlowMove, number>> = {}
  for (const move of FLOW_MOVES) {
    const score = normalizeScore(flowScores[move])
    if (score !== null) result[move] = score
  }
  return result
}

function createBuckets(): Record<DisciplineKey, Record<FlowMove, SignalEvent[]>> {
  const buckets = {} as Record<DisciplineKey, Record<FlowMove, SignalEvent[]>>
  for (const discipline of DISCIPLINE_ORDER) {
    buckets[discipline] = {
      frame: [],
      list: [],
      optimize: [],
      win: [],
    }
  }
  return buckets
}

function pushEvent(buckets: Record<DisciplineKey, Record<FlowMove, SignalEvent[]>>, event: SignalEvent) {
  buckets[event.discipline][event.move].push(event)
}

function buildCell(events: SignalEvent[]): TrajectoryCell {
  const ordered = [...events].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime())
  const scores = ordered.map(event => event.score)
  const recentScores = scores.slice(-3)
  const score = average(recentScores)
  const { trend, delta } = trendFromScores(scores)
  const latestEvidence = ordered[ordered.length - 1]?.evidence ?? null
  return {
    score: score === null ? null : Math.round(score),
    trend,
    delta,
    sampleSize: ordered.length,
    confidence: ordered.length === 0 ? 0 : Math.min(96, 30 + ordered.length * 16),
    history: scores.slice(-6).map(s => Math.round(s)),
    latestEvidence,
  }
}

function rolePriority(roleId: string | null | undefined): DisciplineKey[] {
  const role = String(roleId ?? '').toLowerCase()
  if (role.includes('data')) return ['sql', 'data_modeling', 'system_design', 'coding', 'product_sense']
  if (role.includes('pm') || role.includes('product') || role.includes('design')) return ['product_sense', 'data_modeling', 'system_design', 'sql', 'coding']
  if (role.includes('founding')) return ['product_sense', 'coding', 'system_design', 'data_modeling', 'sql']
  if (role.includes('lead') || role.includes('manager') || role.includes('em')) return ['system_design', 'product_sense', 'coding', 'data_modeling', 'sql']
  return ['coding', 'system_design', 'product_sense', 'sql', 'data_modeling']
}

function buildMockPayload() {
  const now = new Date()
  const buckets = createBuckets()
  const mockEvents: SignalEvent[] = [
    ['product_sense', 'frame', 68, 22, 'Figma pricing tradeoff'],
    ['product_sense', 'frame', 82, 12, 'Slack activation diagnosis'],
    ['system_design', 'optimize', 58, 9, 'News feed fanout design'],
    ['system_design', 'optimize', 74, 5, 'Checkout reliability sketch'],
    ['data_modeling', 'list', 63, 7, 'Marketplace entity model'],
    ['sql', 'optimize', 71, 4, 'Retention cohort query'],
    ['coding', 'optimize', 54, 3, 'Windowed subarray problem'],
  ].map(([discipline, move, score, daysAgo, title]) => ({
    id: `mock-${discipline}-${move}-${daysAgo}`,
    discipline: discipline as DisciplineKey,
    move: move as FlowMove,
    score: score as number,
    source: 'challenge' as SourceType,
    sourceLabel: 'Practice',
    title: title as string,
    evidence: `Hatch saw a ${score as number >= 75 ? 'stronger' : 'developing'} ${move as string} signal here.`,
    href: DISCIPLINES[discipline as DisciplineKey].href,
    occurredAt: new Date(now.getTime() - (daysAgo as number) * 86400000).toISOString(),
  }))
  mockEvents.forEach(event => pushEvent(buckets, event))
  return buildPayload(buckets, mockEvents, 'swe', { challengeReps: 5, interviewReps: 2 })
}

function buildPayload(
  buckets: Record<DisciplineKey, Record<FlowMove, SignalEvent[]>>,
  events: SignalEvent[],
  roleId: string | null | undefined,
  counts: { challengeReps: number; interviewReps: number }
) {
  const disciplines = DISCIPLINE_ORDER.map(key => {
    const cells = {} as Record<FlowMove, TrajectoryCell>
    for (const move of FLOW_MOVES) cells[move] = buildCell(buckets[key][move])
    const scoredCells = FLOW_MOVES.map(move => cells[move]).filter(cell => cell.score !== null)
    const score = scoredCells.length > 0 ? Math.round(average(scoredCells.map(cell => cell.score ?? 0)) ?? 0) : null
    const sampleSize = FLOW_MOVES.reduce((sum, move) => sum + cells[move].sampleSize, 0)
    const deltas = scoredCells.filter(cell => cell.trend !== 'insufficient_data').map(cell => cell.delta)
    const delta = deltas.length > 0 ? Math.round(average(deltas) ?? 0) : 0
    const trend: Trend =
      deltas.length === 0 ? 'insufficient_data' :
      delta >= 6 ? 'improving' :
      delta <= -6 ? 'declining' :
      'steady'
    return {
      key,
      ...DISCIPLINES[key],
      score,
      sampleSize,
      confidence: Math.min(96, Math.round(average(FLOW_MOVES.map(move => cells[move].confidence)) ?? 0)),
      trend,
      delta,
      cells,
    }
  })

  const priority = rolePriority(roleId)
  const focusCandidates = priority.flatMap(discipline =>
    FLOW_MOVES.map(move => ({ discipline, move, cell: disciplines.find(d => d.key === discipline)!.cells[move] }))
  )
  const lowSignal = focusCandidates.find(candidate => candidate.cell.sampleSize === 0)
  const weakest = [...focusCandidates]
    .filter(candidate => candidate.cell.score !== null)
    .sort((a, b) => (a.cell.score ?? 100) - (b.cell.score ?? 100))[0]
  const focus = lowSignal ?? weakest ?? focusCandidates[0]
  const focusDiscipline = DISCIPLINES[focus.discipline]
  const nextFocus = {
    discipline: focus.discipline,
    disciplineLabel: focusDiscipline.label,
    move: focus.move,
    moveLabel: focus.move[0].toUpperCase() + focus.move.slice(1),
    href: focusDiscipline.href,
    reason: focus.cell.sampleSize === 0
      ? `No ${focus.move} signal yet in ${focusDiscipline.label.toLowerCase()}. Hatch needs one clean rep there.`
      : `${focusDiscipline.label} ${focus.move} is the lowest recent signal at ${focus.cell.score ?? 0}.`,
  }

  const evidence = [...events]
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 6)

  return {
    generatedAt: new Date().toISOString(),
    roleId: roleId ?? null,
    moves: FLOW_MOVES,
    disciplines,
    evidence,
    nextFocus,
    summary: {
      challengeReps: counts.challengeReps,
      interviewReps: counts.interviewReps,
      lowSignalCells: disciplines.reduce((sum, discipline) => (
        sum + FLOW_MOVES.filter(move => discipline.cells[move].sampleSize === 0).length
      ), 0),
      totalSignals: events.length,
    },
  }
}

export async function GET() {
  if (IS_MOCK) return NextResponse.json(buildMockPayload())

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const [{ data: profile }, { data: attempts, error: attemptsError }, { data: sessions, error: sessionsError }] = await Promise.all([
    admin.from('profiles').select('preferred_role').eq('id', user.id).maybeSingle(),
    admin.from('challenge_attempts')
      .select('id, challenge_id, total_score, max_score, completed_at, feedback_json, challenges(title, challenge_type)')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(50),
    admin.from('live_interview_sessions')
      .select('id, challenge_id, loop_id, round_index, status, ended_at, started_at, debrief_json, flow_coverage')
      .eq('user_id', user.id)
      .in('status', ['completed', 'abandoned'])
      .order('ended_at', { ascending: false })
      .limit(30),
  ])

  if (attemptsError) return NextResponse.json({ error: attemptsError.message }, { status: 500 })
  if (sessionsError) return NextResponse.json({ error: sessionsError.message }, { status: 500 })

  const attemptRows = ((attempts ?? []) as AttemptRow[]).reverse()
  const sessionRows = ((sessions ?? []) as LiveSessionRow[]).reverse()
  const attemptIds = attemptRows.map(row => row.id)
  const sessionIds = sessionRows.map(row => row.id)
  const sessionChallengeIds = sessionRows.map(row => row.challenge_id).filter((id): id is string => Boolean(id))

  const [stepRows, interviewGradeRows, loopRoundRows, sessionChallengeRows] = await Promise.all([
    attemptIds.length > 0
      ? admin.from('step_attempts')
          .select('attempt_id, step, score, grading_explanation, competency_signal, created_at')
          .in('attempt_id', attemptIds)
          .then(result => (result.data ?? []) as StepAttemptRow[])
      : Promise.resolve([] as StepAttemptRow[]),
    attemptIds.length > 0
      ? admin.from('interview_grades')
          .select('attempt_id, challenge_type, overall_score, rubric_scores, top_strength, top_improvement, graded_at')
          .in('attempt_id', attemptIds)
          .then(result => (result.data ?? []) as InterviewGradeRow[])
      : Promise.resolve([] as InterviewGradeRow[]),
    sessionIds.length > 0
      ? admin.from('loop_rounds')
          .select('session_id, discipline, round_score, round_debrief_json, completed_at')
          .in('session_id', sessionIds)
          .then(result => (result.data ?? []) as LoopRoundRow[])
      : Promise.resolve([] as LoopRoundRow[]),
    sessionChallengeIds.length > 0
      ? admin.from('challenges')
          .select('id, challenge_type, title')
          .in('id', sessionChallengeIds)
          .then(result => (result.data ?? []) as Array<{ id: string; challenge_type: string | null; title: string | null }>)
      : Promise.resolve([] as Array<{ id: string; challenge_type: string | null; title: string | null }>),
  ])

  const buckets = createBuckets()
  const events: SignalEvent[] = []
  const attemptMap = new Map(attemptRows.map(row => [row.id, row]))
  const stepsByAttempt = new Map<string, StepAttemptRow[]>()
  for (const step of stepRows) {
    const list = stepsByAttempt.get(step.attempt_id) ?? []
    list.push(step)
    stepsByAttempt.set(step.attempt_id, list)
  }

  for (const attempt of attemptRows) {
    const challenge = getChallenge(attempt)
    const discipline = normalizeDiscipline(challenge.challenge_type)
    const title = challenge.title ?? attempt.challenge_id
    const rows = stepsByAttempt.get(attempt.id) ?? []
    const byMove = new Map<FlowMove, StepAttemptRow[]>()
    for (const row of rows) {
      const move = normalizeMove(row.step, discipline)
      if (!move) continue
      const list = byMove.get(move) ?? []
      list.push(row)
      byMove.set(move, list)
    }
    for (const [move, moveRows] of byMove.entries()) {
      const scores = moveRows.map(row => normalizeScore(row.score)).filter((score): score is number => score !== null)
      const score = average(scores)
      if (score === null) continue
      const lastRow = moveRows[moveRows.length - 1]
      const signal = lastRow.competency_signal?.signal ?? lastRow.grading_explanation ?? null
      const event: SignalEvent = {
        id: `challenge-${attempt.id}-${move}`,
        discipline,
        move,
        score: Math.round(score),
        source: 'challenge',
        sourceLabel: 'Practice',
        title,
        evidence: signal,
        href: `/challenges/${attempt.challenge_id}/feedback`,
        occurredAt: attempt.completed_at ?? lastRow.created_at ?? new Date().toISOString(),
      }
      events.push(event)
      pushEvent(buckets, event)
    }
  }

  for (const grade of interviewGradeRows) {
    const attempt = attemptMap.get(grade.attempt_id)
    if (!attempt) continue
    const challenge = getChallenge(attempt)
    const discipline = normalizeDiscipline(grade.challenge_type || challenge.challenge_type)
    const rubric = toRecord(grade.rubric_scores)
    const entries = Object.entries(rubric)
    const title = challenge.title ?? attempt.challenge_id
    if (entries.length === 0) {
      const score = normalizeScore(grade.overall_score)
      if (score === null) continue
      for (const move of FLOW_MOVES) {
        const event: SignalEvent = {
          id: `workspace-${grade.attempt_id}-${move}`,
          discipline,
          move,
          score,
          source: 'workspace',
          sourceLabel: 'Workspace',
          title,
          evidence: grade.top_improvement ?? grade.top_strength,
          href: `/challenges/${attempt.challenge_id}/feedback`,
          occurredAt: grade.graded_at ?? attempt.completed_at ?? new Date().toISOString(),
        }
        events.push(event)
        pushEvent(buckets, event)
      }
      continue
    }
    for (const [key, value] of entries) {
      const score = extractRubricScore(value)
      if (score === null) continue
      const move = mapRubricKeyToMove(key)
      const event: SignalEvent = {
        id: `workspace-${grade.attempt_id}-${key}`,
        discipline,
        move,
        score,
        source: 'workspace',
        sourceLabel: 'Workspace',
        title,
        evidence: grade.top_improvement ?? grade.top_strength,
        href: `/challenges/${attempt.challenge_id}/feedback`,
        occurredAt: grade.graded_at ?? attempt.completed_at ?? new Date().toISOString(),
      }
      events.push(event)
      pushEvent(buckets, event)
    }
  }

  const challengeTypeById = new Map(sessionChallengeRows.map(row => [row.id, row.challenge_type]))
  const challengeTitleById = new Map(sessionChallengeRows.map(row => [row.id, row.title]))
  const roundBySessionId = new Map(loopRoundRows.filter(row => row.session_id).map(row => [row.session_id as string, row]))
  for (const session of sessionRows) {
    const round = roundBySessionId.get(session.id)
    const discipline = normalizeDiscipline(round?.discipline ?? challengeTypeById.get(session.challenge_id ?? '') ?? 'product_sense')
    const title = challengeTitleById.get(session.challenge_id ?? '') ?? 'Live interview'
    const flowScores = flowScoresFromDebrief(round?.round_debrief_json ?? session.debrief_json)
    const fallbackScore = normalizeScore(round?.round_score ?? toRecord(session.debrief_json).overallScore)
    for (const move of FLOW_MOVES) {
      const score = flowScores[move] ?? fallbackScore
      if (score === undefined || score === null) continue
      const event: SignalEvent = {
        id: `live-${session.id}-${move}`,
        discipline,
        move,
        score,
        source: round ? 'interview_loop' : 'live_interview',
        sourceLabel: round ? 'Interview loop' : 'Live interview',
        title,
        evidence: null,
        href: session.status === 'completed' ? `/live-interviews/${session.id}/debrief` : '/live-interviews',
        occurredAt: round?.completed_at ?? session.ended_at ?? session.started_at ?? new Date().toISOString(),
      }
      events.push(event)
      pushEvent(buckets, event)
    }
  }

  return NextResponse.json(buildPayload(
    buckets,
    events,
    (profile as { preferred_role?: string | null } | null)?.preferred_role,
    { challengeReps: attemptRows.length, interviewReps: sessionRows.length }
  ))
}
