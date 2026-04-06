import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLumaContext, buildLumaContextString } from '@/lib/luma-context'
import { buildLiveInterviewSystemPrompt } from '@/lib/live-interview/system-prompt'
import type { ScenarioParams, RoleLensParams } from '@/lib/live-interview/system-prompt'

export async function POST(request: Request) {
  if (process.env.USE_MOCK_DATA === 'true') {
    return Response.json({ sessionId: 'mock-session-id', companyName: 'Uber', role: 'PM' })
  }

  const { companyId, roleId, challengeId } = await request.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const adminClient = createAdminClient()

  // Fetch user data in parallel
  const [profileResult, moveLevelsResult, competenciesResult, failurePatternsResult] = await Promise.all([
    adminClient.from('profiles').select('archetype, archetype_description, active_role, display_name').eq('id', user.id).single(),
    adminClient.from('move_levels').select('*').eq('user_id', user.id),
    adminClient.from('learner_competencies').select('*').eq('user_id', user.id),
    adminClient.from('user_failure_patterns').select('*').eq('user_id', user.id).order('detected_at', { ascending: false }).limit(5),
  ])

  let companyRow: { name: string; interview_persona_prompt: string | null; roles: string[] | null } | null = null
  if (companyId) {
    const { data } = await adminClient
      .from('company_profiles')
      .select('name, interview_persona_prompt, roles')
      .eq('slug', companyId)
      .single()
    companyRow = data
  }

  // Fetch challenge + flow steps + role lens in parallel (if challengeId provided)
  const [challengeResult, flowStepsResult, roleLensResult] = await Promise.all([
    challengeId
      ? adminClient.from('challenges').select('*').eq('id', challengeId).single()
      : Promise.resolve({ data: null }),
    challengeId
      ? adminClient.from('flow_steps').select('step, step_nudge, grading_weight').eq('challenge_id', challengeId)
      : Promise.resolve({ data: null }),
    adminClient.from('role_lenses').select('*')
      .eq('role_id', (roleId ?? 'pm').toLowerCase().replace(/\s+/g, '_')).maybeSingle(),
  ])

  const profile = profileResult.data
  const moveLevels = moveLevelsResult.data ?? []
  const competencies = competenciesResult.data ?? []
  const failurePatterns = failurePatternsResult.data ?? []

  // Build Luma context string
  const lumaCtx = await getLumaContext(user.id)
  const lumaContextStr = buildLumaContextString(lumaCtx, 'coaching')

  // Build move levels object for system prompt
  const moveLevelsObj = {
    frame: moveLevels.find((m) => m.move === 'frame')?.level ?? 1,
    list: moveLevels.find((m) => m.move === 'list')?.level ?? 1,
    optimize: moveLevels.find((m) => m.move === 'optimize')?.level ?? 1,
    win: moveLevels.find((m) => m.move === 'win')?.level ?? 1,
  }

  // Search for relevant notes (graceful fallback if notes system unavailable)
  let relevantNotes = ''
  try {
    const { searchSimilarNotes } = await import('@/lib/notes/embeddings')
    const notesQuery = companyRow
      ? `${companyRow.name} ${roleId ?? 'PM'} product interview`
      : 'product interview preparation'
    const notes = await searchSimilarNotes(user.id, notesQuery, 3)
    if (notes && notes.length > 0) {
      relevantNotes = notes.map((n: { content: string }) => `- ${n.content}`).join('\n')
    }
  } catch {
    // Notes system unavailable — continue without notes
  }

  // Build scenario params from challenge data (if present)
  let scenario: ScenarioParams | undefined
  let scenarioRubric: Record<string, unknown> | undefined

  const challenge = challengeResult.data
  if (challenge) {
    const flowSteps = flowStepsResult.data ?? []
    const flowNudges: ScenarioParams['flowNudges'] = {}
    for (const step of flowSteps) {
      if (step.step_nudge) {
        flowNudges[step.step as keyof typeof flowNudges] = step.step_nudge
      }
    }

    scenario = {
      question: challenge.scenario_question ?? '',
      context: challenge.scenario_context ?? '',
      trigger: challenge.scenario_trigger ?? '',
      engineerStandout: challenge.engineer_standout ?? '',
      role: challenge.scenario_role,
      difficulty: challenge.difficulty ?? 'standard',
      primaryCompetencies: challenge.primary_competencies ?? [],
      estimatedMinutes: challenge.estimated_minutes ?? 20,
      flowNudges,
    }

    // Build compact rubric snapshot for grading
    const rubricSteps: Record<string, { weight: number; nudge: string | null }> = {}
    for (const step of flowSteps) {
      rubricSteps[step.step] = {
        weight: parseFloat(step.grading_weight) || 0.25,
        nudge: step.step_nudge,
      }
    }

    scenarioRubric = {
      scenarioQuestion: challenge.scenario_question,
      engineerStandout: challenge.engineer_standout,
      primaryCompetencies: challenge.primary_competencies,
      secondaryCompetencies: challenge.secondary_competencies,
      difficulty: challenge.difficulty,
      steps: rubricSteps,
    }
  }

  // Build role lens params (if role has lens data)
  let roleLens: RoleLensParams | undefined
  const lens = roleLensResult.data
  if (lens) {
    roleLens = {
      frameWeight: parseFloat(lens.frame_weight) || 0.25,
      listWeight: parseFloat(lens.list_weight) || 0.25,
      optimizeWeight: parseFloat(lens.optimize_weight) || 0.25,
      winWeight: parseFloat(lens.win_weight) || 0.25,
      frameNudge: lens.frame_nudge ?? undefined,
      listNudge: lens.list_nudge ?? undefined,
      optimizeNudge: lens.optimize_nudge ?? undefined,
      winNudge: lens.win_nudge ?? undefined,
      competencyMultipliers: lens.competency_multipliers ?? {},
    }
  }

  // Voice mode: exclude grading signals from prompt — Deepgram TTS would speak the JSON aloud
  const systemPrompt = buildLiveInterviewSystemPrompt({
    archetype: profile?.archetype ?? 'Analyst',
    archetypeDescription: profile?.archetype_description ?? '',
    moveLevels: moveLevelsObj,
    failurePatterns: failurePatterns.map((fp) => ({ pattern_name: fp.pattern_name })),
    competencies: competencies.map((c) => ({ competency: c.competency, score: c.score })),
    lumaContext: lumaContextStr,
    companyName: companyRow?.name,
    roleId: roleId ?? 'PM',
    personaPrompt: companyRow?.interview_persona_prompt ?? undefined,
    relevantNotes: relevantNotes || undefined,
    learnerName: profile?.display_name ?? undefined,
    scenario,
    roleLens,
  }, false)

  const { data: session } = await adminClient
    .from('live_interview_sessions')
    .insert({
      user_id: user.id,
      company_id: companyId ?? null,
      role_id: roleId ?? 'PM',
      challenge_id: challengeId ?? null,
      status: 'active',
      started_at: new Date().toISOString(),
      system_prompt: systemPrompt,
      scenario_rubric: scenarioRubric ?? null,
      calibration_snapshot: {
        archetype: profile?.archetype ?? 'Analyst',
        moveLevels: moveLevelsObj,
        failurePatterns: failurePatterns.map((fp) => ({ pattern_name: fp.pattern_name })),
      },
    })
    .select('id')
    .single()

  return Response.json({
    sessionId: session?.id,
    systemPrompt,
    companyName: companyRow?.name,
    role: roleId ?? 'PM',
    scenarioTitle: challenge?.title ?? null,
    challengeId: challengeId ?? null,
  })
}
