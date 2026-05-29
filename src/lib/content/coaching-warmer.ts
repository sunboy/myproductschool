import pLimit from 'p-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'

function globalCacheKey(
  challengeId: string,
  step: string,
  questionId: string,
  optionId: string,
  roleId: string
): string {
  return `global:${challengeId}:${step}:${questionId}:${optionId}:${roleId}`
}

export async function preGenerateCoaching(challengeId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: challenge } = await admin
    .from('challenges')
    .select('scenario_context, scenario_trigger')
    .eq('id', challengeId)
    .single()

  if (!challenge) {
    console.error('[coaching-warmer] challenge not found', challengeId)
    return
  }

  const { data: steps } = await admin
    .from('flow_steps')
    .select(`
      step,
      step_questions (
        id,
        question_text,
        flow_options (
          id,
          option_text,
          quality,
          explanation
        )
      )
    `)
    .eq('challenge_id', challengeId)

  if (!steps?.length) {
    console.error('[coaching-warmer] no steps found', challengeId)
    return
  }

  const { data: roles } = await admin
    .from('role_lenses')
    .select('role_id, label')

  if (!roles?.length) {
    console.error('[coaching-warmer] no role_lenses found')
    return
  }

  const QUALITY_LABELS: Record<string, string> = {
    best: 'Best answer',
    good_but_incomplete: 'Good but incomplete',
    surface: 'Surface-level',
    plausible_wrong: 'Plausible but wrong',
  }

  const limit = pLimit(5)
  const tasks: Array<Promise<void>> = []

  for (const flowStep of steps) {
    const questions = (flowStep.step_questions as Array<{
      id: string
      question_text: string
      flow_options: Array<{ id: string; option_text: string; quality: string; explanation: string | null }>
    }>) ?? []

    for (const question of questions) {
      const options = question.flow_options ?? []
      const bestOption = options.find(o => o.quality === 'best')

      for (const option of options) {
        for (const role of roles) {
          const cacheKey = globalCacheKey(
            challengeId,
            flowStep.step,
            question.id,
            option.id,
            role.role_id
          )

          tasks.push(
            limit(async () => {
              const { data: existing } = await admin
                .from('coaching_cache')
                .select('id')
                .eq('cache_key', cacheKey)
                .maybeSingle()

              if (existing) return

              const qualityLabel = QUALITY_LABELS[option.quality] ?? option.quality

              const systemPrompt = `You are Hatch, an AI coach at HackProduct. You give personalized, career-relevant coaching to engineers practicing product thinking.`

              const userPrompt = `The learner is a ${role.label} who just answered the ${flowStep.step} step.
Challenge: ${challenge.scenario_context} ${challenge.scenario_trigger}
Question: ${question.question_text}
They selected: "${option.option_text}" (${qualityLabel})
Best answer: "${bestOption?.option_text ?? ''}"
Static explanation: ${option.explanation ?? ''}

Generate two short paragraphs:
1. "role_context" (2-3 sentences): How this answer looks specifically from a ${role.label} perspective. Reference real job context for this role.
2. "career_signal" (1 sentence): What this answer signals about the learner's product thinking maturity for a ${role.label}.

Tone: Direct, warm. Senior ${role.label} mentoring a junior. No filler.
Return ONLY JSON: {"role_context":"...","career_signal":"..."}`

              try {
                const message = await guardedCachedMessage(systemPrompt, userPrompt, {
                  model: 'claude-sonnet-4-6',
                  max_tokens: 800,
                })

                let rawText = ''
                for (const block of message.content) {
                  if (block.type === 'text') { rawText = block.text; break }
                }

                let role_context = ''
                let career_signal = ''
                try {
                  const parsed = JSON.parse(rawText)
                  role_context = parsed.role_context ?? ''
                  career_signal = parsed.career_signal ?? ''
                } catch {
                  const rcMatch = rawText.match(/"role_context"\s*:\s*"([^"]+)"/)
                  const csMatch = rawText.match(/"career_signal"\s*:\s*"([^"]+)"/)
                  role_context = rcMatch?.[1] ?? ''
                  career_signal = csMatch?.[1] ?? ''
                }

                if (!role_context && !career_signal) {
                  console.error('[coaching-warmer] no parseable content for key', cacheKey)
                  return
                }

                await admin.from('coaching_cache').upsert({
                  cache_key: cacheKey,
                  role_context,
                  career_signal,
                  hit_count: 0,
                  last_hit_at: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                })

                console.log('[coaching-warmer] cached', cacheKey)
              } catch (err) {
                console.error('[coaching-warmer] failed for key', cacheKey, err)
              }
            })
          )
        }
      }
    }
  }

  await Promise.all(tasks)
  console.log('[coaching-warmer] pre-generation complete for', challengeId)
}
