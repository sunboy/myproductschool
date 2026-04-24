import { NextRequest, NextResponse } from 'next/server'
import { createCachedMessage } from '@/lib/anthropic/cached-client'
import { createClient } from '@/lib/supabase/server'
import { sceneToPrompt, type CanvasScene } from '@/lib/hatch/canvas-scene'

const NUDGE_GATE_MS = 30_000
const MAX_ELEMENT_COUNT_FOR_NUDGE = 40 // skip if canvas is large; user is mid-deep-work

const NUDGE_SYSTEM_PROMPT = `You are Hatch, a system design / data modeling interview coach.
The user just added something to their canvas. You may interject with ONE short observation if it's worth saying.

When to nudge (respond with a single sentence):
- Multiple entities present but ZERO connections between them (e.g. {Web, API, DB} with no arrows — the user almost certainly forgot to wire them up)
- Missing critical component (auth, rate limit, monitoring, junction table, primary key)
- Suspicious topology (cache on write path, no replication on the DB the system depends on, polymorphic relation without discriminator)
- An element placed without a clear role
- A connection that introduces a cycle or consistency risk

When to STAY SILENT (respond with null):
- The user just renamed something, dragged something, or made a trivial edit
- The canvas has only 1 entity (too early to comment)
- You said something similar recently
- Generic praise or vague concerns are NOT nudges — only fire if you can name the specific element or gap

Output schema (return ONLY this JSON, no markdown):
{
  "nudge": "Single sentence under 25 words, references an element by label." | null
}

Voice: direct, slightly opinionated, no em dashes, no AI slop ("delve", "leverage", "robust", "seamlessly"), never write "you are a [role]".`

interface NudgeBody {
  scene: CanvasScene
  recentDelta?: { added: number }
  challengeId?: string
  challengeType?: string
  attemptId: string
  lastNudgeAt?: number // client-tracked epoch ms
  nudgeCount?: number // client-tracked count for this attempt
}

const MAX_NUDGES_PER_ATTEMPT = 5

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as NudgeBody

  if (!body.attemptId || !body.scene) {
    return NextResponse.json({ nudge: null })
  }

  // Gate 1: rate limit (30s since last nudge)
  if (body.lastNudgeAt && Date.now() - body.lastNudgeAt < NUDGE_GATE_MS) {
    return NextResponse.json({ nudge: null, reason: 'rate_limited' })
  }

  // Gate 2: per-attempt cap
  if ((body.nudgeCount ?? 0) >= MAX_NUDGES_PER_ATTEMPT) {
    return NextResponse.json({ nudge: null, reason: 'cap_reached' })
  }

  // Gate 3: trivial change (no elements added since last nudge)
  if (!body.recentDelta || body.recentDelta.added < 1) {
    return NextResponse.json({ nudge: null, reason: 'no_meaningful_change' })
  }

  // Gate 4: scene too large to nudge meaningfully (user is deep in work)
  if (body.scene.elementCount > MAX_ELEMENT_COUNT_FOR_NUDGE) {
    return NextResponse.json({ nudge: null, reason: 'canvas_too_large' })
  }

  // Gate 5: empty / near-empty canvas (nothing useful to say yet)
  if (body.scene.elementCount < 2) {
    return NextResponse.json({ nudge: null, reason: 'canvas_too_small' })
  }

  const userContent = [
    `Challenge type: ${body.challengeType ?? 'system_design'}`,
    `# Canvas state\n${sceneToPrompt(body.scene)}`,
    `# Recent change\nUser just added ${body.recentDelta.added} element(s).`,
    `Decide: nudge or stay silent. Respond with the JSON schema.`,
  ].join('\n\n')

  try {
    const response = await createCachedMessage(NUDGE_SYSTEM_PROMPT, userContent, {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
    })
    const content = response.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ nudge: null })
    }
    const cleaned = content.text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
    const parsed = JSON.parse(cleaned) as { nudge?: string | null }
    const nudge =
      typeof parsed.nudge === 'string' && parsed.nudge.trim().length > 0
        ? parsed.nudge.trim()
        : null
    return NextResponse.json({ nudge })
  } catch (error) {
    console.error('Nudge error:', error)
    return NextResponse.json({ nudge: null })
  }
}
