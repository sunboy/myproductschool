import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Auth: check debug key
  const debugKey = process.env.ADMIN_DEBUG_KEY
  const providedKey = request.headers.get('x-debug-key')
  if (!debugKey || providedKey !== debugKey) {
    return new Response('Forbidden', { status: 403 })
  }

  const adminClient = createAdminClient()

  // Fetch session + turns in parallel
  const [sessionResult, turnsResult] = await Promise.all([
    adminClient
      .from('live_interview_sessions')
      .select('*')
      .eq('id', id)
      .single(),
    adminClient
      .from('live_interview_turns')
      .select('turn_index, role, content, flow_move_detected, competency_signals, created_at')
      .eq('session_id', id)
      .order('turn_index', { ascending: true }),
  ])

  if (!sessionResult.data) {
    return new Response('Session not found', { status: 404 })
  }

  const session = sessionResult.data
  const turns = turnsResult.data ?? []

  const snapshot = session.calibration_snapshot as {
    archetype?: string
    moveLevels?: object
    failurePatterns?: object[]
  } | null

  return Response.json({
    sessionId: id,
    status: session.status,
    systemPrompt: session.system_prompt ?? '',
    systemPromptLength: (session.system_prompt ?? '').length,
    calibrationSnapshot: snapshot,
    flowCoverage: session.flow_coverage,
    totalTurns: session.total_turns ?? 0,
    turns: turns.map((t) => ({
      turnIndex: t.turn_index,
      role: t.role,
      content: t.content,
      flowMoveDetected: t.flow_move_detected,
      competencySignals: t.competency_signals,
      createdAt: t.created_at,
    })),
    lumaContextPreview: (session.system_prompt ?? '').slice(0, 500),
    hasCalibrationData: !!(snapshot?.archetype && snapshot?.moveLevels),
  })
}
