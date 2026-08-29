// lib/casebook/case-grader.ts — server-side only.
//
// Grades a filed Challenge (full case) attempt against the analyst_v1-extended
// rubric (see cc_case_attempts.grade column comment in
// supabase/migrations/20260826100100_casebook_user_state.sql). Loads the
// grading behavior from the hackproduct-casebook-grader skill via the shared
// skill loader (src/lib/ai/skill-loader.ts), same pattern as
// src/lib/coding-grading/analytics-grader.ts. A single model call returns:
//   - which expert move ids the learner's session demonstrated (fed to the
//     pure computeMoveDiff in move-diff.ts, never decided by this module)
//   - the learner's verdict {cause, confidence, falsifiable_check}
//   - a per-objective grade against cc_cases.objectives + verdict_spec
//
// The model's raw output is ALWAYS parsed with extractJson — never a bare
// JSON.parse — per project rule (src/lib/anthropic/extract-json.ts).

import { loadSkillPrompt } from '@/lib/ai/skill-loader'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { extractJson, truncateForLog } from '@/lib/anthropic/extract-json'
import type { MergedTurn } from './transcript-merge'
import { renderMergedTranscript } from './transcript-merge'
import type { ExpertMove } from './move-diff'

export interface CaseObjective {
  id: string
  label: string
  detector: { kind: 'regex' | 'llm'; pattern?: string; prompt?: string }
}

export interface VerdictSpec {
  expected_cause_tags: string[]
  requires_falsifiable_check: boolean
  ruled_out_cause_tags?: string[]
  falsifiability_statement?: string
}

export interface CaseGradingInput {
  caseTitle: string
  caseBriefMd: string
  objectives: CaseObjective[]
  verdictSpec: VerdictSpec
  expertMoves: ExpertMove[]
  learnerTurns: MergedTurn[]
  budget?: { userId: string; userPlan: string; route: string }
}

export interface CaseVerdict {
  cause: string
  confidence: 'high' | 'medium' | 'low'
  falsifiable_check: string
}

export interface ObjectiveGrade {
  id: string
  label: string
  status: 'met' | 'partial' | 'missed'
  evidence: string
}

export interface CaseGradeResult {
  matchedExpertMoveIds: string[]
  verdict: CaseVerdict
  grade: {
    rubric: 'analyst_v1-extended'
    objectives: ObjectiveGrade[]
    verdict_match: boolean
    total_score: number
    grade_label: string
    overall_note: string
  }
}

const FALLBACK_GRADER_PROMPT = `You grade a completed Casebook investigation against the analyst_v1-extended rubric. You are given the case brief, its objectives, the expert reference moves, the verdict spec, and the learner's full session transcript. Identify which expert move ids the learner's session demonstrates, extract the learner's final verdict (cause, confidence, falsifiable check), and grade each objective as met/partial/missed with one piece of evidence. Return ONLY JSON, no markdown fences, no prose.`

function loadGraderSkill(): string {
  return loadSkillPrompt('hackproduct-casebook-grader', FALLBACK_GRADER_PROMPT)
}

function buildObjectivesBlock(objectives: CaseObjective[]): string {
  return objectives
    .map((o) => `- ${o.id}: ${o.label}${o.detector.kind === 'llm' && o.detector.prompt ? `\n    check: ${o.detector.prompt}` : ''}`)
    .join('\n')
}

function buildMovesBlock(moves: ExpertMove[]): string {
  return moves.map((m) => `- ${m.id}: ${m.label} — ${m.description}`).join('\n')
}

function outputContract(objectives: CaseObjective[]): string {
  return `Return ONLY a single JSON object, no markdown fences, no prose:
{
  "matched_expert_move_ids": ["move-1", "move-3", ...],
  "verdict": {
    "cause": "one sentence naming the cause the learner concluded",
    "confidence": "high" | "medium" | "low",
    "falsifiable_check": "the specific checkable condition the learner named, or empty string if none"
  },
  "objectives": {
    ${objectives.map((o) => `"${o.id}": { "status": "met" | "partial" | "missed", "evidence": "one specific quote/fact from the session" }`).join(',\n    ')}
  },
  "verdict_match": true | false,
  "overall_note": "two sentences on the strongest and weakest move in the investigation"
}`
}

function buildUserContent(input: CaseGradingInput): string {
  const parts: string[] = []
  parts.push(`# Case\n${input.caseTitle}\n\n${input.caseBriefMd}`)
  parts.push(`# Objectives\n${buildObjectivesBlock(input.objectives)}`)
  parts.push(`# Expert reference moves\n${buildMovesBlock(input.expertMoves)}`)
  parts.push(
    `# Verdict spec\nExpected cause tags: ${input.verdictSpec.expected_cause_tags.join(', ')}\n` +
      `Ruled-out cause tags: ${(input.verdictSpec.ruled_out_cause_tags ?? []).join(', ') || 'none'}\n` +
      `Requires a falsifiable check: ${input.verdictSpec.requires_falsifiable_check}`,
  )
  parts.push(
    `# Learner session transcript\n"""\n${renderMergedTranscript(input.learnerTurns)}\n"""`,
  )
  parts.push(outputContract(input.objectives))
  return parts.join('\n\n')
}

interface RawGraderOutput {
  matched_expert_move_ids?: unknown
  verdict?: {
    cause?: unknown
    confidence?: unknown
    falsifiable_check?: unknown
  }
  objectives?: Record<string, { status?: unknown; evidence?: unknown }>
  verdict_match?: unknown
  overall_note?: unknown
}

function coerceConfidence(v: unknown): CaseVerdict['confidence'] {
  return v === 'high' || v === 'medium' || v === 'low' ? v : 'low'
}

function coerceStatus(v: unknown): ObjectiveGrade['status'] {
  return v === 'met' || v === 'partial' || v === 'missed' ? v : 'missed'
}

/** met=1, partial=0.5, missed=0, weighted evenly across objectives, scaled to 0-100. */
function scoreObjectives(objectives: ObjectiveGrade[]): number {
  if (objectives.length === 0) return 0
  const perObjective = 1 / objectives.length
  const points = objectives.reduce((acc, o) => {
    const s = o.status === 'met' ? 1 : o.status === 'partial' ? 0.5 : 0
    return acc + s * perObjective
  }, 0)
  return Math.round(points * 100)
}

function gradeLabel(total: number): string {
  if (total >= 80) return 'Sharp'
  if (total >= 55) return 'Solid'
  if (total >= 30) return 'Surface'
  return 'Missed'
}

/**
 * Grades one filed Challenge attempt. Throws on AI budget/plan cap errors
 * (isLimitError-shaped) — the caller (the file route) must catch and leave
 * the attempt at `filed` for retry rather than losing the transition.
 */
export async function gradeCaseAttempt(input: CaseGradingInput): Promise<CaseGradeResult> {
  const systemPrompt = loadGraderSkill()
  const userContent = buildUserContent(input)

  const message = await guardedCachedMessage(systemPrompt, userContent, {
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    temperature: 0,
    budget: input.budget,
  })

  const raw = extractJson<RawGraderOutput>(message.sanitized)
  if (!raw) {
    console.error('[casebook/case-grader] unparseable grader output:', truncateForLog(message.sanitized))
  }

  const matchedExpertMoveIds = Array.isArray(raw?.matched_expert_move_ids)
    ? (raw!.matched_expert_move_ids as unknown[]).filter((v): v is string => typeof v === 'string')
    : []

  const verdict: CaseVerdict = {
    cause: typeof raw?.verdict?.cause === 'string' ? raw.verdict.cause : 'Not determined',
    confidence: coerceConfidence(raw?.verdict?.confidence),
    falsifiable_check: typeof raw?.verdict?.falsifiable_check === 'string' ? raw.verdict.falsifiable_check : '',
  }

  const objectiveGrades: ObjectiveGrade[] = input.objectives.map((o) => {
    const entry = raw?.objectives?.[o.id]
    return {
      id: o.id,
      label: o.label,
      status: coerceStatus(entry?.status),
      evidence: typeof entry?.evidence === 'string' ? entry.evidence : '',
    }
  })

  const total_score = scoreObjectives(objectiveGrades)

  return {
    matchedExpertMoveIds,
    verdict,
    grade: {
      rubric: 'analyst_v1-extended',
      objectives: objectiveGrades,
      verdict_match: raw?.verdict_match === true,
      total_score,
      grade_label: gradeLabel(total_score),
      overall_note: typeof raw?.overall_note === 'string' ? raw.overall_note : '',
    },
  }
}
