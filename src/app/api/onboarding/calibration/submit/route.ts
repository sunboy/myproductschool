import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { FlowMove } from '@/lib/types'

interface CalibrationResponses {
  frame?: string
  list?: string
  optimize?: string
  win?: string
}

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.json({ attempt_id: 'mock-calibration-1' })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { responses, move, answers } = body as { responses?: CalibrationResponses; move?: string; answers?: Record<string, string> }

  // Support both full responses object and single-move submission
  const resolvedResponses: CalibrationResponses = responses ?? {}
  if (move && answers) {
    resolvedResponses[move as keyof CalibrationResponses] = Object.values(answers).join('\n\n')
  }

  if (!resolvedResponses.frame && !resolvedResponses.list && !resolvedResponses.optimize && !resolvedResponses.win) {
    return NextResponse.json({ error: 'At least one FLOW move response is required' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Insert calibration attempt record
  const { data: attempt, error: attemptError } = await adminClient
    .from('calibration_attempts')
    .insert({
      user_id: user.id,
      responses_json: responses,
      status: 'grading',
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (attemptError) return NextResponse.json({ error: attemptError.message }, { status: 500 })

  // Seed initial move_levels for each FLOW move (will be updated by grading)
  const moves: FlowMove[] = ['frame', 'list', 'optimize', 'win']
  await adminClient
    .from('move_levels')
    .upsert(
      moves.map(move => ({
        user_id: user.id,
        move,
        level: 1,
        progress_pct: 0,
        xp: 0,
      })),
      { onConflict: 'user_id,move' }
    )

  // Seed initial learner_competencies (6 axes) — score=50 neutral midpoint
  const ALL_COMPETENCIES = [
    'motivation_theory', 'cognitive_empathy', 'taste',
    'strategic_thinking', 'creative_execution', 'domain_expertise',
  ]
  await adminClient
    .from('learner_competencies')
    .upsert(
      ALL_COMPETENCIES.map(comp => ({
        user_id: user.id,
        competency: comp,
        score: 50,
        total_attempts: 0,
        trend: 'steady',
        trend_slope: 0,
        last_updated: new Date().toISOString(),
      })),
      { onConflict: 'user_id,competency' }
    )

  return NextResponse.json({ attempt_id: attempt.id })
}
