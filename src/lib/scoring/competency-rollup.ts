import { STEP_PRIMARY_COMPETENCIES } from '@/lib/hatch/system-prompt'
import { FLOW_MAX_SCORE } from '@/lib/scoring/flow-scale'
import type { Competency, FlowStep } from '@/lib/types'
import { getReasoningMove } from '@/lib/v2/skills/rubric-loader'
import type { CompetencySignal } from './competency-signal'

const FLOW_STEPS: FlowStep[] = ['frame', 'list', 'optimize', 'win']

const ALL_COMPETENCIES: Competency[] = [
  'motivation_theory',
  'cognitive_empathy',
  'taste',
  'strategic_thinking',
  'creative_execution',
  'domain_expertise',
]

const COMPETENCY_LABELS: Record<Competency, string> = {
  motivation_theory: 'Motivation Theory',
  cognitive_empathy: 'Cognitive Empathy',
  taste: 'Taste',
  strategic_thinking: 'Strategic Thinking',
  creative_execution: 'Creative Execution',
  domain_expertise: 'Domain Expertise',
}

export interface CompetencySignalInput {
  step: FlowStep | string
  score?: number | null
  weight?: number | null
  target_competencies?: string[] | null
  competencies_demonstrated?: string[] | null
  grading_explanation?: string | null
  quality_label?: string | null
  competency_signal?: {
    competency?: string | null
    primary?: string | null
    signal?: string | null
    framework_hint?: string | null
  } | null
}

export interface MentalModelBreakdownItem {
  step: FlowStep
  competency: Competency
  reasoning_move: string
  demonstrated: string
  missed: string
  framework_hint: string
  score: number
}

export interface CompetencyRollup {
  primaryCompetency: Competency
  weakestCompetency: Competency
  mentalModelsBreakdown: MentalModelBreakdownItem[]
  competencyScores: Record<Competency, number | null>
}

function isFlowStep(value: string): value is FlowStep {
  return FLOW_STEPS.includes(value as FlowStep)
}

function clampScore(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(FLOW_MAX_SCORE, n))
}

function normalizeCompetency(value: unknown): Competency | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  return ALL_COMPETENCIES.includes(normalized as Competency) ? normalized as Competency : null
}

function uniqueCompetencies(values: unknown[] | null | undefined): Competency[] {
  const seen = new Set<Competency>()
  for (const value of values ?? []) {
    const competency = normalizeCompetency(value)
    if (competency) seen.add(competency)
  }
  return Array.from(seen)
}

function stepCompetencies(step: FlowStep): Competency[] {
  const configured = uniqueCompetencies(STEP_PRIMARY_COMPETENCIES[step])
  return configured.length > 0 ? configured : ['strategic_thinking']
}

function firstSignalCompetency(row: CompetencySignalInput): Competency | null {
  return normalizeCompetency(row.competency_signal?.competency ?? row.competency_signal?.primary)
}

export function competenciesForSignalInput(row: CompetencySignalInput): Competency[] {
  const step = isFlowStep(String(row.step)) ? String(row.step) as FlowStep : null
  const targets = uniqueCompetencies(row.target_competencies)
  if (targets.length > 0) return targets

  const signalCompetency = firstSignalCompetency(row)
  if (signalCompetency) return [signalCompetency]

  const demonstrated = uniqueCompetencies(row.competencies_demonstrated)
  if (demonstrated.length > 0) return demonstrated

  return step ? stepCompetencies(step) : ['strategic_thinking']
}

function formatCompetency(competency: Competency): string {
  return COMPETENCY_LABELS[competency]
}

function safeReasoningMove(step: FlowStep): string {
  try {
    return getReasoningMove(step)
  } catch {
    return ''
  }
}

function defaultSignal(step: FlowStep, competency: Competency, score: number): string {
  const label = formatCompetency(competency)
  if (score >= FLOW_MAX_SCORE * 0.75) {
    return `This ${step} step showed clear ${label}.`
  }
  if (score >= FLOW_MAX_SCORE * 0.45) {
    return `This ${step} step showed partial ${label}.`
  }
  return `This ${step} step needs stronger ${label}.`
}

function defaultFrameworkHint(step: FlowStep, competency: Competency): string {
  const reasoningMove = safeReasoningMove(step)
  const label = formatCompetency(competency)
  return reasoningMove ? `${label}: ${reasoningMove}` : label
}

export function buildCompetencySignal(row: CompetencySignalInput): CompetencySignal {
  const step = isFlowStep(String(row.step)) ? String(row.step) as FlowStep : 'optimize'
  const competency = firstSignalCompetency(row) ?? competenciesForSignalInput(row)[0] ?? stepCompetencies(step)[0]
  const score = clampScore(row.score)
  const signal = row.competency_signal?.signal?.trim() || row.grading_explanation?.trim() || defaultSignal(step, competency, score)
  const frameworkHint = row.competency_signal?.framework_hint?.trim() || defaultFrameworkHint(step, competency)

  return {
    competency,
    signal,
    framework_hint: frameworkHint,
  }
}

function weightedAverage(rows: CompetencySignalInput[]): number {
  let total = 0
  let weightTotal = 0
  for (const row of rows) {
    const weight = typeof row.weight === 'number' && row.weight > 0 ? row.weight : 1
    total += clampScore(row.score) * weight
    weightTotal += weight
  }
  return weightTotal > 0 ? total / weightTotal : 0
}

function collectSignals(rows: CompetencySignalInput[]): CompetencySignal[] {
  const seen = new Set<string>()
  const signals: CompetencySignal[] = []
  for (const row of rows) {
    const signal = buildCompetencySignal(row)
    const key = `${signal.competency}:${signal.signal}:${signal.framework_hint ?? ''}`
    if (!seen.has(key)) {
      seen.add(key)
      signals.push(signal)
    }
  }
  return signals
}

function lowScoreNotes(rows: CompetencySignalInput[]): string {
  const notes = rows
    .filter(row => clampScore(row.score) < FLOW_MAX_SCORE * 0.75)
    .map(row => row.grading_explanation?.trim())
    .filter((note): note is string => !!note)

  return Array.from(new Set(notes)).slice(0, 2).join('; ')
}

function compareByCompetencyOrder(a: Competency, b: Competency): number {
  return ALL_COMPETENCIES.indexOf(a) - ALL_COMPETENCIES.indexOf(b)
}

export function computeChallengeCompetencyRollup(rows: CompetencySignalInput[]): CompetencyRollup {
  const buckets = new Map<Competency, { total: number; weight: number }>()

  for (const row of rows) {
    const rowWeight = typeof row.weight === 'number' && row.weight > 0 ? row.weight : 1
    const normalizedScore = clampScore(row.score) / FLOW_MAX_SCORE
    for (const competency of competenciesForSignalInput(row)) {
      const bucket = buckets.get(competency) ?? { total: 0, weight: 0 }
      bucket.total += normalizedScore * rowWeight
      bucket.weight += rowWeight
      buckets.set(competency, bucket)
    }
  }

  const competencyScores = ALL_COMPETENCIES.reduce((acc, competency) => {
    const bucket = buckets.get(competency)
    acc[competency] = bucket && bucket.weight > 0
      ? Math.round((bucket.total / bucket.weight) * 100)
      : null
    return acc
  }, {} as Record<Competency, number | null>)

  const scoredCompetencies = ALL_COMPETENCIES.filter(competency => competencyScores[competency] != null)
  const weakestCompetency = scoredCompetencies.length > 0
    ? [...scoredCompetencies].sort((a, b) =>
        (competencyScores[a] ?? 100) - (competencyScores[b] ?? 100) || compareByCompetencyOrder(a, b)
      )[0]
    : 'motivation_theory'
  const primaryCompetency = scoredCompetencies.length > 0
    ? [...scoredCompetencies].sort((a, b) =>
        (competencyScores[b] ?? 0) - (competencyScores[a] ?? 0) || compareByCompetencyOrder(a, b)
      )[0]
    : 'strategic_thinking'

  const mentalModelsBreakdown = FLOW_STEPS.map((step) => {
    const stepRows = rows.filter(row => row.step === step)
    const stepScore = weightedAverage(stepRows)
    const firstRow = stepRows[0] ?? { step, score: 0 }
    const signals = collectSignals(stepRows)
    const signal = signals[0] ?? buildCompetencySignal(firstRow)
    const signalCompetency = normalizeCompetency(signal.competency) ?? stepCompetencies(step)[0]
    const notes = lowScoreNotes(stepRows)
    const demonstrated = signals.map(item => item.signal).join('; ') || signal.signal
    const missed = notes || (stepScore < FLOW_MAX_SCORE * 0.75
      ? `Strengthen ${formatCompetency(signalCompetency)} in this step.`
      : '')

    return {
      step,
      competency: signalCompetency,
      reasoning_move: safeReasoningMove(step),
      demonstrated,
      missed,
      framework_hint: signal.framework_hint ?? defaultFrameworkHint(step, signalCompetency),
      score: Math.round((stepScore / FLOW_MAX_SCORE) * 100),
    }
  })

  return {
    primaryCompetency,
    weakestCompetency,
    mentalModelsBreakdown,
    competencyScores,
  }
}
