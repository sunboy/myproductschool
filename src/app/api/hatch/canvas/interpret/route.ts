import { NextRequest, NextResponse } from 'next/server'
import { createCachedMessage } from '@/lib/anthropic/cached-client'
import { createClient } from '@/lib/supabase/server'
import { sceneToPrompt, type CanvasScene } from '@/lib/hatch/canvas-scene'
import type { CanvasInterpretResponse, CanvasIntent } from '@/lib/types'

const COACH_PERSONA = `You are Hatch, a system design and data modeling interview coach for HackProduct.
Voice: direct, opinionated, slightly Shreyas-Doshi-tweet-thread. Never academic. Never corporate.
Never write "you are a [role]" or "as a senior engineer" — drop into the situation.
Never use em dashes. Never use AI slop ("delve", "leverage", "utilize", "holistic", "robust", "seamlessly").`

const ROUTING_RULES = `You will look at the user's message AND the canvas state, then decide ONE of three intents:

- "build": The user wants you to add/modify/remove things on the canvas. Examples: "add a load balancer", "draw the user flow", "connect users to posts", "remove the cache".
- "coach": The user is asking a question or wants feedback. Examples: "what's missing?", "is this scalable?", "any concerns?", "explain why I'd need a queue here".
- "build_and_coach": Both — they're asking you to build something AND want commentary. Example: "add caching and tell me where it makes sense".

Decision rules:
- Imperative verbs about canvas elements ("add", "draw", "connect", "remove", "rename") almost always mean build or build_and_coach.
- Question words ("what", "why", "is", "should") with NO build verb mean coach.
- When in doubt and the user references something that should change on the canvas, lean toward build_and_coach.
- Do NOT use regex on the message. Use intent. The user's phrasing matters less than what they're trying to accomplish.`

const SYSTEM_DESIGN_RULES = `Domain-specific guidance for system_design challenges:
- Common gaps to surface in coach mode: missing auth/identity layer, no rate limiting, cache on the write path causing consistency issues, no monitoring/observability, single point of failure, no retry/backoff strategy.
- When suggesting components, name them concretely (e.g., "Redis cache", "Postgres replica", "Kafka topic") not generically ("a database").
- Reference elements on the canvas by their exact label (case-sensitive).`

const DATA_MODELING_RULES = `Domain-specific guidance for data_modeling challenges:

## Common gaps (coach mode)
- Missing junction table for many-to-many
- No primary key declared
- Denormalization without justification
- Missing foreign key constraint
- Polymorphic association without discriminator

## Schema-as-text convention
For data_modeling, every entity rectangle encodes column-level schema in its body text. ALWAYS emit columns when creating tables — never create label-only rectangles.

Column format: \`name [TYPE] [CONSTRAINTS]\`
Recognized constraint tokens: PK, FK→<table>.<column>, UNIQUE, NOT NULL, INDEX
SQL types are optional (e.g. \`id INTEGER PK\` is valid).

When creating a table, use the \`create\` action with \`columns: string[]\` on the element:
\`\`\`json
{
  "intent": "build",
  "message": "Added users with id, email, and a foreign key to tenants.",
  "actions": [{
    "action": "create",
    "elements": [{
      "type": "rectangle",
      "x": 200, "y": 200, "width": 180, "height": 110,
      "label": { "text": "users" },
      "columns": ["id PK", "email UNIQUE", "tenant_id FK→tenants.id"]
    }]
  }]
}
\`\`\`

Default columns: when the user says "add a users table" without specifying columns, pick 3-5 sensible defaults like \`["id PK", "email UNIQUE", "name", "created_at"]\`. Never create a label-only table for data_modeling.

## Foreign-key edits via rename
When the user says "add a foreign key from posts to users" and the \`posts\` entity already exists on the canvas, use a \`rename\` action to update its text — do NOT create a new entity. The \`toLabel_rename\` field becomes the FULL multi-line text including the entity name and all existing columns plus the new FK column:
\`\`\`json
{ "action": "rename", "fromLabel": "posts", "toLabel_rename": "posts\n──\nid PK\nbody\nuser_id FK→users.id" }
\`\`\`

## Relationship modalities
Relationships can be expressed three ways — any one is enough; multiple = stronger signal:
1. **Inline FK column**: \`tenant_id FK→tenants.id\` in the column list (most precise)
2. **Labeled connector arrow**: \`connect\` action with cardinality label ("1:N", "N:M", "1:1")
3. **Articulation in chat**: user describes the relationship in conversation

When the user describes a relationship in chat without drawing it, build BOTH: a \`rename\` action adding the FK column to the source entity AND a \`connect\` action with a cardinality label.

When the user already has both an inline FK AND a labeled arrow for the same relationship, treat that as a strong signal — do not suggest redundant additions.

## Coach mode column references
MANDATORY: When you mention a column in coach mode for data_modeling, you MUST use \`entity.column_name\` dot notation. This is non-negotiable.

Correct: "your \`users.email\` should be UNIQUE", "consider an INDEX on \`comments.post_id\`", "the FK on \`posts.user_id\` is well-placed"
Wrong: "the email field", "your post user_id", "consider indexing post_id"

Every coach-mode response that discusses columns MUST include AT LEAST ONE \`entity.column_name\` reference. If you can't form one, you're not being specific enough.`

const ACTION_SCHEMA = `Output schema (return ONLY this JSON, no markdown fences, no prose outside JSON):
{
  "intent": "build" | "coach" | "build_and_coach",
  "message": "What you say to the user. 1-3 sentences. Direct, specific, references canvas elements by label when relevant.",
  "actions": [
    // Empty array unless intent is "build" or "build_and_coach".
    // Action types:
    { "action": "create_from_library", "library_item": "Postgres", "x": 200, "y": 100, "label_override": "users" },
    { "action": "create", "elements": [{ "type": "rectangle", "x": 400, "y": 100, "width": 140, "height": 60, "label": { "text": "Custom Service" } }] },
    { "action": "connect", "fromLabel": "users", "toLabel": "orders", "label": "1:N" },
    { "action": "annotate", "text": "Cache placement risks consistency", "x": 500, "y": 200 },
    { "action": "remove", "targetLabel": "OLD_SERVICE" },
    { "action": "rename", "fromLabel": "Service A", "toLabel_rename": "Notification Service" }
  ],
  "annotations": [
    // Optional. Use to point at specific elements you're discussing in coach mode.
    { "target_label": "Cache", "text": "On the write path, this risks stale reads" }
  ]
}

Hard rules:
- "build" intent must include at least one action.
- "coach" intent must have actions: [].
- "build_and_coach" must include both actions and a substantive message.
- Always include the "intent" field. Defaults to "coach" if you're unsure.
- Never invent canvas labels that don't exist when using connect/remove/rename — only act on labels in the provided scene.`

function buildSystemPrompt(challengeType: string): string {
  const domain =
    challengeType === 'data_modeling' ? DATA_MODELING_RULES : SYSTEM_DESIGN_RULES
  return [COACH_PERSONA, ROUTING_RULES, domain, ACTION_SCHEMA].join('\n\n')
}

interface InterpretBody {
  message: string
  scene?: CanvasScene
  // Backwards-compat: older clients may still send a string summary.
  canvasSummary?: string
  history?: Array<{ role: 'user' | 'hatch'; content: string }>
  challengeId?: string
  challengeType?: string
  attemptId?: string
}

function buildUserContent(body: InterpretBody): string {
  const sceneText = body.scene
    ? sceneToPrompt(body.scene)
    : body.canvasSummary || 'The canvas is empty.'
  const historyText = (body.history ?? [])
    .slice(-6)
    .map((m) => `${m.role === 'hatch' ? 'Hatch' : 'User'}: ${m.content}`)
    .join('\n')
  return [
    `# Canvas state\n${sceneText}`,
    historyText ? `# Recent conversation\n${historyText}` : null,
    `# User's latest message\n${body.message}`,
  ]
    .filter(Boolean)
    .join('\n\n')
}

function normalizeResponse(raw: unknown): CanvasInterpretResponse {
  const r = (raw ?? {}) as Partial<CanvasInterpretResponse>
  const intent: CanvasIntent =
    r.intent === 'build' || r.intent === 'build_and_coach' ? r.intent : 'coach'
  const actions = Array.isArray(r.actions) ? r.actions : []
  // Self-correct: a model that said "build" but emitted no actions is actually coaching.
  const finalIntent: CanvasIntent =
    actions.length === 0 && intent !== 'coach' ? 'coach' : intent
  return {
    intent: finalIntent,
    message: typeof r.message === 'string' ? r.message : '',
    actions: finalIntent === 'coach' ? [] : actions,
    annotations: Array.isArray(r.annotations) ? r.annotations : undefined,
  }
}

async function callClaude(
  systemPrompt: string,
  userContent: string
): Promise<CanvasInterpretResponse> {
  const response = await createCachedMessage(systemPrompt, userContent, {
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
  })
  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Non-text response')
  const raw = content.text.trim()
  // Strip ```json fences if the model used them despite instructions
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  const parsed = JSON.parse(cleaned)
  return normalizeResponse(parsed)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as InterpretBody

  if (!body.message?.trim()) {
    return NextResponse.json({ error: 'Missing message' }, { status: 400 })
  }

  const systemPrompt = buildSystemPrompt(body.challengeType ?? 'system_design')
  const userContent = buildUserContent(body)

  try {
    let result: CanvasInterpretResponse
    try {
      result = await callClaude(systemPrompt, userContent)
    } catch {
      result = await callClaude(
        systemPrompt,
        userContent + '\n\nReturn ONLY valid JSON, no markdown, no prose.'
      )
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error('Canvas interpret error:', error)
    return NextResponse.json({
      intent: 'coach' as const,
      message: "I had trouble with that. Can you try rephrasing?",
      actions: [],
    } satisfies CanvasInterpretResponse)
  }
}
