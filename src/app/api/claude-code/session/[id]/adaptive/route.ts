// PATCH /api/claude-code/session/[id]/adaptive
//
// Persists the session's live adaptive state (guidance level, the current
// arc including injected steps, and the adjustment/injection log) into
// claude_code_sessions.final_artifact.adaptive, so a refresh reconstructs
// the exact adapted arc and finalize/grading can narrate the session.
// Design: docs/superpowers/specs/2026-07-04-adaptive-workspaces-design.md §5.

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const StepSchema = z.object({
  id: z.string().min(1).max(200),
  sequence: z.number().int().positive(),
  title: z.string().max(1000),
  objective: z.string().max(4000),
  successCriterion: z.string().max(4000),
  suggestedPrompts: z.array(z.string().max(1000)).max(10),
  kind: z.string().max(40),
  rubricDimension: z.string().max(100).optional(),
  teachingNote: z.string().max(4000).optional(),
  learnChecklist: z.array(z.string().max(1000)).max(10).optional(),
})

const BodySchema = z.object({
  guidance: z.enum(['scaffolded', 'guided', 'open']),
  arc: z.array(StepSchema).min(1).max(20),
  injected: z
    .array(
      z.object({
        id: z.string().max(200),
        kind: z.string().max(40),
        afterStepId: z.string().max(200).nullable(),
        reason: z.string().max(500),
      }),
    )
    .max(4),
  adjustments: z
    .array(
      z.object({
        from: z.string().max(20),
        to: z.string().max(20),
        trigger: z.string().max(200),
        atStepId: z.string().max(200).nullable(),
      }),
    )
    .max(4),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await params
  if (!sessionId) return NextResponse.json({ error: 'Missing session id' }, { status: 400 })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof BodySchema>
  try {
    body = BodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: session } = await admin
    .from('claude_code_sessions')
    .select('id, user_id, status, final_artifact')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session || session.user_id !== user.id) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
  // A terminated session's artifact is the grade — never mutate it afterward.
  if (session.status === 'terminated') {
    return NextResponse.json({ error: 'Session already finalized' }, { status: 409 })
  }

  const prior = (session.final_artifact as Record<string, unknown> | null) ?? {}
  const priorAdaptive = (prior.adaptive as Record<string, unknown> | undefined) ?? {}
  const { error } = await admin
    .from('claude_code_sessions')
    .update({
      final_artifact: {
        ...prior,
        adaptive: {
          ...priorAdaptive,
          guidance: body.guidance,
          arc: body.arc,
          injected: body.injected,
          adjustments: body.adjustments,
          updated_at: new Date().toISOString(),
        },
      },
    })
    .eq('id', sessionId)

  if (error) {
    console.error('[cc/session/adaptive] persist failed:', error)
    return NextResponse.json({ error: 'Persist failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
