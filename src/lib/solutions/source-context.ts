import type { SupabaseClient } from '@supabase/supabase-js'
import type { SolutionChallengeType } from './schema'

/**
 * Builds the user-content block for solution generation: everything the model
 * needs to write a grounded solution for one challenge. Shared by the lazy
 * generation route and the backfill export script, so backfilled and lazily
 * generated solutions see identical source material.
 */

interface ChallengeSourceRow {
  id: string
  title: string | null
  challenge_type: string | null
  difficulty: string | null
  prompt_text: string | null
  scenario_role: string | null
  scenario_context: string | null
  scenario_trigger: string | null
  scenario_question: string | null
  engineer_standout: string | null
  company_tags: string[] | null
  topic_tags: string[] | null
  technique_tags: string[] | null
  metadata: Record<string, unknown> | null
}

interface CodingTestCase {
  id?: string
  label?: string
  hidden?: boolean
  is_hidden?: boolean
  input?: unknown
  expected?: unknown
}

const FLOW_TYPES = new Set(['flow', 'freeform', 'quick_take'])
const CODING_TYPES = new Set(['algorithm', 'sql'])

function section(title: string, body: string | null | undefined): string {
  const trimmed = body?.trim()
  if (!trimmed) return ''
  return `# ${title}\n${trimmed}\n`
}

function formatCode(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, string>)
      .map(([lang, src]) => `--- ${lang} ---\n${src}`)
      .join('\n\n')
  }
  return ''
}

export interface SolutionSourceContext {
  challengeType: SolutionChallengeType
  userContent: string
}

export async function buildSolutionSourceContext(
  admin: SupabaseClient,
  challengeId: string
): Promise<SolutionSourceContext | null> {
  const { data: challenge, error } = await admin
    .from('challenges')
    .select('id, title, challenge_type, difficulty, prompt_text, scenario_role, scenario_context, scenario_trigger, scenario_question, engineer_standout, company_tags, topic_tags, technique_tags, metadata')
    .eq('id', challengeId)
    .maybeSingle()

  if (error || !challenge) return null
  const row = challenge as ChallengeSourceRow
  const type = row.challenge_type as SolutionChallengeType | null
  if (!type) return null

  const parts: string[] = []
  parts.push(section('Challenge', [
    `Title: ${row.title ?? challengeId}`,
    `Type: ${type}`,
    `Difficulty: ${row.difficulty ?? 'unknown'}`,
    row.company_tags?.length ? `Companies: ${row.company_tags.join(', ')}` : '',
    row.topic_tags?.length ? `Topics: ${row.topic_tags.join(', ')}` : '',
    row.technique_tags?.length ? `Techniques: ${row.technique_tags.join(', ')}` : '',
  ].filter(Boolean).join('\n')))

  parts.push(section('Problem statement', row.prompt_text))
  parts.push(section('Scenario context', row.scenario_context))
  parts.push(section('Trigger', row.scenario_trigger))
  parts.push(section('Question', row.scenario_question))
  parts.push(section('What makes an answer stand out', row.engineer_standout))

  if (CODING_TYPES.has(type)) {
    const meta = (row.metadata ?? {}) as Record<string, unknown>
    parts.push(section('Starter code', formatCode(meta.starter_code)))
    parts.push(section('Reference solution (the known-correct answer; your approaches must be consistent with it and the optimal approach should match or improve on it)', formatCode(meta.reference_solution)))
    if (typeof meta.schema_sql === 'string') parts.push(section('SQL schema', meta.schema_sql))
    if (typeof meta.setup_sql === 'string') parts.push(section('SQL setup', meta.setup_sql))

    const testCases = Array.isArray(meta.test_cases) ? (meta.test_cases as CodingTestCase[]) : []
    const visible = testCases.filter((tc) => !tc.hidden && !tc.is_hidden).slice(0, 6)
    if (visible.length > 0) {
      parts.push(section('Visible test cases', visible
        .map((tc) => `- ${tc.label ?? tc.id ?? 'case'}: input=${JSON.stringify(tc.input)} expected=${JSON.stringify(tc.expected)}`)
        .join('\n')))
    }

    // Multi-part coding challenges: include part prompts so the solution covers them.
    const { data: codingStep } = await admin
      .from('flow_steps')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('step', 'coding')
      .maybeSingle()
    if (codingStep) {
      const { data: questions } = await admin
        .from('step_questions')
        .select('sequence, question_text, response_type, coding_subtask_prompt')
        .eq('flow_step_id', codingStep.id)
        .order('sequence', { ascending: true })
      if (questions && questions.length > 0) {
        parts.push(section('Parts', questions
          .map((q) => `## Part ${q.sequence}: ${q.question_text}\n${(q.coding_subtask_prompt as string | null) ?? ''}`)
          .join('\n\n')))
      }
    }
  }

  if (FLOW_TYPES.has(type)) {
    // The step/question/option corpus with quality labels and explanations is
    // the gold source for the reasoning walkthrough: it encodes what the
    // challenge author considered best/partial/wrong and why.
    const { data: steps } = await admin
      .from('flow_steps')
      .select('id, step, step_order')
      .eq('challenge_id', challengeId)
      .order('step_order', { ascending: true })

    if (steps && steps.length > 0) {
      const stepIds = steps.map((s) => s.id as string)
      const { data: questions } = await admin
        .from('step_questions')
        .select('id, flow_step_id, sequence, question_text')
        .in('flow_step_id', stepIds)
        .order('sequence', { ascending: true })
      const questionIds = (questions ?? []).map((q) => q.id as string)
      const { data: options } = questionIds.length > 0
        ? await admin
            .from('flow_options')
            .select('question_id, option_label, option_text, quality, explanation')
            .in('question_id', questionIds)
            .order('option_label', { ascending: true })
        : { data: [] }

      const lines: string[] = []
      for (const step of steps) {
        lines.push(`## Step: ${(step.step as string).toUpperCase()}`)
        for (const q of (questions ?? []).filter((q) => q.flow_step_id === step.id)) {
          lines.push(`### Q${q.sequence}: ${q.question_text}`)
          for (const opt of (options ?? []).filter((o) => o.question_id === q.id)) {
            lines.push(`- [${opt.option_label}] (${opt.quality}) ${opt.option_text}\n  Why: ${opt.explanation}`)
          }
        }
      }
      parts.push(section('FLOW steps, questions, and graded options (best/good_but_incomplete/surface/plausible_wrong)', lines.join('\n')))
    }
  }

  const userContent = parts.filter(Boolean).join('\n')
  return { challengeType: type, userContent }
}
