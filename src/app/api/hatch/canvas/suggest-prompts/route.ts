// POST /api/hatch/canvas/suggest-prompts
//
// Returns 2-3 contextual "Try next" chips for the Claude Code Analytics medium,
// based on what the user is actually doing right now (the live terminal tail +
// the active sub-problem + MCP/REPL state). Cheap Haiku call. The medium falls
// back to the step's static arc prompts on any failure, so this is best-effort.
//
// Auth: user cookie (createClient). Rate-limited + plan-gated like the nudge
// route. Returns { prompts: string[] } — empty array means "use the fallback".

import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { createClient } from '@/lib/supabase/server'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { rateLimit } from '@/lib/security/rate-limit'
import { apiError } from '@/lib/api/error'

const ROUTE_KEY = 'hatch_canvas_suggest_prompts'

const SYSTEM_PROMPT = `You are Hatch, coaching a live Claude Code analytics session. The learner drives a real \`claude\` CLI wired to a BigQuery dataset by typing plain-language prompts; Claude runs the SQL.

Your job: given what the learner is doing RIGHT NOW (the terminal tail + the current step), write 2-3 SHORT next prompts they could click to type into the session. The chips must reflect the actual state, not generic step boilerplate.

Rules:
- React to the live terminal. If the last output shows an error, a permission denial, an empty result, or a specific table/column/number, write a chip that moves from THAT. If they just saw a schema, suggest the natural next query on those exact columns.
- If the BigQuery MCP is not connected yet, the only useful chips are the shell setup: "claude mcp add bigquery -- bq-mcp" then "claude".
- If the MCP is connected but the \`claude\` REPL is not running yet, suggest exactly: "claude".
- Once in the REPL, chips are natural-language prompts the learner types TO Claude (not shell commands). Reference real entities from the terminal when you can (table names, columns, a step name, a percentage).
- Keep each chip under ~12 words. No trailing punctuation. No numbering.
- Voice: direct, plain. No em dashes. No AI slop (delve, leverage, robust, seamlessly, utilize). Never "you are a [role]".
- Prefer prompts that advance the CURRENT step's goal. Do not jump ahead to later steps.

ALWAYS return exactly 3 chips. There is always a sensible next move for the current state, so never return an empty list. If the terminal tail gives you nothing specific, fall back to sharper, rephrased versions of the step's default chips.

Output ONLY this JSON, no markdown:
{ "prompts": ["...", "...", "..."] }`

const RequestSchema = z.object({
  challengeId: z.string().max(200).optional(),
  challengeType: z.enum(['claude_code_analytics', 'claude_code_debugging']),
  mcp_connected: z.boolean().optional(),
  repl_running: z.boolean().optional(),
  terminal_tail: z.string().max(4000).nullable().optional(),
  active_sub_problem_id: z.string().max(200).nullable().optional(),
  active_sub_problem_kind: z.string().max(40).nullable().optional(),
  active_sub_problem_title: z.string().max(1000).nullable().optional(),
  active_sub_problem_objective: z.string().max(2000).nullable().optional(),
  active_sub_problem_success_criterion: z.string().max(2000).nullable().optional(),
  // The step's static prompts — given to the model as the baseline to improve on.
  fallback_prompts: z.array(z.string().max(400)).max(6).optional(),
  guidance_level: z.enum(['scaffolded', 'guided', 'open']).optional(),
})

function retryAfterSeconds(resetAt: Date) {
  return Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000))
}

function buildUserContent(body: z.infer<typeof RequestSchema>): string {
  const lines: string[] = []
  lines.push('## Session state')
  lines.push(`- BigQuery MCP connected: ${body.mcp_connected ? 'yes' : 'no'}`)
  lines.push(`- claude REPL running: ${body.repl_running ? 'yes' : 'no'}`)
  if (body.active_sub_problem_title) {
    lines.push('')
    lines.push(`## Current step: ${body.active_sub_problem_title}` + (body.active_sub_problem_kind ? ` (${body.active_sub_problem_kind})` : ''))
    if (body.active_sub_problem_objective) lines.push(`Objective: ${body.active_sub_problem_objective}`)
    if (body.active_sub_problem_success_criterion) lines.push(`Done when: ${body.active_sub_problem_success_criterion}`)
  }
  if (body.fallback_prompts?.length) {
    lines.push('')
    lines.push('## The step\'s default chips (improve on these if the live state lets you):')
    for (const p of body.fallback_prompts) lines.push(`- ${p}`)
  }
  lines.push('')
  lines.push('## Terminal tail (most recent at the bottom)')
  lines.push('```')
  lines.push(body.terminal_tail?.slice(-3000) || '(no output yet)')
  lines.push('```')
  lines.push('')
  if (body.guidance_level === 'scaffolded') {
    lines.push('Write 3 contextual chips now. This learner is early: chips should be complete, copy-ready prompts that name the exact table or step element.')
  } else if (body.guidance_level === 'open') {
    lines.push('Write 1 contextual chip now. This learner is experienced: one sharp, open-ended direction, never a hand-holding recipe.')
  } else {
    lines.push('Write the 2-3 contextual chips now.')
  }
  return lines.join('\n')
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError(401, 'auth_required', 'Unauthorized')

  const userPlan = await getUserPlanForBudget(user.id)
  const throttle = await rateLimit({
    key: `ai:${user.id}:${ROUTE_KEY}`,
    limit: userPlan === 'pro' ? 30 : 12,
    windowSec: 60,
  })
  if (!throttle.allowed) {
    const retryAfter = retryAfterSeconds(throttle.resetAt)
    const response = apiError(429, 'rate_limited', 'rate_limited', { retryAfter })
    response.headers.set('Retry-After', String(retryAfter))
    return response
  }

  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await req.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, 'invalid_request', 'Invalid request body')
    }
    return apiError(400, 'invalid_json', 'Invalid JSON body')
  }

  try {
    // No monthly feature cap here: chips are fetched frequently (every step +
    // debounced terminal activity), so they must NOT share the hatch_nudges
    // budget. The per-minute rate limit above + the dollar AI-budget guard
    // inside guardedCachedMessage are the cost controls.
    const response = await guardedCachedMessage(SYSTEM_PROMPT, buildUserContent(body), {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      budget: { userId: user.id, userPlan, route: ROUTE_KEY },
    })
    if (!response.sanitized) return NextResponse.json({ prompts: [] })

    // Tolerant parse: the model may wrap the JSON in prose or fences. Strip
    // fences, then if a direct parse fails, extract the first {...} object.
    const raw = response.sanitized.trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
    let parsed: { prompts?: unknown } | null = null
    try {
      parsed = JSON.parse(raw)
    } catch {
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) { try { parsed = JSON.parse(match[0]) } catch { /* give up */ } }
    }
    const prompts = parsed && Array.isArray(parsed.prompts)
      ? parsed.prompts
          .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
          .map((p) => p.trim())
          .slice(0, 3)
      : []
    return NextResponse.json({ prompts })
  } catch (error) {
    // Dollar AI-budget exceeded → return empty so the medium uses its static
    // fallback chips. Any other error is non-critical; fall back the same way.
    if (error instanceof AiBudgetExceededError) {
      return NextResponse.json({ prompts: [] })
    }
    console.error('suggest-prompts error:', error)
    return NextResponse.json({ prompts: [] })
  }
}
