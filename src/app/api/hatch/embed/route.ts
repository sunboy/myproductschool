// POST /api/hatch/embed
//
// Fire-and-forget context capture. The claude-code finalize route has always
// POSTed here after grading, but the route never existed — every call 404ed
// silently (2026-07-04 vector audit). It now stores a compact, text-only
// summary of the finished session into hatch_context so Hatch's coaching
// surfaces can reference the learner's analytics work.
//
// Internal-only: callers are our own server routes (finalize), so require the
// service-role key via header rather than a user cookie.

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { embedAndStoreContext } from '@/lib/notes/embeddings'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  type: z.literal('claude_code_session'),
  session_id: z.string().min(1).max(200),
  attempt_id: z.string().max(200).nullable().optional(),
  transcript_uri: z.string().max(2000).nullable().optional(),
})

export async function POST(req: NextRequest) {
  let body: z.infer<typeof BodySchema>
  try {
    body = BodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: session } = await admin
    .from('claude_code_sessions')
    .select('id, user_id, challenge_id, status, final_artifact, prompt_count, warehouse_query_count')
    .eq('id', body.session_id)
    .maybeSingle()

  if (!session || session.status !== 'terminated') {
    // Nothing embeddable yet (or unknown session) — fire-and-forget contract
    // means the caller never cares, but be honest in the status code.
    return NextResponse.json({ ok: false, reason: 'no_finalized_session' }, { status: 404 })
  }

  const fa = (session.final_artifact ?? {}) as {
    grade_label?: string
    total_score?: number
    dimensions?: Record<string, { score?: number; note?: string }>
    adaptive?: { guidance?: string; injected?: Array<{ kind?: string }> }
  }

  const dimLines = Object.entries(fa.dimensions ?? {})
    .filter(([, v]) => typeof v?.score === 'number')
    .map(([k, v]) => `${k}: ${v.score}${v.note ? ` (${String(v.note).slice(0, 120)})` : ''}`)
  const adaptiveLine = fa.adaptive?.guidance
    ? `Guidance level: ${fa.adaptive.guidance}${fa.adaptive.injected?.length ? `, ${fa.adaptive.injected.length} adaptive step(s) injected` : ''}`
    : null

  const summary = [
    `Completed a Claude Code analytics session on challenge ${session.challenge_id}.`,
    typeof fa.total_score === 'number' ? `Score: ${fa.total_score}/100 (${fa.grade_label ?? 'graded'}).` : null,
    dimLines.length ? `Rubric: ${dimLines.join('; ')}.` : null,
    adaptiveLine,
    `Activity: ${session.prompt_count ?? 0} prompts, ${session.warehouse_query_count ?? 0} warehouse queries.`,
  ].filter(Boolean).join(' ')

  // context_type must satisfy the live table's CHECK constraint
  // (luma_context_v2: calibration/challenge_insight/weakness_alert/streak_note/
  // plan_progress/role_observation). A session summary is a challenge insight;
  // metadata.kind preserves the finer classification.
  await embedAndStoreContext(
    session.user_id as string,
    'challenge_insight',
    summary,
    body.session_id,
    { kind: 'cc_session_summary', challenge_id: session.challenge_id, attempt_id: body.attempt_id ?? null },
  )

  return NextResponse.json({ ok: true })
}
