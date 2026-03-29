import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { FlowMove } from '@/lib/types'

interface CalibrationResponses {
  frame: string
  list: string
  optimize: string
  win: string
}

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.json({ attempt_id: 'mock-calibration-1' })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { responses } = body as { responses: CalibrationResponses }

  if (!responses || !responses.frame || !responses.list || !responses.optimize || !responses.win) {
    return NextResponse.json({ error: 'All four FLOW move responses are required' }, { status: 400 })
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

  return NextResponse.json({ attempt_id: attempt.id })
}
