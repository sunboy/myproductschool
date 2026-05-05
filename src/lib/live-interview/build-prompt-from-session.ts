// src/lib/live-interview/build-prompt-from-session.ts
//
// Shared prompt-build path used by both the live-interview start route AND the
// resume route. Keeps prompt assembly logic in one place so a paused-then-resumed
// session always rebuilds with the latest move levels, competencies, and
// failure patterns.

import type { SupabaseClient } from '@supabase/supabase-js'
import { getHatchContext, buildHatchContextString } from '@/lib/hatch-context'
import { buildLiveInterviewSystemPrompt } from '@/lib/live-interview/system-prompt'
import type { ScenarioParams, RoleLensParams } from '@/lib/live-interview/system-prompt'
import { challengeTypeToDiscipline, normalizeDiscipline } from '@/lib/live-interview/disciplines'
import type { LiveInterviewDiscipline } from '@/lib/live-interview/disciplines'

export interface BuildPromptInput {
  adminClient: SupabaseClient
  userId: string
  companyId?: string | null
  roleId?: string | null
  challengeId?: string | null
  /** Optional discipline hint from the caller (URL param). Will be normalized. */
  discipline?: string | null
}

export interface BuildPromptOutput {
  systemPrompt: string
  scenarioRubric: Record<string, unknown> | null
  calibrationSnapshot: {
    archetype: string
    moveLevels: { frame: number; list: number; optimize: number; win: number }
    failurePatterns: Array<{ pattern_name: string }>
  }
  effectiveDiscipline: LiveInterviewDiscipline | null
  companyName: string | null
  scenarioTitle: string | null
}

export async function buildPromptFromSession(input: BuildPromptInput): Promise<BuildPromptOutput> {
  const { adminClient, userId, companyId, roleId, challengeId, discipline } = input

  // Fetch user data in parallel
  const [profileResult, moveLevelsResult, competenciesResult, failurePatternsResult] = await Promise.all([
    adminClient
      .from('profiles')
      .select('archetype, archetype_description, active_role, display_name')
      .eq('id', userId)
      .single(),
    adminClient.from('move_levels').select('*').eq('user_id', userId),
    adminClient.from('learner_competencies').select('*').eq('user_id', userId),
    adminClient
      .from('user_failure_patterns')
      .select('*')
      .eq('user_id', userId)
      .order('detected_at', { ascending: false })
      .limit(5),
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

  const [challengeResult, flowStepsResult, roleLensResult] = await Promise.all([
    challengeId
      ? adminClient.from('challenges').select('*').eq('id', challengeId).single()
      : Promise.resolve({ data: null }),
    challengeId
      ? adminClient.from('flow_steps').select('step, step_nudge, grading_weight').eq('challenge_id', challengeId)
      : Promise.resolve({ data: null }),
    adminClient
      .from('role_lenses')
      .select('*')
      .eq('role_id', (roleId ?? 'pm').toLowerCase().replace(/\s+/g, '_'))
      .maybeSingle(),
  ])

  const profile = profileResult.data
  const moveLevels = moveLevelsResult.data ?? []
  const competencies = competenciesResult.data ?? []
  const failurePatterns = failurePatternsResult.data ?? []

  const hatchCtx = await getHatchContext(userId)
  const hatchContextStr = buildHatchContextString(hatchCtx, 'coaching')

  const moveLevelsObj = {
    frame: moveLevels.find((m) => m.move === 'frame')?.level ?? 1,
    list: moveLevels.find((m) => m.move === 'list')?.level ?? 1,
    optimize: moveLevels.find((m) => m.move === 'optimize')?.level ?? 1,
    win: moveLevels.find((m) => m.move === 'win')?.level ?? 1,
  }

  let relevantNotes = ''
  try {
    const { searchSimilarNotes } = await import('@/lib/notes/embeddings')
    const notesQuery = companyRow
      ? `${companyRow.name} ${roleId ?? 'PM'} product interview`
      : 'product interview preparation'
    const notes = await searchSimilarNotes(userId, notesQuery, 3)
    if (notes && notes.length > 0) {
      relevantNotes = notes.map((n: { content: string }) => `- ${n.content}`).join('\n')
    }
  } catch {
    // Notes system unavailable — continue without notes
  }

  let scenario: ScenarioParams | undefined
  let scenarioRubric: Record<string, unknown> | null = null

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

  // Normalize to one of the canonical 5 live-interview disciplines.
  const effectiveDiscipline =
    challengeTypeToDiscipline(challenge?.challenge_type)
    ?? normalizeDiscipline(discipline ?? null)
    ?? null

  const systemPrompt = buildLiveInterviewSystemPrompt({
    archetype: profile?.archetype ?? 'Analyst',
    archetypeDescription: profile?.archetype_description ?? '',
    moveLevels: moveLevelsObj,
    failurePatterns: failurePatterns.map((fp) => ({ pattern_name: fp.pattern_name })),
    competencies: competencies.map((c) => ({ competency: c.competency, score: c.score })),
    hatchContext: hatchContextStr,
    companyName: companyRow?.name,
    roleId: roleId ?? 'PM',
    personaPrompt: companyRow?.interview_persona_prompt ?? undefined,
    relevantNotes: relevantNotes || undefined,
    learnerName: profile?.display_name ?? undefined,
    scenario,
    roleLens,
    discipline: effectiveDiscipline ?? undefined,
  }, false)

  return {
    systemPrompt,
    scenarioRubric,
    calibrationSnapshot: {
      archetype: profile?.archetype ?? 'Analyst',
      moveLevels: moveLevelsObj,
      failurePatterns: failurePatterns.map((fp) => ({ pattern_name: fp.pattern_name })),
    },
    effectiveDiscipline,
    companyName: companyRow?.name ?? null,
    scenarioTitle: challenge?.title ?? null,
  }
}
