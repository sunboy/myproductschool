// src/lib/content/publisher.ts
import { createAdminClient } from '@/lib/supabase/admin'
import type { ChallengeJson, FlowStep } from '@/lib/types'

const VALID_PARADIGMS = ['traditional', 'ai_assisted', 'agentic', 'ai_native'] as const

// Normalize paradigm from LLM output to DB-valid values
function normalizeParadigm(rawParadigm: string | undefined): string {
  if (!rawParadigm) return 'traditional'
  const lower = rawParadigm.toLowerCase().replace(/[-\s]/g, '_')
  for (const valid of VALID_PARADIGMS) {
    if (lower === valid || lower.includes(valid.replace('_', ''))) return valid
  }
  // If LLM returned something like "B2B", "SaaS", etc. — default to traditional
  return 'traditional'
}

function generateChallengeId(metadata: ChallengeJson['metadata']): string {
  const paradigm = (metadata.paradigm || 'GN').slice(0, 2).toUpperCase()
  const industry = (metadata.industry || 'GN').slice(0, 3).toUpperCase()
  const framework = metadata.frameworks?.[0]?.slice(0, 2).toUpperCase() || 'GM'
  const num = String(Math.floor(Math.random() * 900) + 100)
  return `HP-${paradigm}-${industry}-${framework}-${num}`
}

export async function publishDraft(draftId: string): Promise<string> {
  const supabase = createAdminClient()

  // Fetch draft
  const { data: draft, error: draftErr } = await supabase
    .from('draft_challenges')
    .select('*')
    .eq('id', draftId)
    .single()
  if (draftErr || !draft) throw new Error(`Draft not found: ${draftId}`)

  const json = draft.challenge_json as ChallengeJson
  const challengeId = generateChallengeId(json.metadata)

  // Insert challenge
  // slug is NOT NULL (added in migration 031); for HP-* ids there is no c{N}- prefix to strip,
  // so slug === challengeId
  const { error: cErr } = await supabase.from('challenges').insert({
    id: challengeId,
    slug: challengeId,
    title: `${json.scenario.role}: ${json.scenario.trigger.slice(0, 60)}`,
    scenario_role: json.scenario.role,
    scenario_context: json.scenario.context,
    scenario_trigger: json.scenario.trigger,
    scenario_question: json.scenario.question,
    engineer_standout: json.scenario.engineer_standout,
    paradigm: normalizeParadigm(json.metadata.paradigm),
    industry: json.metadata.industry,
    sub_vertical: json.metadata.sub_vertical,
    difficulty: json.metadata.difficulty,
    estimated_minutes: json.metadata.estimated_minutes,
    primary_competencies: json.metadata.primary_competencies,
    secondary_competencies: json.metadata.secondary_competencies,
    frameworks: json.metadata.frameworks,
    relevant_roles: json.metadata.relevant_roles,
    company_tags: json.metadata.company_tags,
    tags: json.metadata.tags,
    is_published: true,
    is_calibration: false,
    is_premium: false,
  })
  if (cErr) throw new Error(`Challenge insert failed: ${cErr.message}`)

  // Insert flow_steps + questions + options
  const STEP_ORDER: Record<FlowStep, number> = { frame: 1, list: 2, optimize: 3, win: 4 }

  for (const draftStep of json.flow_steps) {
    const { data: flowStep, error: fsErr } = await supabase
      .from('flow_steps')
      .insert({
        challenge_id: challengeId,
        step: draftStep.step,
        step_nudge: draftStep.step_nudge,
        grading_weight: draftStep.grading_weight,
        step_order: STEP_ORDER[draftStep.step as FlowStep],
      })
      .select('id')
      .single()
    if (fsErr || !flowStep) throw new Error(`flow_step insert failed: ${fsErr?.message}`)

    for (const draftQ of draftStep.questions) {
      const { data: stepQ, error: sqErr } = await supabase
        .from('step_questions')
        .insert({
          flow_step_id: flowStep.id,
          question_text: draftQ.question_text,
          question_nudge: draftQ.question_nudge,
          sequence: draftQ.sequence,
          grading_weight_within_step: draftQ.grading_weight_within_step,
          target_competencies: draftQ.target_competencies,
        })
        .select('id')
        .single()
      if (sqErr || !stepQ) throw new Error(`step_question insert failed: ${sqErr?.message}`)

      const optionRows = draftQ.options.map(opt => ({
        id: `${challengeId}-${draftStep.step}-Q${draftQ.sequence}-${opt.label}`,
        question_id: stepQ.id,
        option_label: opt.label,
        option_text: opt.text,
        quality: opt.quality,
        points: { best: 3, good_but_incomplete: 2, surface: 1, plausible_wrong: 0 }[opt.quality],
        competencies: opt.competencies,
        explanation: opt.explanation,
      }))

      const { error: optErr } = await supabase.from('flow_options').insert(optionRows)
      if (optErr) throw new Error(`flow_options insert failed: ${optErr.message}`)
    }
  }

  // Update draft + job
  await supabase.from('draft_challenges').update({ review_status: 'approved' }).eq('id', draftId)
  await supabase.from('generation_jobs')
    .update({ status: 'published', result_challenge_id: challengeId })
    .eq('id', draft.job_id)

  return challengeId
}
