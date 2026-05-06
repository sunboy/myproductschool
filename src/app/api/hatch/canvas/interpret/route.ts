import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { z, ZodError } from 'zod'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { createClient } from '@/lib/supabase/server'
import { sceneToPrompt } from '@/lib/hatch/canvas-scene'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded, assertPlanLimit } from '@/lib/usage/assert-plan-limit'
import { rateLimit } from '@/lib/security/rate-limit'
import { apiError } from '@/lib/api/error'
import type { CanvasInterpretResponse, CanvasIntent } from '@/lib/types'

const ROUTE_KEY = 'hatch_canvas_interpret'

const SceneColumnSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.string().max(200).optional(),
  constraints: z.array(z.enum(['PK', 'FK', 'UNIQUE', 'NOT NULL', 'INDEX'])).max(10),
  foreignKey: z.object({
    table: z.string().min(1).max(200),
    column: z.string().min(1).max(200),
  }).optional(),
  raw: z.string().max(1000),
})

const CanvasSceneSchema = z.object({
  elementCount: z.number().int().min(0).max(5000),
  entities: z.array(z.object({
    id: z.string().min(1).max(200),
    label: z.string().min(1).max(500),
    type: z.string().min(1).max(100),
    x: z.number().finite(),
    y: z.number().finite(),
    width: z.number().finite(),
    height: z.number().finite(),
    columns: z.array(SceneColumnSchema).max(200),
  })).max(1000),
  connections: z.array(z.object({
    from: z.string().min(1).max(500),
    to: z.string().min(1).max(500),
    label: z.string().max(500).optional(),
  })).max(2000),
  groups: z.array(z.object({
    label: z.string().min(1).max(500),
    members: z.array(z.string().min(1).max(500)).max(1000),
  })).max(1000),
  freeText: z.array(z.string().max(5000)).max(1000),
  foreignKeys: z.array(z.object({
    from: z.string().min(1).max(200),
    fromColumn: z.string().min(1).max(200),
    toTable: z.string().min(1).max(200),
    toColumn: z.string().min(1).max(200),
  })).max(1000),
})

const ChatHistoryMessageSchema = z.object({
  role: z.enum(['user', 'hatch']),
  content: z.string().min(1).max(20000),
})

const RequestSchema = z.object({
  message: z.string().trim().min(1).max(20000),
  scene: CanvasSceneSchema.optional(),
  canvasSummary: z.string().max(20000).optional(),
  history: z.array(ChatHistoryMessageSchema).max(50).optional(),
  challengeId: z.string().max(200).optional(),
  challengeType: z.enum(['system_design', 'data_modeling', 'coding']).optional(),
  attemptId: z.string().max(200).optional(),
  context_pack: z.string().max(50000).nullable().optional(),
  current_code: z.string().max(200000).nullable().optional(),
  current_language: z.string().max(40).nullable().optional(),
  last_run_result: z.unknown().optional(),
  time_elapsed_seconds: z.number().finite().nonnegative().optional(),
  time_remaining_seconds: z.number().finite().nonnegative().optional(),
  sql_schema_summary: z.string().max(50000).nullable().optional(),
  challenge_title: z.string().max(1000).nullable().optional(),
  problem_statement: z.string().max(50000).nullable().optional(),
  active_part_id: z.string().max(200).nullable().optional(),
  active_part_sequence: z.number().int().positive().optional(),
  active_part_title: z.string().max(1000).nullable().optional(),
  active_part_prompt: z.string().max(50000).nullable().optional(),
  active_part_response_type: z.string().max(100).nullable().optional(),
  active_part_weight_pct: z.number().finite().min(0).max(100).optional(),
})

function retryAfterSeconds(resetAt: Date) {
  return Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000))
}

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

function loadCodingCoachSkill(): string {
  try {
    const skillPath = join(
      process.env.HOME ?? '/root',
      '.claude/skills/hackproduct-coding-coach/SKILL.md'
    )
    return readFileSync(skillPath, 'utf-8')
  } catch {
    // Fallback inline prompt if skill file is unavailable
    return `You are Hatch, a coding interview coach for HackProduct. The user is solving a timed coding interview challenge.

Your role: Socratic thinking partner — guide, don't solve. Read their code and recent test results before responding.

Rules:
- If user asks for the complete solution: decline and redirect. "Not going to do that. What's your first instinct?"
- For debugging: read their code, identify the issue, ask a leading question that points them at it.
- Freely explain: time/space complexity, data structure choices, algorithm theory, language idioms, syntax.
- If stuck 3+ exchanges: give a stronger hint — still not the full solution.
- Always return: { "intent": "coach", "message": "...", "actions": [], "annotations": [] }
- Never set intent to "build" or "build_and_coach" for coding challenges.`
  }
}

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

const CONTEXT_CANVAS_RULES = `Context Pack + canvas behavior:
- Treat the Context Pack as the user's working memory: assumptions, constraints, interfaces, and open questions. It is not separate from the diagram.
- Compare intent vs artifact. If the Context Pack mentions something absent from the canvas, call that out or build the smallest useful canvas change.
- If the user asks to "build from notes", "turn notes into canvas", or similar, translate only the highest-signal context into concrete canvas elements. Do not dump every note onto the canvas.
- If Context Pack and canvas conflict, name the conflict directly and suggest the decision the candidate should make.
- In coach mode, prefer: one observation, one next canvas move, one tradeoff to defend.`

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
  if (challengeType === 'coding') {
    return loadCodingCoachSkill()
  }
  const domain =
    challengeType === 'data_modeling' ? DATA_MODELING_RULES : SYSTEM_DESIGN_RULES
  return [COACH_PERSONA, ROUTING_RULES, CONTEXT_CANVAS_RULES, domain, ACTION_SCHEMA].join('\n\n')
}

type InterpretBody = z.infer<typeof RequestSchema>

function buildCodingUserContent(body: InterpretBody): string {
  const historyText = (body.history ?? [])
    .slice(-6)
    .map((m) => `${m.role === 'hatch' ? 'Hatch' : 'User'}: ${m.content}`)
    .join('\n')

  const lastRunSummary = body.last_run_result
    ? JSON.stringify(body.last_run_result, null, 2)
    : 'No test run yet.'

  const timeElapsedMin = body.time_elapsed_seconds != null
    ? `${Math.floor(body.time_elapsed_seconds / 60)}m ${body.time_elapsed_seconds % 60}s`
    : 'unknown'
  const timeRemainingMin = body.time_remaining_seconds != null
    ? `${Math.floor(body.time_remaining_seconds / 60)}m ${body.time_remaining_seconds % 60}s`
    : 'unknown'

  const parts: string[] = []

  if (body.challenge_title || body.problem_statement) {
    const title = body.challenge_title ?? 'Untitled challenge'
    const statement = body.problem_statement?.trim()
    parts.push(
      `# Challenge (shared context)\n## ${title}\n` +
      (statement ? `\n${statement}` : '(no problem statement provided)')
    )
  }

  // Multi-part: emphasize the part the user is currently working on so the
  // coach scopes guidance to that subtask.
  if (body.active_part_id && body.active_part_title) {
    const partType = body.active_part_response_type === 'pure_mcq' ? 'MCQ probe' : 'coding subtask'
    const seq = body.active_part_sequence ? `Part ${body.active_part_sequence}` : 'Active part'
    const weight = body.active_part_weight_pct != null ? ` (${body.active_part_weight_pct}% of total)` : ''
    const promptBlock = body.active_part_prompt?.trim()
    parts.push(
      `# Active part — answer ONLY about this part unless the user asks otherwise\n` +
      `## ${seq}: ${body.active_part_title} — ${partType}${weight}\n` +
      (promptBlock ? `\n${promptBlock}` : '(no per-part prompt — see shared context above)')
    )
  } else {
    parts.push(
      `# Active part\nNo part is currently open. The user is on the shared context. ` +
      `If they ask about a specific part, suggest they open it in the parts panel.`
    )
  }

  parts.push(
    `# User context\n` +
    `- Language: ${body.current_language ?? 'unknown'}\n` +
    `- Time elapsed: ${timeElapsedMin}\n` +
    `- Time remaining: ${timeRemainingMin}`
  )

  if (body.current_code != null && body.current_code.trim()) {
    parts.push(
      `# Current code\n\`\`\`${body.current_language ?? ''}\n${body.current_code}\n\`\`\``
    )
  } else {
    parts.push(`# Current code\n(editor is empty)`)
  }

  parts.push(`# Last run result\n${lastRunSummary}`)

  if (body.sql_schema_summary) {
    parts.push(`# Schema\n${body.sql_schema_summary}`)
  }

  if (historyText) {
    parts.push(`# Recent conversation\n${historyText}`)
  }

  parts.push(`# User's latest message\n${body.message}`)

  return parts.join('\n\n')
}

function buildUserContent(body: InterpretBody): string {
  if (body.challengeType === 'coding') {
    return buildCodingUserContent(body)
  }
  const sceneText = body.scene
    ? sceneToPrompt(body.scene)
    : body.canvasSummary || 'The canvas is empty.'
  const historyText = (body.history ?? [])
    .slice(-6)
    .map((m) => `${m.role === 'hatch' ? 'Hatch' : 'User'}: ${m.content}`)
    .join('\n')
  return [
    `# Canvas state\n${sceneText}`,
    body.context_pack?.trim() ? `# Context Pack\n${body.context_pack.trim()}` : null,
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
  userContent: string,
  isCodingMode = false,
  budget?: { userId: string; userPlan: string; route: string }
): Promise<CanvasInterpretResponse> {
  const response = await guardedCachedMessage(systemPrompt, userContent, {
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    budget,
  })
  const raw = response.sanitized.trim()
  if (!raw) throw new Error('Non-text response')

  // For coding mode: the skill may return plain text or JSON — handle both.
  if (isCodingMode) {
    // Try to parse as JSON first (skill instructs JSON output)
    try {
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
      const parsed = JSON.parse(cleaned)
      // Enforce coding constraints: always coach, never build
      return {
        intent: 'coach',
        message: typeof parsed.message === 'string' ? parsed.message : raw,
        actions: [],
        annotations: [],
      }
    } catch {
      // Model returned plain text — wrap it
      return {
        intent: 'coach',
        message: raw,
        actions: [],
        annotations: [],
      }
    }
  }

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
    return apiError(401, 'auth_required', 'Unauthorized')
  }
  const userPlan = await getUserPlanForBudget(user.id)
  const throttle = await rateLimit({
    key: `ai:${user.id}:${ROUTE_KEY}`,
    limit: userPlan === 'pro' ? 15 : 5,
    windowSec: 60,
  })

  if (!throttle.allowed) {
    const retryAfter = retryAfterSeconds(throttle.resetAt)
    const response = apiError(429, 'rate_limited', 'rate_limited', { retryAfter })
    response.headers.set('Retry-After', String(retryAfter))
    return response
  }

  const budget = { userId: user.id, userPlan, route: ROUTE_KEY }

  let body: InterpretBody
  try {
    body = RequestSchema.parse(await req.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, 'invalid_request', 'Invalid request body', {
        issues: validationIssues(error),
      })
    }
    return apiError(400, 'invalid_json', 'Invalid JSON body')
  }

  const challengeType = body.challengeType ?? 'system_design'
  const isCodingMode = challengeType === 'coding'
  const systemPrompt = buildSystemPrompt(challengeType)
  const userContent = buildUserContent(body)

  try {
    await assertPlanLimit(user.id, userPlan, 'hatch_canvas_interprets')

    let result: CanvasInterpretResponse
    try {
      result = await callClaude(systemPrompt, userContent, isCodingMode, budget)
    } catch {
      result = await callClaude(
        systemPrompt,
        userContent + '\n\nReturn ONLY valid JSON, no markdown, no prose.',
        isCodingMode,
        budget
      )
    }
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof PlanLimitExceeded) {
      return apiError(402, 'limit_reached', 'limit_reached', {
        feature: error.feature,
        used: error.used,
        limit: error.limit,
        windowDays: error.windowDays,
      })
    }

    if (error instanceof AiBudgetExceededError) {
      return apiError(402, 'limit_reached', 'limit_reached', {
        feature: 'hatch_ai_cents',
        used: error.used,
        limit: error.limit,
        windowDays: error.windowDays,
      })
    }

    console.error('Canvas interpret error:', error)
    return NextResponse.json({
      intent: 'coach' as const,
      message: "I had trouble with that. Can you try rephrasing?",
      actions: [],
    } satisfies CanvasInterpretResponse)
  }
}
