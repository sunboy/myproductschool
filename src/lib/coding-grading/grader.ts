import { readFileSync } from 'fs'
import { join } from 'path'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import type { GradingFeedback, RunResult } from '@/lib/coding/types'

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

  // Clamp overall_score to 1-5 range
  return {
    overall_score: Math.max(1, Math.min(5, d.overall_score as number)),
    headline: d.headline as string,
    dimensions: d.dimensions as GradingFeedback['dimensions'],
    top_strength: d.top_strength as string,
    top_improvement: d.top_improvement as string,
    what_a_5_would_look_like: d.what_a_5_would_look_like as string,
  }
}

// ---------------------------------------------------------------------------
// Main grading function
// ---------------------------------------------------------------------------

export async function gradeCodingAttempt(input: GradingInput): Promise<GradingFeedback> {
  const userContent = buildUserPrompt(input)

  const callGrader = async (extraNudge = ''): Promise<GradingFeedback> => {
    const response = await guardedCachedMessage(
      GRADER_SKILL,
      userContent + extraNudge,
      {
        model: 'claude-opus-4-6',
        max_tokens: 4000,
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

  try {
    return await callGrader()
  } catch (err) {
    // One retry with explicit reinforcement on conciseness
    console.warn('Coding grader first attempt failed, retrying:', err)
    return await callGrader(
      '\n\nIMPORTANT: keep the response under 3000 tokens of JSON. Trim verbose evidence/how_to_improve fields if needed. Return ONLY valid JSON, no markdown fences, no prose outside the JSON object.'
    )
  }
}
