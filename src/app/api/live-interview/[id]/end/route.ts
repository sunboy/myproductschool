import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildLowSignalDebrief,
  generateDebrief,
  type DebriefNextAction,
} from '@/lib/live-interview/debrief-generator'
import { IS_MOCK } from '@/lib/mock'
import { gradeArtifact } from '@/lib/live-interview/artifact-grader'
import type { LiveInterviewArtifactSnapshot } from '@/lib/live-interview/artifact-context'
import { normalizeDiscipline, type LiveInterviewDiscipline } from '@/lib/live-interview/disciplines'
import {
  buildLiveWorkspaceSignal,
  isSubstantiveWorkspaceSignal,
} from '@/lib/live-interview/workspace-adapters'
import { buildSkillContextPack } from '@/lib/hatch/skill-context'
import { FLOW_MAX_SCORE } from '@/lib/scoring/flow-scale'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded, assertPlanLimit } from '@/lib/usage/assert-plan-limit'
import { rateLimit } from '@/lib/security/rate-limit'
import { apiError } from '@/lib/api/error'
import { z, ZodError } from 'zod'
import { checkAndGrantAchievements } from '@/lib/achievements/check'
import { coerceDifficulty, type PracticeDifficulty } from '@/lib/practice/difficulty'

const ROUTE_KEY = 'live_interview_debrief'

// Base XP by canonical bucket. Legacy DB values are coerced before lookup so
// medium/hard rows score correctly both pre- and post-R2.
const INTERVIEW_DIFFICULTY_BASE_XP: Record<PracticeDifficulty, number> = {
  easy: 60,
  medium: 90,
  hard: 120,
}

const DEFAULT_INTERVIEW_BASE_XP = 80

const RequestSchema = z.object({
  abandoned: z.boolean().optional().default(false),
})

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

function retryAfterSeconds(resetAt: Date) {
  return Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000))
}

function aiBudgetResponse(error: unknown) {
  if (error instanceof PlanLimitExceeded) {
    return apiError(402, 'limit_reached', 'limit_reached', {
      feature: error.feature,
      used: error.used,
      limit: error.limit,
      windowDays: error.windowDays,
    })
  }

  if (!(error instanceof AiBudgetExceededError)) return null

  return apiError(402, 'limit_reached', 'limit_reached', {
    feature: 'hatch_ai_cents',
    used: error.used,
    limit: error.limit,
    windowDays: error.windowDays,
  })
}

function disciplineToChallengeType(discipline: LiveInterviewDiscipline | null) {
  if (discipline === 'system_design') return 'system_design'
  if (discipline === 'data_modeling') return 'data_modeling'
  if (discipline === 'coding') return 'algorithm'
  if (discipline === 'sql') return 'sql'
  return 'flow'
}

function substantiveUserTurns(turns: Array<{ role: 'hatch' | 'user'; content: string }>) {
  return turns.filter((turn) => {
    if (turn.role !== 'user') return false
    const words = turn.content.trim().split(/\s+/).filter(Boolean)
    return words.length >= 6 && turn.content.trim().length >= 32
  }).length
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (IS_MOCK) {
    const { MOCK_LIVE_DEBRIEF } = await import('@/lib/mock-live-interviews')
    return Response.json({ debriefJson: MOCK_LIVE_DEBRIEF, sessionId: id })
  }

  // Handle abandoned sessions (sent via sendBeacon on tab close)
  let abandoned = false
  try {
    const text = await request.text()
    const rawBody = text.trim() ? JSON.parse(text) : {}
    const body = RequestSchema.parse(rawBody)
    abandoned = body.abandoned
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, 'invalid_request', 'Invalid request body', {
        issues: validationIssues(error),
      })
    }
    return apiError(400, 'invalid_json', 'Invalid JSON body')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError(401, 'auth_required', 'Unauthorized')

  const adminClient = createAdminClient()

  if (abandoned) {
    await adminClient
      .from('live_interview_sessions')
      .update({ status: 'abandoned', ended_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
    return Response.json({ ok: true, abandoned: true })
  }

  // Load session + turns in parallel
  const [sessionResult, turnsResult] = await Promise.all([
    adminClient
      .from('live_interview_sessions')
      .select('user_id, status, debrief_json, calibration_snapshot, scenario_rubric, flow_coverage, challenge_id, started_at')
      .eq('id', id)
      .single(),
    adminClient
      .from('live_interview_turns')
      .select('role, content, turn_index')
      .eq('session_id', id)
      .order('turn_index', { ascending: true }),
  ])

  if (!sessionResult.data) {
    return apiError(404, 'session_not_found', 'Session not found')
  }

  const session = sessionResult.data
  if (session.user_id !== user.id) {
    return apiError(404, 'session_not_found', 'Session not found')
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
  // Grade artifact if one was captured during the session
  const calibrationSnap = (session.calibration_snapshot ?? {}) as Record<string, unknown>
  const artifactSnapshot = calibrationSnap._artifactSnapshot as LiveInterviewArtifactSnapshot | undefined
  const discipline = normalizeDiscipline(
    artifactSnapshot?.discipline ??
    (calibrationSnap.effectiveDiscipline as string | undefined) ??
    null
  )
  const workspaceSignal = buildLiveWorkspaceSignal(artifactSnapshot, discipline)
  let practiceLink: DebriefNextAction | null = null

  try {
    const contextPack = await buildSkillContextPack({
      userId: user.id,
      surface: 'interview_debrief',
      challengeType: disciplineToChallengeType(discipline),
      submissionText: turns.filter((turn) => turn.role === 'user').map((turn) => turn.content).join('\n'),
      includePracticeLink: true,
      includeRetrieval: false,
    })
    if (contextPack.practiceLink) {
      practiceLink = {
        title: contextPack.practiceLink.title,
        description: contextPack.practiceLink.reason,
        href: contextPack.practiceLink.href,
        type: contextPack.practiceLink.type,
      }
    }
  } catch {
    practiceLink = null
  }

  const noSubstance = substantiveUserTurns(turns) === 0 && !isSubstantiveWorkspaceSignal(workspaceSignal)

  let budget: { userId: string; userPlan: string; route: string } | undefined
  if (!noSubstance) {
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

    try {
      await assertPlanLimit(user.id, userPlan, 'ai_grading_runs')
    } catch (err) {
      const response = aiBudgetResponse(err)
      if (response) return response
      throw err
    }

    budget = { userId: user.id, userPlan, route: ROUTE_KEY }
  }

  let artifactGrading: Awaited<ReturnType<typeof gradeArtifact>> | null = null
  if (artifactSnapshot && !noSubstance) {
    try {
      artifactGrading = await gradeArtifact(artifactSnapshot, { ...budget!, route: 'live_interview_artifact_grade' })
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
  if (noSubstance) {
    debriefResult = buildLowSignalDebrief({ discipline, workspaceSignal, practiceLink })
  } else {
    if (!process.env.ANTHROPIC_API_KEY) {
      return apiError(503, 'hatch_unavailable', 'Hatch ran into a problem. Try again.')
    }

    try {
      debriefResult = await generateDebrief({
        sessionId: id,
        turns,
        calibrationSnapshot: session.calibration_snapshot ?? { archetype: 'Analyst', moveLevels: {} },
        scenarioRubric: session.scenario_rubric ?? null,
        challengeId: session.challenge_id ?? null,
        discipline,
        workspaceSignal,
        practiceLink,
        budget,
      })
    } catch (err) {
      const response = aiBudgetResponse(err)
      if (response) return response
      throw err
    }
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
    const bucket = coerceDifficulty(challengeRow?.difficulty)
    const difficultyBase = bucket ? INTERVIEW_DIFFICULTY_BASE_XP[bucket] : DEFAULT_INTERVIEW_BASE_XP
    const scoreFactor = Math.max(0, Math.min(1, debriefResult.overallScore / FLOW_MAX_SCORE))
    const baseXp = Math.round(difficultyBase * scoreFactor)
    const streakMultiplier = Math.min(1 + (profileRow.streak_days ?? 0) * 0.05, 1.5)
    const xpEarned = Math.round(baseXp * streakMultiplier)

    await adminClient
      .from('profiles')
      .update({ xp_total: (profileRow.xp_total ?? 0) + xpEarned })
      .eq('id', user.id)

    await adminClient.rpc('update_user_streak', { p_user_id: user.id })

    checkAndGrantAchievements(user.id, adminClient).catch(err =>
      console.error('[live-interview] achievements check failed:', err)
    )
  }

  // If this session is part of a loop, run post-processing
  const sessionLoopId = (session as unknown as { loop_id?: string | null }).loop_id
  const sessionRoundIndex = (session as unknown as { round_index?: number | null }).round_index

  if (sessionLoopId && sessionRoundIndex !== null && sessionRoundIndex !== undefined && !abandoned && budget) {
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

  // Upsert learner_competencies - fetch current scores first
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
