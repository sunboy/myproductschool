import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getClientIp, findRateLimitBlock } from '@/lib/auth/rate-limit'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import {
  PRODUCT_SENSE_FREEFORM,
  scoreFreeformHeuristic,
  buildProductSenseResult,
  resultSlug,
  moveLabel,
  type McqAnswers,
} from '@/lib/quiz/productSense'
import type { CalibrationMove } from '@/lib/calibration/deriveArchetype'

/**
 * Public, no-auth grader for the product-sense taste test at
 * `/quiz/product-sense`. Grades the single Win freeform server-side.
 *
 * Cost guards (this is an unauthenticated endpoint, so cost is the risk):
 *  - Strict per-IP rate limit: 5 grades / 10 min + a coarse 30 / day ceiling.
 *  - Input hard-capped at 1200 chars; anything longer is truncated before the
 *    model ever sees it, so a single request can never blow the token budget.
 *  - Cheap model (Haiku) with a tiny max_tokens, no budget object (public).
 *  - AI can be switched off entirely with PUBLIC_QUIZ_AI_GRADING=false, in which
 *    case grading falls back to the deterministic keyword/length heuristic. Any
 *    AI error also falls back, so the endpoint never fails on the model.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_FREEFORM_CHARS = 1200

const BodySchema = z.object({
  // The two MCQ answers (Frame + Optimize). Scored deterministically here so the
  // client can never lie about the tier by relabelling an option.
  mcqAnswers: z
    .object({
      frame: z.enum(['A', 'B', 'C', 'D']).optional(),
      optimize: z.enum(['A', 'B', 'C', 'D']).optional(),
    })
    .default({}),
  freeform: z.string().max(4000).default(''),
})

function aiGradingEnabled(): boolean {
  // Default ON, but disabled when explicitly turned off or when no API key is
  // present in the environment (so local/preview never hard-fails).
  if (process.env.PUBLIC_QUIZ_AI_GRADING === 'false') return false
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

const SYSTEM_PROMPT = `You grade one short product-sense answer on a 0 to 3 scale.
A strong Win-move answer names three things: what ships (scoped, not the whole config flip), how success is measured (a real metric with a guardrail), and the reversal condition (what signal triggers a rollback).
Score 3 only when all three are present and specific. Score 2 when two are present. Score 1 when one is present or the answer is directionally right but vague. Score 0 when it misreads the situation or says nothing concrete.
Return ONLY JSON: {"score":<0-3 number>,"strength":"<one short sentence naming what the answer did well>","gap":"<one short sentence naming the single biggest missing move>"}
No markdown, no backticks. Keep each sentence under 140 characters. No em dashes.`

interface AiGrade {
  score: number
  strength: string
  gap: string
}

function parseAiJson(raw: string): AiGrade | null {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1))
    const score = Number(parsed.score)
    if (!Number.isFinite(score)) return null
    return {
      score: Math.max(0, Math.min(3, score)),
      strength: typeof parsed.strength === 'string' ? parsed.strength.slice(0, 200) : '',
      gap: typeof parsed.gap === 'string' ? parsed.gap.slice(0, 200) : '',
    }
  } catch {
    return null
  }
}

async function gradeFreeformPublic(text: string): Promise<{ score: number; strength: string; gap: string; graded_by: 'ai' | 'heuristic' }> {
  const heuristic = scoreFreeformHeuristic(text)

  if (!aiGradingEnabled()) {
    return { score: heuristic.score, ...heuristicCopy(heuristic), graded_by: 'heuristic' }
  }

  try {
    const prompt = `SCENARIO: ${PRODUCT_SENSE_FREEFORM.scenario}

ASK: ${PRODUCT_SENSE_FREEFORM.q}

ANSWER TO GRADE:
${text}`

    const response = await guardedCachedMessage(SYSTEM_PROMPT, prompt, {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
    })
    const block = response.content.find((b) => b.type === 'text')
    const rawText = block?.type === 'text' ? block.text : ''
    const parsed = parseAiJson(rawText)
    if (parsed) {
      return { score: Math.round(parsed.score), strength: parsed.strength, gap: parsed.gap, graded_by: 'ai' }
    }
  } catch {
    // Fall through to the deterministic heuristic on any AI failure.
  }

  return { score: heuristic.score, ...heuristicCopy(heuristic), graded_by: 'heuristic' }
}

/** Deterministic strength/gap copy derived from which Win moves were detected. */
function heuristicCopy(h: ReturnType<typeof scoreFreeformHeuristic>): { strength: string; gap: string } {
  const present: string[] = []
  if (h.hasShip) present.push('a scoped rollout')
  if (h.hasMeasure) present.push('a success metric')
  if (h.hasReverse) present.push('a rollback trigger')

  const strength = present.length
    ? `You named ${present.join(' and ')}. That is the shape of a real recommendation.`
    : 'You engaged the scenario, but the recommendation stayed abstract.'

  let gap = ''
  if (!h.hasReverse) gap = 'The reversal condition is missing. A recommendation you cannot unwind is a bet, not a plan.'
  else if (!h.hasMeasure) gap = 'There is no metric. Without a number, nobody knows if the change worked.'
  else if (!h.hasShip) gap = 'The rollout is all-or-nothing. Scope it down so a bad bet stays cheap.'
  else gap = 'Tighten the specifics: name the cohort size, the metric threshold, and the exact rollback signal.'

  return { strength, gap }
}

export async function POST(request: Request) {
  const ip = getClientIp(request)

  const block = await findRateLimitBlock([
    { key: `public-quiz-grade:burst:${ip}`, limit: 5, windowSec: 600 },
    { key: `public-quiz-grade:daily:${ip}`, limit: 30, windowSec: 86_400 },
  ])
  if (block) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in a bit.' },
      { status: 429, headers: { 'Retry-After': String(block.retryAfter) } },
    )
  }

  let body: z.infer<typeof BodySchema>
  try {
    const json = await request.json()
    const parsed = BodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const freeformText = body.freeform.trim().slice(0, MAX_FREEFORM_CHARS)
  const mcqAnswers = body.mcqAnswers as McqAnswers

  const grade = await gradeFreeformPublic(freeformText)
  const result = buildProductSenseResult(mcqAnswers, grade.score)

  return NextResponse.json({
    result: {
      total: result.total,
      verdict: result.verdict,
      headline: result.headline,
      strongMove: result.strongMove,
      weakMove: result.weakMove,
      strongMoveLabel: moveLabel(result.strongMove as CalibrationMove),
      weakMoveLabel: moveLabel(result.weakMove as CalibrationMove),
      moveScores: result.moveScores,
      slug: resultSlug(result),
    },
    freeform: {
      score: grade.score,
      strength: grade.strength,
      gap: grade.gap,
      graded_by: grade.graded_by,
    },
  })
}
