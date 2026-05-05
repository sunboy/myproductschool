import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateDebrief } from '@/lib/live-interview/debrief-generator'
import { gradeArtifact } from '@/lib/live-interview/artifact-grader'
import { FLOW_MAX_SCORE } from '@/lib/scoring/flow-scale'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'

const INTERVIEW_DIFFICULTY_BASE_XP: Record<string, number> = {
  beginner: 60,
  intermediate: 90,
  advanced: 120,
}

const DEFAULT_INTERVIEW_BASE_XP = 80

function aiBudgetResponse(error: unknown) {
  if (!(error instanceof AiBudgetExceededError)) return null

  return Response.json(
    {
      error: 'limit_reached',
      feature: 'hatch_ai_cents',
      used: error.used,
      limit: error.limit,
      windowDays: error.windowDays,
    },
    { status: 402 }
  )
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (process.env.USE_MOCK_DATA === 'true') {
    const { MOCK_LIVE_DEBRIEF } = await import('@/lib/mock-live-interviews')
    return Response.json({ debriefJson: MOCK_LIVE_DEBRIEF, sessionId: id })
  }

  // Handle abandoned sessions (sent via sendBeacon on tab close)
  let abandoned = false
  try {
    const body = await request.json()
    abandoned = body?.abandoned === true
  } catch {
    // No body or invalid JSON — normal end
  }

  const adminClient = createAdminClient()

  if (abandoned) {
    await adminClient
      .from('live_interview_sessions')
      .update({ status: 'abandoned', ended_at: new Date().toISOString() })
      .eq('id', id)
    return Response.json({ ok: true, abandoned: true })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

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
  if (session.user_id !== user.id) {
    return new Response('Session not found', { status: 404 })
  }

  if (session.status === 'completed') {
    return Response.json({
      debriefJson: session.debrief_json ?? null,
      sessionId: id,
      alreadyCompleted: true,
    })
  }

  const turns = (turnsResult.data ?? []).map((t) => ({
    role: t.role as 'hatch' | 'user',
    content: t.content,
    turnIndex: t.turn_index,
  }))
  const userPlan = await getUserPlanForBudget(user.id)
  const budget = { userId: user.id, userPlan, route: 'live_interview_debrief' }

  // Grade artifact if one was captured during the session
  const calibrationSnap = (session.calibration_snapshot ?? {}) as Record<string, unknown>
  const artifactSnapshot = calibrationSnap._artifactSnapshot as {
    type: 'canvas' | 'editor'
    elementCount?: number
    code?: string
    language?: string
    runResult?: unknown
    discipline?: string
  } | undefined

  let artifactGrading: Awaited<ReturnType<typeof gradeArtifact>> | null = null
  if (artifactSnapshot && process.env.ANTHROPIC_API_KEY) {
    try {
      artifactGrading = await gradeArtifact(artifactSnapshot, { ...budget, route: 'live_interview_artifact_grade' })
    } catch (err) {
      const response = aiBudgetResponse(err)
      if (response) return response
      console.error('Artifact grading error:', err)
    }
  }

  // Apply flow_signal_boosts from artifact grading to session coverage before generating debrief
  let boostedFlowCoverage: Record<string, number> | undefined
  if (artifactGrading?.flow_signal_boosts) {
    const baseCoverage = (session.flow_coverage ?? { frame: 0, list: 0, optimize: 0, win: 0 }) as Record<string, number>
    const boosts = artifactGrading.flow_signal_boosts
    boostedFlowCoverage = {
      frame: Math.min(1.0, (baseCoverage.frame ?? 0) + (boosts.frame ?? 0)),
      list: Math.min(1.0, (baseCoverage.list ?? 0) + (boosts.list ?? 0)),
      optimize: Math.min(1.0, (baseCoverage.optimize ?? 0) + (boosts.optimize ?? 0)),
      win: Math.min(1.0, (baseCoverage.win ?? 0) + (boosts.win ?? 0)),
    }
    // Persist boosted coverage so debrief generator sees it via session state
    await adminClient
      .from('live_interview_sessions')
      .update({ flow_coverage: boostedFlowCoverage })
      .eq('id', id)
  }

  let debriefResult
  try {
    debriefResult = await generateDebrief({
      sessionId: id,
      turns,
      calibrationSnapshot: session.calibration_snapshot ?? { archetype: 'Analyst', moveLevels: {} },
      scenarioRubric: session.scenario_rubric ?? null,
      challengeId: session.challenge_id ?? null,
      budget,
    })
  } catch (err) {
    const response = aiBudgetResponse(err)
    if (response) return response
    throw err
  }

  const duration = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)

  const debriefWithArtifact = artifactGrading
    ? { ...debriefResult, artifactGrading }
    : debriefResult

  // Update session status
  await adminClient
    .from('live_interview_sessions')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      duration_seconds: duration,
      debrief_json: debriefWithArtifact,
    })
    .eq('id', id)

  // Reward policy for completed interviews:
  // XP scales with debrief score and challenge difficulty (or default interview base),
  // then applies the same streak multiplier used across challenge completion paths.
  const [{ data: profileRow }, { data: challengeRow }] = await Promise.all([
    adminClient.from('profiles').select('xp_total, streak_days').eq('id', user.id).single(),
    session.challenge_id
      ? adminClient.from('challenges').select('difficulty').eq('id', session.challenge_id).single()
      : Promise.resolve({ data: null }),
  ])

  if (profileRow) {
    const difficultyBase = INTERVIEW_DIFFICULTY_BASE_XP[challengeRow?.difficulty ?? ''] ?? DEFAULT_INTERVIEW_BASE_XP
    const scoreFactor = Math.max(0, Math.min(1, debriefResult.overallScore / FLOW_MAX_SCORE))
    const baseXp = Math.round(difficultyBase * scoreFactor)
    const streakMultiplier = Math.min(1 + (profileRow.streak_days ?? 0) * 0.05, 1.5)
    const xpEarned = Math.round(baseXp * streakMultiplier)

    await adminClient
      .from('profiles')
      .update({ xp_total: (profileRow.xp_total ?? 0) + xpEarned })
      .eq('id', user.id)

    await adminClient.rpc('update_user_streak', { p_user_id: user.id })
  }

  // If this session is part of a loop, run post-processing
  const sessionLoopId = (session as unknown as { loop_id?: string | null }).loop_id
  const sessionRoundIndex = (session as unknown as { round_index?: number | null }).round_index

  if (sessionLoopId && sessionRoundIndex !== null && sessionRoundIndex !== undefined && !abandoned) {
    try {
      const { distillRoundContext } = await import('@/lib/interview-loops/loop-context-distiller')
      const { generateLoopDebrief } = await import('@/lib/interview-loops/loop-debrief-generator')

      // Fetch the loop and current round discipline
      const [loopResult, roundResult] = await Promise.all([
        adminClient.from('interview_loops' as string).select('*').eq('id', sessionLoopId).single(),
        adminClient.from('loop_rounds' as string).select('discipline, id').eq('loop_id', sessionLoopId).eq('round_index', sessionRoundIndex).single(),
      ])

      const loop = loopResult.data as {
        cross_round_memory: unknown[]
        current_round_index: number
        round_order: string[]
        target_company: string | null
        target_role: string | null
      } | null

      const roundDiscipline = (roundResult.data as { discipline?: string } | null)?.discipline ?? 'product_sense'
      const roundId = (roundResult.data as { id?: string } | null)?.id

      if (loop) {
        // Distil signals from this round's debrief
        const debriefForDistill = (typeof debriefResult === 'object' && debriefResult !== null)
          ? debriefResult as unknown as Record<string, unknown>
          : {}

        const newSignals = await distillRoundContext({
          roundDebriefJson: debriefForDistill,
          roundIndex: sessionRoundIndex,
          discipline: roundDiscipline as import('@/lib/interview-loops/types').LoopDiscipline,
          budget: { ...budget, route: 'interview_loop_distill' },
        })

        const updatedMemory = [...(loop.cross_round_memory ?? []), ...newSignals]
        const nextRoundIndex = loop.current_round_index + 1
        const allComplete = nextRoundIndex >= loop.round_order.length

        // Mark this round as completed
        if (roundId) {
          await adminClient
            .from('loop_rounds' as string)
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              round_score: (debriefForDistill as { overallScore?: number }).overallScore ?? null,
              round_debrief_json: debriefForDistill,
            })
            .eq('id', roundId)
        }

        // Update loop
        await adminClient
          .from('interview_loops' as string)
          .update({
            cross_round_memory: updatedMemory,
            current_round_index: nextRoundIndex,
            status: allComplete ? 'completed' : 'paused',
            completed_at: allComplete ? new Date().toISOString() : null,
          })
          .eq('id', sessionLoopId)

        // If all rounds done, trigger loop debrief
        if (allComplete) {
          const allRoundsResult = await adminClient
            .from('loop_rounds' as string)
            .select('*')
            .eq('loop_id', sessionLoopId)
            .order('round_index', { ascending: true })

          const loopDebrief = await generateLoopDebrief({
            rounds: (allRoundsResult.data ?? []) as import('@/lib/interview-loops/types').LoopRound[],
            crossRoundMemory: updatedMemory as import('@/lib/interview-loops/types').CrossRoundMemoryItem[],
            targetCompany: loop.target_company,
            targetRole: loop.target_role,
            calibrationSnapshot: {},
            budget: { ...budget, route: 'interview_loop_debrief' },
          })

          await adminClient
            .from('interview_loops' as string)
            .update({ loop_debrief_json: loopDebrief })
            .eq('id', sessionLoopId)
        }
      }
    } catch (loopErr) {
      // Don't fail the end route if loop post-processing errors
      console.error('Loop post-processing error:', loopErr)
    }
  }

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

  return Response.json({ debriefJson: debriefWithArtifact, sessionId: id })
}
