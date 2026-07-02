import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { IS_MOCK } from '@/lib/mock'
import { createCachedMessage } from '@/lib/anthropic/cached-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { MOCK_PROMPTS } from '@/lib/lead-magnets/quizzes/mock'

// 3 free anonymous grades per IP per day
const RATE_LIMIT_KEY_PREFIX = 'go-mock'
const RATE_LIMIT_WINDOW_SEC = 86400 // 24 hours

const RequestSchema = z.object({
  answer: z.string().min(20).max(1200),
  promptId: z.string().min(1),
  // Honeypot — must be absent or empty
  website: z.string().optional(),
})

type GradeLabel = 'Sharp' | 'Solid' | 'Surface' | 'Weak'
type FlowMove = 'frame' | 'list' | 'optimize' | 'win'

interface GradeResponse {
  quality: number
  gradeLabel: GradeLabel
  coaching: string
  move: FlowMove
}

const MOCK_GRADE_RESPONSE: GradeResponse = {
  quality: 0.72,
  gradeLabel: 'Solid',
  coaching:
    'The diagnosis is directionally right, but the answer names a general category rather than a specific signal to check first.',
  move: 'frame',
}

function qualityToLabel(quality: number): GradeLabel {
  if (quality >= 0.8) return 'Sharp'
  if (quality >= 0.5) return 'Solid'
  if (quality >= 0.2) return 'Surface'
  return 'Weak'
}

function wordCountFallback(answer: string): { quality: number; coaching: string; move: FlowMove } {
  const words = answer.trim().split(/\s+/).length
  const quality = Math.min(1, words / 100)
  return {
    quality,
    coaching: 'Name a specific signal or criterion to sharpen the answer.',
    move: 'frame',
  }
}

async function gradeWithHaiku(
  answer: string,
  prompt: { id: string; prompt: string; context: string }
): Promise<{ quality: number; coaching: string; move: FlowMove }> {
  const systemPrompt = `You are a product thinking coach. Grade a one-minute product answer and return strict JSON.

Never use em dashes. Short sentences. No filler.

Scoring:
- 0.8-1.0 (Sharp): Names a specific root cause, criterion, or signal. Shows real reasoning, not description.
- 0.5-0.79 (Solid): On the right track but too general. Missing a named metric, segment, or concrete next step.
- 0.2-0.49 (Surface): Restates the situation or lists obvious things without real diagnosis.
- 0.0-0.19 (Weak): Too short, off-topic, or shows no product reasoning.

For move, identify which FLOW move the answer is primarily exercising:
- frame: diagnosing the problem, identifying root cause, naming the real question
- list: generating options, identifying stakeholders, mapping solution space
- optimize: picking a criterion, naming the tradeoff, defending a priority decision
- win: proposing a metric, naming a threshold, building a falsifiable recommendation

Return only valid JSON, no markdown fences:
{
  "quality": <0.0 to 1.0, two decimal places>,
  "coaching": "<one direct sentence on what to add or sharpen>",
  "move": "<frame|list|optimize|win>"
}`

  const userContent = [
    `Situation: ${prompt.context}`,
    `Question: ${prompt.prompt}`,
    `Answer: ${answer}`,
  ].join('\n\n')

  try {
    const msg = await createCachedMessage(systemPrompt, userContent, {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      // No budget — anonymous route, no per-user tracking
    })

    const raw = (msg.content[0] as { type: string; text?: string }).text ?? ''
    const text = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(text) as {
      quality?: unknown
      coaching?: unknown
      move?: unknown
    }

    const quality = Math.max(0, Math.min(1, Number(parsed.quality) || 0))
    const coaching =
      typeof parsed.coaching === 'string' && parsed.coaching.trim()
        ? parsed.coaching.trim()
        : 'Name a specific signal or criterion to sharpen the answer.'

    const rawMove = typeof parsed.move === 'string' ? parsed.move.toLowerCase() : ''
    const move: FlowMove =
      rawMove === 'frame' || rawMove === 'list' || rawMove === 'optimize' || rawMove === 'win'
        ? (rawMove as FlowMove)
        : 'frame'

    return { quality, coaching, move }
  } catch {
    return wordCountFallback(answer)
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Honeypot check (parsed before rate-limit so bots skip the limiter too) ──
  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await req.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'invalid_request' },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { answer, promptId, website } = body

  // Honeypot: non-empty website field means bot. Return plausible 200 silently.
  if (website && website.trim().length > 0) {
    return NextResponse.json({
      quality: 0.65,
      gradeLabel: 'Solid' as GradeLabel,
      coaching: 'Keep working on naming specific signals.',
      move: 'frame' as FlowMove,
    })
  }

  // ── IP rate limit: 3 per day ──────────────────────────────────────────────
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0]?.trim() : 'unknown'
  const rateLimitKey = `${RATE_LIMIT_KEY_PREFIX}:${ip ?? 'unknown'}`

  const throttle = await rateLimit({
    key: rateLimitKey,
    limit: 3,
    windowSec: RATE_LIMIT_WINDOW_SEC,
  })

  if (!throttle.allowed) {
    return NextResponse.json({ error: 'limit' }, { status: 429 })
  }

  // ── Validate promptId against the authored prompt list ────────────────────
  const prompt = MOCK_PROMPTS.find((p) => p.id === promptId)
  if (!prompt) {
    return NextResponse.json({ error: 'invalid_prompt' }, { status: 400 })
  }

  // ── Mock mode ─────────────────────────────────────────────────────────────
  if (IS_MOCK) {
    return NextResponse.json(MOCK_GRADE_RESPONSE)
  }

  // ── Grade with Haiku ──────────────────────────────────────────────────────
  const { quality, coaching, move } = await gradeWithHaiku(answer, prompt)
  const gradeLabel = qualityToLabel(quality)

  return NextResponse.json({ quality, gradeLabel, coaching, move } satisfies GradeResponse)
}
