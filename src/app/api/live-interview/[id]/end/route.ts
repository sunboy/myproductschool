import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateDebrief } from '@/lib/live-interview/debrief-generator'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (process.env.USE_MOCK_DATA === 'true') {
    const { MOCK_LIVE_DEBRIEF } = await import('@/lib/mock-live-interviews')
    return Response.json({ debriefJson: MOCK_LIVE_DEBRIEF, sessionId: id })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const adminClient = createAdminClient()

  // Load session + turns in parallel
  const [sessionResult, turnsResult] = await Promise.all([
    adminClient.from('live_interview_sessions').select('*').eq('id', id).single(),
    adminClient
      .from('live_interview_turns')
      .select('role, content, turn_index')
      .eq('session_id', id)
      .order('turn_index', { ascending: true }),
  ])

  if (!sessionResult.data) {
    return new Response('Session not found', { status: 404 })
  }

  const session = sessionResult.data
  const turns = (turnsResult.data ?? []).map((t) => ({
    role: t.role as 'luma' | 'user',
    content: t.content,
    turnIndex: t.turn_index,
  }))

  const debriefResult = await generateDebrief({
    sessionId: id,
    turns,
    calibrationSnapshot: session.calibration_snapshot ?? { archetype: 'Analyst', moveLevels: {} },
  })

  const duration = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)

  // Update session status
  await adminClient
    .from('live_interview_sessions')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      duration_seconds: duration,
      debrief_json: debriefResult,
    })
    .eq('id', id)

  // Upsert learner_competencies — fetch current scores first
  if (debriefResult.competencySignals?.length > 0) {
    const competencies = [...new Set(debriefResult.competencySignals.map((s) => s.competency))]

    const { data: currentScores } = await adminClient
      .from('learner_competencies')
      .select('competency, score')
      .eq('user_id', user.id)
      .in('competency', competencies)

    const scoreMap = new Map<string, number>()
    for (const row of currentScores ?? []) {
      scoreMap.set(row.competency, row.score)
    }

    await Promise.all(
      competencies.map((competency) => {
        const currentScore = scoreMap.get(competency) ?? 50
        const newScore = Math.min(100, Math.max(0, currentScore + 2))
        return adminClient.from('learner_competencies').upsert(
          {
            user_id: user.id,
            competency,
            score: newScore,
            last_updated: new Date().toISOString(),
          },
          { onConflict: 'user_id,competency' }
        )
      })
    )
  }

  // Insert failure patterns detected
  if (debriefResult.failurePatternsDetected?.length > 0) {
    await adminClient.from('user_failure_patterns').insert(
      debriefResult.failurePatternsDetected.map((fp) => ({
        user_id: user.id,
        pattern_id: fp.patternId,
        pattern_name: fp.patternName,
        evidence: fp.evidence,
        detected_at: new Date().toISOString(),
      }))
    )
  }

  return Response.json({ debriefJson: debriefResult, sessionId: id })
}
