import { readFileSync } from 'fs'
import { join } from 'path'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { buildEmptyStateResponse, buildSkillContextPrompt } from '@/lib/hatch/skill-context'
import { AiBudgetExceededError } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded } from '@/lib/usage/assert-plan-limit'
import type { GradingDimensionKey, GradingFeedback, RunResult } from '@/lib/coding/types'

// AI budget / plan-limit errors must propagate to the route so it can return a
// 402 limit_reached response. They are NOT model-output failures, so they must
// never be swallowed into the deterministic fallback.
function isAiLimitError(err: unknown): boolean {
  return err instanceof AiBudgetExceededError || err instanceof PlanLimitExceeded
}

type AiBudget = { userId: string; userPlan: string; route: string }

// ---------------------------------------------------------------------------
// Skill loader — loads the hackproduct-coding-grader SKILL.md as system prompt
// ---------------------------------------------------------------------------

function loadGraderSkill(): string {
  try {
    const skillPath = join(
      process.env.HOME ?? '/root',
      '.claude/skills/hackproduct-coding-grader/SKILL.md'
    )
    return readFileSync(skillPath, 'utf-8')
  } catch {
    // Fallback inline prompt if skill file is unavailable
    return `You are the HackProduct coding interview grader. Grade the user's session on five dimensions: problem_approach (25%), ai_collaboration (30%), code_quality (15%), verification_discipline (15%), interview_communication (15%). Each dimension scored 1-5. Return ONLY valid JSON matching the exact schema provided. No markdown fences, no preamble.`
  }
}

// Cache the skill at module load to avoid repeated disk reads
const GRADER_SKILL = loadGraderSkill()

const CODING_FEEDBACK_CONTRACT = `User-facing feedback contract:
- Keep the response crisp, direct, and useful to a real learner.
- Separate working correctness from process quality. Passing tests should be recognized plainly, even when process evidence is thin.
- Use "Hatch" instead of "AI" in user-facing text.
- Avoid vague praise, moralizing, and filler phrases like "it is worth noting".
- Each next action should be something the learner can do in the next five minutes.
- Do not expose hidden-test inputs, expected answers, or private cases.`

// ---------------------------------------------------------------------------
// Types for grading inputs
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: 'user' | 'hatch'
  content: string
  timestamp?: number  // ms from session start
}

export interface PasteEvent {
  length: number
  percentOfBuffer: number
  timestamp: number  // ms from session start
}

export interface CodeRunEvent {
  type: 'code_run'
  timestamp: string  // ISO
  language: string
  testsPassed: number
  testsTotal: number
  runId: string
}

export type SessionEvent = CodeRunEvent | Record<string, unknown>

export interface CodingPart {
  id: string
  title: string
  response_type: 'coding_subtask' | 'pure_mcq'
  code?: string
  language?: string
  test_results?: unknown
  weight: number
  score: number
  mcq_choice?: { option_label: string; option_text: string; quality: string } | string | null
}

export interface GradingInput {
  challenge: {
    title: string
    difficulty: string
    problem_statement: string
    reference_solution?: string
    reference_approach?: string
    time_limit_seconds?: number
  }
  finalCode: string
  language: string
  correctness: RunResult
  chatHistory: ChatMessage[]
  sessionEvents: SessionEvent[]
  sessionStartedAt?: string
  parts?: CodingPart[]
  budget?: AiBudget
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `t=${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function buildUserPrompt(input: GradingInput): string {
  const { challenge, finalCode, language, correctness, chatHistory, sessionEvents } = input

  const parts: string[] = []

  // Challenge context
  parts.push(`# Challenge Context
Title: ${challenge.title}
Difficulty: ${challenge.difficulty}
Time limit: ${challenge.time_limit_seconds != null ? `${Math.floor(challenge.time_limit_seconds / 60)} minutes` : 'not specified'}`)

  if (challenge.problem_statement) {
    parts.push(`# Problem Statement\n${challenge.problem_statement}`)
  }

  if (challenge.reference_solution) {
    parts.push(`# Reference Solution\n\`\`\`${language}\n${challenge.reference_solution}\n\`\`\``)
  }

  if (challenge.reference_approach) {
    parts.push(`# Reference Approach\n${challenge.reference_approach}`)
  }

  // Final code
  parts.push(`# Final Submitted Code (${language})\n\`\`\`${language}\n${finalCode || '(no code submitted)'}\n\`\`\``)

  // Correctness payload
  const visibleResults = correctness.results.filter((r) => !r.hidden)
  const hiddenResults = correctness.results.filter((r) => r.hidden)
  const correctnessLines = [
    `Tests passed: ${correctness.testsPassed} of ${correctness.testsTotal}`,
    '',
    ...visibleResults.map((r) => `  ${r.status === 'passed' ? '✓' : '✗'} ${r.id}${r.label ? ` (${r.label})` : ''}${r.status !== 'passed' && r.errorMessage ? `: ${r.errorMessage}` : ''}`),
    hiddenResults.length > 0
      ? `  ... plus ${hiddenResults.length} hidden test${hiddenResults.length === 1 ? '' : 's'} (${hiddenResults.filter((r) => r.status === 'passed').length} passed)`
      : '',
  ].filter((l) => l !== undefined)
  parts.push(`# Correctness Results\n${correctnessLines.join('\n')}`)

  // Chat log
  if (chatHistory.length > 0) {
    const chatLines = chatHistory.map((m) => {
      const ts = m.timestamp != null ? ` [${formatTimestamp(m.timestamp)}]` : ''
      const role = m.role === 'hatch' ? 'Hatch' : 'User'
      return `${role}${ts}: ${m.content}`
    })
    parts.push(`# Chat Log (${chatHistory.length} message${chatHistory.length === 1 ? '' : 's'})\n${chatLines.join('\n')}`)
  } else {
    parts.push(`# Chat Log\n(No Hatch conversation recorded — user did not engage with Hatch during this session.)`)
  }

  // Session events (paste + run)
  const pasteEvents = sessionEvents.filter((e) => (e as Record<string, unknown>).type === 'paste_event') as Array<Record<string, unknown>>
  const runEvents = sessionEvents.filter((e) => (e as Record<string, unknown>).type === 'code_run') as CodeRunEvent[]

  if (pasteEvents.length > 0) {
    const pasteLines = pasteEvents.map((e) => {
      const ts = typeof e.timestamp === 'number' ? ` [${formatTimestamp(e.timestamp as number)}]` : ''
      return `  - Paste${ts}: ${e.length ?? '?'} chars, ${e.percentOfBuffer != null ? `${Math.round((e.percentOfBuffer as number) * 100)}%` : '?%'} of buffer`
    })
    parts.push(`# Paste Events (${pasteEvents.length} paste${pasteEvents.length === 1 ? '' : 's'})\n${pasteLines.join('\n')}`)
  } else {
    parts.push(`# Paste Events\n(No paste events recorded.)`)
  }

  if (runEvents.length > 0) {
    const runLines = runEvents.map((e) => {
      const isoDate = e.timestamp ? new Date(e.timestamp) : null
      const tsLabel = isoDate && input.sessionStartedAt
        ? ` [${formatTimestamp(isoDate.getTime() - new Date(input.sessionStartedAt).getTime())}]`
        : e.timestamp ? ` [${e.timestamp}]` : ''
      return `  - Run${tsLabel}: ${e.testsPassed}/${e.testsTotal} passed (${e.language})`
    })
    parts.push(`# Run History (${runEvents.length} run${runEvents.length === 1 ? '' : 's'})\n${runLines.join('\n')}`)
  } else {
    parts.push(`# Run History\n(No run events recorded.)`)
  }

  parts.push(`\nGrade this session according to the rubric. Return ONLY the JSON object.`)

  return parts.join('\n\n')
}

function hasSubmittedCode(input: GradingInput): boolean {
  if (input.finalCode.trim().length > 0) return true
  return (input.parts ?? []).some((part) => part.response_type === 'coding_subtask' && part.code?.trim())
}

export function shouldUseDeterministicCodingGrade(input: GradingInput): boolean {
  return !hasSubmittedCode(input) || input.correctness.testsTotal === 0
}

function dimension(score: number, verdict: string, howToImprove: string, evidence?: string) {
  return {
    score,
    verdict,
    // Evidence must be a fact from the run, not the verdict echoed back.
    // Deterministic paths pass the concrete signal; absent one, say so
    // honestly instead of duplicating the verdict.
    evidence: evidence ?? 'No detailed evidence was captured for this attempt.',
    hole_to_poke: howToImprove,
    how_to_improve: howToImprove,
  }
}

function roundTenth(value: number): number {
  return Math.round(value * 10) / 10
}

function buildCorrectnessSummary(input: GradingInput): string {
  const { testsPassed, testsTotal, results } = input.correctness
  if (testsTotal === 0) return 'No runnable test signal was available.'

  const hidden = results.filter((result) => result.hidden)
  const hiddenPassed = hidden.filter((result) => result.status === 'passed').length
  const visibleFailure = results.find((result) => !result.hidden && result.status !== 'passed')

  if (testsPassed === testsTotal) {
    return hidden.length > 0
      ? `All tests passed, including ${hiddenPassed} hidden test${hiddenPassed === 1 ? '' : 's'}.`
      : 'All visible tests passed.'
  }

  if (visibleFailure) {
    return `${testsTotal - testsPassed} of ${testsTotal} tests are still failing. Start with ${visibleFailure.label || visibleFailure.id}.`
  }

  return `${testsTotal - testsPassed} of ${testsTotal} tests are still failing. Hidden tests failed without exposing private answers.`
}

function buildProcessSummary(input: GradingInput, processScore: number): string {
  const runEvents = input.sessionEvents.filter((event) => (event as Record<string, unknown>).type === 'code_run')
  if (processScore >= 4.2) return 'The approach, verification, and Hatch collaboration are easy to follow.'
  if (input.chatHistory.length === 0 && runEvents.length === 0) {
    return 'Process signal is thin. Hatch did not see a question, run history, or explanation.'
  }
  if (input.chatHistory.length === 0) return 'The solution has code signal, but Hatch collaboration is not visible.'
  if (runEvents.length === 0) return 'The reasoning is visible, but there is not enough run history to judge verification.'
  return 'The process is partly visible. Make the reasoning and verification trail easier to inspect.'
}

function withCodingScoreBreakdown(feedback: GradingFeedback, input: GradingInput): GradingFeedback {
  const correctnessScore = input.correctness.testsTotal > 0
    ? roundTenth(1 + (input.correctness.testsPassed / input.correctness.testsTotal) * 4)
    : 0
  const processKeys: GradingDimensionKey[] = [
    'problem_approach',
    'ai_collaboration',
    'verification_discipline',
    'interview_communication',
  ]
  const processScores = processKeys
    .map((key) => feedback.dimensions[key]?.score)
    .filter((score): score is number => typeof score === 'number' && Number.isFinite(score))
  const processScore = processScores.length > 0
    ? roundTenth(processScores.reduce((sum, score) => sum + score, 0) / processScores.length)
    : feedback.overall_score

  return {
    ...feedback,
    score_breakdown: {
      correctness: {
        score: correctnessScore,
        tests_passed: input.correctness.testsPassed,
        tests_total: input.correctness.testsTotal,
        summary: buildCorrectnessSummary(input),
      },
      process: {
        score: processScore,
        summary: buildProcessSummary(input, processScore),
      },
    },
  }
}

function deterministicCodingGrade(input: GradingInput): GradingFeedback {
  const challengeType = input.language === 'sql' ? 'sql' : 'algorithm'
  const emptyState = buildEmptyStateResponse({
    surface: 'grading',
    discipline: input.language === 'sql' ? 'data' : 'software',
    challengeType,
  })
  const missingCode = !hasSubmittedCode(input)
  const headline = missingCode ? 'No code submitted yet.' : 'No runnable test signal yet.'
  const summary = missingCode
    ? emptyState.summary
    : input.language === 'sql'
      ? 'I need a runnable query result before I can give useful feedback.'
      : 'I need a runnable test result before I can give useful feedback.'
  const improvement = missingCode
    ? emptyState.next_actions[0]
    : 'Run the visible tests once so feedback can point to a real failure or passing path.'

  return withCodingScoreBreakdown({
    overall_score: 1,
    headline,
    dimensions: {
      problem_approach: dimension(1, emptyState.summary, improvement),
      ai_collaboration: dimension(1, 'No Hatch collaboration signal was available.', 'Ask Hatch one focused question if you are stuck.'),
      code_quality: dimension(1, missingCode ? 'No code was submitted.' : 'No runnable code signal was available.', improvement),
      verification_discipline: dimension(1, 'No useful verification signal was available.', 'Run at least the visible tests before final grading.'),
      interview_communication: dimension(1, 'The submission does not yet explain an approach.', 'State the approach and one edge case before submitting.'),
    },
    top_strength: 'No substantive coding signal yet.',
    top_improvement: improvement,
    what_a_5_would_look_like: challengeType === 'sql'
      ? 'A clear query that passes visible tests, handles edge cases, and names the result shape.'
      : 'A working solution that passes visible tests, explains the pattern, and covers edge cases.',
    summary,
    next_actions: [improvement],
  }, input)
}

// Fallback used when the AI grader exhausts its retries but a runnable test
// signal IS available. Anchors the score to the objective test pass rate so the
// user gets a usable grade (and the success UI) instead of a hard error. The
// "Retry grading" button lets them request a real AI re-grade.
export function gradeFromCorrectnessFallback(input: GradingInput): GradingFeedback {
  const { testsPassed, testsTotal } = input.correctness
  // No runnable signal either — defer to the existing empty-state grade.
  if (testsTotal <= 0) return deterministicCodingGrade(input)

  const passRate = testsPassed / testsTotal
  const score = roundTenth(1 + passRate * 4) // 0/n -> 1.0, n/n -> 5.0
  const dimScore = Math.max(1, Math.round(score))
  const challengeType = input.language === 'sql' ? 'sql' : 'algorithm'
  const noun = challengeType === 'sql' ? 'query' : 'solution'
  const passText = `${testsPassed} of ${testsTotal} tests passed.`
  const improvement = passRate >= 1
    ? `Tighten edge cases and explain why this ${noun} is correct.`
    : `Inspect the failing case and adjust the ${noun} so the remaining tests pass.`
  const note = "Hatch's detailed review was unavailable this time, so this score reflects your test results."

  return withCodingScoreBreakdown({
    overall_score: score,
    headline: `Scored from your test results. ${note}`,
    dimensions: {
      problem_approach: dimension(dimScore, passText, improvement, passText),
      ai_collaboration: dimension(dimScore, 'Detailed review was unavailable for this attempt.', 'Ask Hatch a focused question about the failing case.'),
      code_quality: dimension(dimScore, `Correctness signal: ${passText}`, improvement, passText),
      verification_discipline: dimension(dimScore, passRate >= 1 ? 'All visible tests passed.' : 'Some visible tests are still failing.', improvement, passText),
      interview_communication: dimension(dimScore, 'Detailed review was unavailable for this attempt.', `State your approach and one edge case for this ${noun}.`),
    },
    top_strength: passRate >= 1 ? 'All visible tests pass.' : passText,
    top_improvement: improvement,
    what_a_5_would_look_like: challengeType === 'sql'
      ? 'A clear query that passes visible tests, handles edge cases, and names the result shape.'
      : 'A working solution that passes visible tests, explains the pattern, and covers edge cases.',
    summary: `${passText} ${note}`,
    next_actions: [improvement],
    degraded: true,
  }, input)
}

// ---------------------------------------------------------------------------
// JSON validation
// ---------------------------------------------------------------------------

function validateGradingFeedback(data: unknown): GradingFeedback {
  if (!data || typeof data !== 'object') throw new Error('Invalid grading: not an object')
  const d = data as Record<string, unknown>
  if (typeof d.overall_score !== 'number') throw new Error('Invalid grading: missing overall_score')
  if (typeof d.headline !== 'string') throw new Error('Invalid grading: missing headline')
  if (typeof d.dimensions !== 'object' || !d.dimensions) throw new Error('Invalid grading: missing dimensions')
  if (typeof d.top_strength !== 'string') throw new Error('Invalid grading: missing top_strength')
  if (typeof d.top_improvement !== 'string') throw new Error('Invalid grading: missing top_improvement')
  if (typeof d.what_a_5_would_look_like !== 'string') throw new Error('Invalid grading: missing what_a_5_would_look_like')

  const clean = (value: unknown, maxLength = 260) => {
    if (typeof value !== 'string') return ''
    const normalized = value
      .replace(/\s*(?:—|--)\s*/g, ', ')
      .replace(/\bAI collaboration\b/gi, 'Hatch collaboration')
      .replace(/\bAI-generated\b/gi, 'generated')
      .replace(/\bAI\b/g, 'Hatch')
      .replace(/\bit is worth noting that\s+/gi, '')
      .replace(/\bit is worth noting\b/gi, '')
      .replace(/\bThat is the floor, but\s*\./gi, 'That is the floor.')
      .replace(/,\s*but\s*\./gi, '.')
      .replace(/\s+/g, ' ')
      .trim()
    if (normalized.length <= maxLength) return normalized
    const firstSentence = normalized.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim()
    if (firstSentence && firstSentence.length >= 24 && firstSentence.length <= maxLength) return firstSentence
    const clipped = normalized.slice(0, maxLength).trimEnd()
    const breakIndex = Math.max(clipped.lastIndexOf('.'), clipped.lastIndexOf(';'), clipped.lastIndexOf(','))
    if (breakIndex >= 40) return clipped.slice(0, breakIndex).trimEnd().replace(/[,:;]$/, '') + '.'
    return clipped.replace(/[,:;]$/, '') + '.'
  }

  const dimensions = d.dimensions as Record<string, Record<string, unknown>>
  const cleanedDimensions = Object.fromEntries(
    Object.entries(dimensions).map(([key, value]) => [
      key,
      {
        ...value,
        verdict: clean(value.verdict, 180),
        evidence: clean(value.evidence, 220),
        hole_to_poke: clean(value.hole_to_poke, 220),
        how_to_improve: clean(value.how_to_improve, 220),
      },
    ])
  ) as GradingFeedback['dimensions']

  const summary = typeof d.summary === 'string' ? clean(d.summary, 220) : clean(d.headline, 220)
  const nextActions = Array.isArray(d.next_actions)
    ? d.next_actions.map((action) => clean(action, 180)).filter(Boolean).slice(0, 3)
    : []

  // Clamp overall_score to 1-5 range
  return {
    overall_score: Math.max(1, Math.min(5, d.overall_score as number)),
    headline: clean(d.headline, 180),
    dimensions: cleanedDimensions,
    top_strength: clean(d.top_strength, 220),
    top_improvement: clean(d.top_improvement, 220),
    what_a_5_would_look_like: clean(d.what_a_5_would_look_like, 220),
    summary,
    next_actions: nextActions.length > 0 ? nextActions : [clean(d.top_improvement, 180)],
  }
}

// ---------------------------------------------------------------------------
// Main grading function
// ---------------------------------------------------------------------------

export async function gradeCodingAttempt(input: GradingInput): Promise<GradingFeedback> {
  if (shouldUseDeterministicCodingGrade(input)) {
    return deterministicCodingGrade(input)
  }

  const challengeType = input.language === 'sql' ? 'sql' : 'algorithm'
  const contextPrompt = input.budget?.userId
    ? await buildSkillContextPrompt(input.budget.userId, {
        surface: 'grading',
        challengeType,
        challengeTitle: input.challenge.title,
        challengePrompt: input.challenge.problem_statement,
        submissionText: input.finalCode,
        includePracticeLink: true,
      }).catch(() => '')
    : ''
  const userContent = [contextPrompt, buildUserPrompt(input)].filter(Boolean).join('\n\n')

  const callGrader = async (extraNudge = ''): Promise<GradingFeedback> => {
    const response = await guardedCachedMessage(
      `${GRADER_SKILL}\n\n${CODING_FEEDBACK_CONTRACT}`,
      userContent + extraNudge,
      {
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        budget: input.budget,
      }
    )

    const textBlock = response.content
      .filter((c) => c.type === 'text')
      .map((c) => (c as { type: 'text'; text: string }).text)
      .join('\n')
      .trim()

    // Strip markdown fences if the model wrapped the JSON despite instructions
    const cleaned = textBlock
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')

    // Greedy match: from the first { to the last } in the response
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('No JSON object in grading response')
    }

    const parsed = JSON.parse(cleaned.slice(start, end + 1))
    return validateGradingFeedback(parsed)
  }

  // Up to 3 attempts with progressively stronger JSON-only reinforcement. If the
  // model still returns malformed output, fall back to a deterministic grade
  // derived from the objective test pass rate so the user never sees a hard error.
  const nudges = [
    '',
    '\n\nIMPORTANT: keep the response under 3000 tokens of JSON. Trim verbose evidence/how_to_improve fields if needed. Return ONLY valid JSON, no markdown fences, no prose outside the JSON object.',
    '\n\nCRITICAL: Your previous responses were not valid JSON. Return ONLY a single JSON object that exactly matches the required schema, including a numeric "overall_score". No markdown fences, no prose, no commentary before or after the object.',
  ]
  let lastErr: unknown
  for (let attempt = 0; attempt < nudges.length; attempt++) {
    try {
      return withCodingScoreBreakdown(await callGrader(nudges[attempt]), input)
    } catch (err) {
      // Budget/plan-limit errors are not model-output failures — let the route
      // surface them as a 402 instead of masking them with a fallback grade.
      if (isAiLimitError(err)) throw err
      lastErr = err
      console.warn(`Coding grader attempt ${attempt + 1} failed:`, err)
    }
  }

  console.error('Coding grader exhausted retries, using deterministic fallback:', lastErr)
  return gradeFromCorrectnessFallback(input)
}
