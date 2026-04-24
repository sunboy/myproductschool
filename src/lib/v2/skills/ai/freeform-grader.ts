import { z } from 'zod'
import type { FlowOption, FlowStep } from '@/lib/types'
import { getHatchContext } from '@/lib/v2/hatch-context'
import { loadRubric, getReasoningMove } from '@/lib/v2/skills/rubric-loader'
import { MENTAL_MODELS_CONTEXT, STEP_PRIMARY_COMPETENCIES } from '@/lib/hatch/system-prompt'
import { createCachedMessage } from '@/lib/anthropic/cached-client'

// ── Zod schemas ──────────────────────────────────────────────

const GradingResponseSchema = z.object({
  score: z.number().min(0).max(3),
  quality_label: z.enum(['best', 'good_but_incomplete', 'surface', 'plausible_wrong', 'between_levels']),
  competencies_demonstrated: z.array(z.string()),
  grading_explanation: z.string().max(500),
  confidence: z.number().min(0).max(1),
  criteria_scores: z.record(z.string(), z.enum(['strong', 'partial', 'needs_work'])).optional(),
  competency_signal: z.object({
    primary: z.string(),
    signal: z.string(),
    framework_hint: z.string(),
  }).optional(),
})

const ElaborationSchema = z.object({
  adjustment: z.number().min(-0.5).max(0.5),
  adjustment_reason: z.string().max(300),
  additional_competencies: z.array(z.string()),
})

type GradingResponse = z.infer<typeof GradingResponseSchema>
type ElaborationResponse = z.infer<typeof ElaborationSchema>

// ── Tier caps ────────────────────────────────────────────────

const TIER_CAPS: Record<number, number> = { 0: 0.5, 1: 1.75, 2: 2.75, 3: 3.0 }

export function capElaborationScore(basePoints: number, adjustment: number): number {
  return Math.max(0, Math.min(basePoints + adjustment, TIER_CAPS[basePoints] ?? basePoints))
}

// ── Step purpose ─────────────────────────────────────────────

const STEP_PURPOSE: Record<FlowStep, string> = {
  frame: 'Identify the real problem, audience, and stakes',
  list: 'Generate comprehensive, relevant options or metrics',
  optimize: 'Evaluate tradeoffs and identify the best path',
  win: 'Deliver a crisp, actionable recommendation',
}

// ── Confidence gate ──────────────────────────────────────────

function applyConfidenceGate(result: GradingResponse): GradingResponse {
  if (result.confidence >= 0.8) return result
  if (result.confidence >= 0.5) {
    const nearest = Math.round(result.score)
    const blended = result.score * result.confidence + nearest * (1 - result.confidence)
    return { ...result, score: Math.round(blended * 100) / 100 }
  }
  return { ...result, score: Math.round(result.score) }
}

// ── Freeform grader ──────────────────────────────────────────

interface ScenarioContext {
  scenario_context: string
  scenario_trigger: string
}

export interface GradingResult {
  score: number
  quality_label: string
  explanation: string
  competencies_demonstrated: string[]
  confidence: number
  criteria_scores?: Record<string, 'strong' | 'partial' | 'needs_work'>
  competency_signal?: { primary: string; signal: string; framework_hint: string }
}

export async function gradeFreeform(
  userText: string,
  options: FlowOption[],
  scenario: ScenarioContext,
  step: FlowStep,
  targetCompetencies: string[],
  userId?: string
): Promise<GradingResult> {
  const best = options.find(o => o.quality === 'best')
  const good = options.find(o => o.quality === 'good_but_incomplete')
  const surface = options.find(o => o.quality === 'surface')
  const wrong = options.find(o => o.quality === 'plausible_wrong')

  // Inject Hatch context for personalization (fail open)
  const hatchContext = userId ? await getHatchContext(userId, '', step) : ''

  // Load rubric criteria for this step
  let rubricSection = ''
  let criterionIds: string[] = []
  try {
    const rubric = loadRubric(step)
    criterionIds = rubric.criteria.map(c => c.id)
    rubricSection = `\n\nRUBRIC CRITERIA (score each as strong/partial/needs_work):
${rubric.criteria.map(c => `${c.id} — ${c.name}: ${c.description}
  Strong signals: ${c.strong_signals.join('; ')}
  Partial signals: ${c.partial_signals.join('; ')}
  Failure signals: ${c.failure_signals.join('; ')}`).join('\n\n')}

REASONING MOVE for this step: ${rubric.reasoning_move}`
  } catch {
    // Rubric load failed — proceed without criteria
  }

  // Static system prompt (cacheable)
  const systemPrompt = `You are a product sense grading agent. Grade responses against rubric exemplars and criteria.
${MENTAL_MODELS_CONTEXT}`

  const prompt = `${hatchContext ? `LEARNER CONTEXT:\n${hatchContext}\n\n` : ''}SCENARIO: ${scenario.scenario_context} ${scenario.scenario_trigger}
FLOW STEP: ${step} — ${STEP_PURPOSE[step]}
TARGET COMPETENCIES: ${targetCompetencies.join(', ')}

EXEMPLAR RUBRIC:

SCORE 3 — BEST:
"${best?.option_text ?? ''}"
Competencies: ${(best?.competencies ?? []).join(', ')}
Why best: ${best?.explanation ?? ''}

SCORE 2 — GOOD BUT INCOMPLETE:
"${good?.option_text ?? ''}"
Competencies: ${(good?.competencies ?? []).join(', ')}
Why good-but-incomplete: ${good?.explanation ?? ''}

SCORE 1 — SURFACE:
"${surface?.option_text ?? ''}"
Why surface: ${surface?.explanation ?? ''}

SCORE 0 — PLAUSIBLE WRONG:
"${wrong?.option_text ?? ''}"
Why wrong: ${wrong?.explanation ?? ''}
${rubricSection}

LEARNER'S RESPONSE:
"${userText}"

GRADING INSTRUCTIONS:
1. Compare by SUBSTANCE (ideas), not wording. "Instrument the funnel" = "add step-level tracking".
2. Score 0.0–3.0 continuously:
   2.5–3.0: Core insight of BEST exemplar
   2.0–2.4: Good but missing a key dimension
   1.0–1.9: Directionally correct but shallow
   0.0–0.9: Fundamentally misreads the situation
3. Identify competencies demonstrated from: ${targetCompetencies.join(', ')}
4. Rate confidence 0.0–1.0
5. Can exceed 2.8 if response covers BEST AND adds genuine insight. Rare.
6. Score each rubric criterion (${criterionIds.join(', ') || 'if available'}) as "strong", "partial", or "needs_work".
7. Generate a competency_signal: identify the primary competency being tested (from: ${(STEP_PRIMARY_COMPETENCIES[step] ?? []).join(', ')}), write a 1-sentence coaching signal, and a framework_hint connecting to the reasoning move.

Return ONLY valid JSON:
{"score":<float>,"quality_label":"<best|good_but_incomplete|surface|plausible_wrong|between_levels>","competencies_demonstrated":[<strings>],"grading_explanation":"<2 sentences>","confidence":<float>,"criteria_scores":{${criterionIds.map(id => `"${id}":"<strong|partial|needs_work>"`).join(',')}},"competency_signal":{"primary":"<competency_key>","signal":"<1 sentence coaching>","framework_hint":"<reasoning move connection>"}}`

  // Fallback result used on error
  const fallback: GradingResult = {
    score: 1.0,
    quality_label: 'surface',
    explanation: 'Grading unavailable — scored as surface level.',
    competencies_demonstrated: [],
    confidence: 0.2,
  }

  try {
    const response = await createCachedMessage(systemPrompt, prompt, {
      model: 'claude-opus-4-6',
      max_tokens: 800,
      thinking: { type: 'adaptive' },
    })

    const textBlock = response.content.find(b => b.type === 'text')
    const rawText = textBlock?.type === 'text' ? textBlock.text : ''

    let parsed: GradingResponse | null = null

    // Attempt 1: parse directly
    try {
      const json = JSON.parse(rawText)
      const validated = GradingResponseSchema.safeParse(json)
      if (validated.success) {
        parsed = validated.data
      } else {
        // Zod failed — clamp score but use data anyway
        const clamped = { ...json, score: Math.min(3, Math.max(0, Number(json.score) || 1)) }
        const recheck = GradingResponseSchema.safeParse(clamped)
        if (recheck.success) parsed = recheck.data
      }
    } catch {
      // JSON parse failed — retry once
    }

    // Retry on parse failure
    if (!parsed) {
      try {
        const retryResponse = await createCachedMessage(
          systemPrompt,
          `${prompt}\n\nPREVIOUS ATTEMPT (invalid JSON):\n${rawText}\n\nInvalid JSON. Return ONLY the raw JSON object. No markdown backticks.`,
          { model: 'claude-opus-4-6', max_tokens: 800, thinking: { type: 'adaptive' } }
        )
        const retryText = retryResponse.content.find(b => b.type === 'text')
        const retryRaw = retryText?.type === 'text' ? retryText.text : ''
        const retryJson = JSON.parse(retryRaw)
        const retryValidated = GradingResponseSchema.safeParse(retryJson)
        if (retryValidated.success) {
          parsed = retryValidated.data
        } else {
          // Clamp and proceed
          parsed = {
            ...retryJson,
            score: Math.min(3, Math.max(0, Number(retryJson.score) || 1)),
          } as GradingResponse
        }
      } catch {
        return fallback
      }
    }

    if (!parsed) return fallback

    // Apply confidence gate
    const gated = applyConfidenceGate(parsed)

    // Apply low-confidence clamp: if confidence < 0.6, cap score at 1.75
    const finalScore = gated.confidence < 0.6
      ? Math.min(gated.score, 1.75)
      : gated.score

    return {
      score: finalScore,
      quality_label: gated.quality_label,
      explanation: gated.grading_explanation,
      competencies_demonstrated: gated.competencies_demonstrated,
      confidence: gated.confidence,
      criteria_scores: gated.criteria_scores,
      competency_signal: gated.competency_signal,
    }
  } catch {
    return fallback
  }
}

// ── Elaboration grader ───────────────────────────────────────

export interface ElaborationResult {
  finalScore: number
  adjustment: number
  adjustment_reason: string
  additional_competencies: string[]
}

export async function gradeElaboration(
  baseOption: FlowOption,
  elaborationText: string,
  allOptions: FlowOption[],
  scenario: ScenarioContext,
  step: FlowStep
): Promise<ElaborationResult> {
  const bestOption = allOptions.find(o => o.quality === 'best')

  const prompt = `A learner selected an MCQ option and added elaboration text.

SCENARIO: ${scenario.scenario_context} ${scenario.scenario_trigger}
FLOW STEP: ${step}

SELECTED OPTION: "${baseOption.option_text}"
(Rated: ${baseOption.quality}, base score: ${baseOption.points}/3)

ELABORATION: "${elaborationText}"

BEST ANSWER FOR REFERENCE: "${bestOption?.option_text ?? ''}"

Evaluate:
1. ADDS depth? +0.25 per: specific tradeoff, new competency, second-order consequence (max +0.5)
2. CONTRADICTS? -0.25 per: misunderstanding, harmful reasoning (max -0.5)
3. NEUTRAL? No adjustment → 0

Return ONLY JSON:
{"adjustment":<float -0.5 to 0.5>,"adjustment_reason":"<1-2 sentences>","additional_competencies":[<strings>]}`

  const fallback: ElaborationResult = {
    finalScore: baseOption.points,
    adjustment: 0,
    adjustment_reason: 'Elaboration grading unavailable — no adjustment applied.',
    additional_competencies: [],
  }

  try {
    const response = await createCachedMessage(
      'You are a product sense elaboration grading agent. Evaluate whether a learner\'s elaboration adds depth to their selected MCQ option.',
      prompt,
      { model: 'claude-sonnet-4-6', max_tokens: 300, thinking: { type: 'adaptive' } }
    )

    const textBlock = response.content.find(b => b.type === 'text')
    const rawText = textBlock?.type === 'text' ? textBlock.text : ''

    let parsed: ElaborationResponse | null = null

    try {
      const json = JSON.parse(rawText)
      const validated = ElaborationSchema.safeParse(json)
      if (validated.success) {
        parsed = validated.data
      }
    } catch {
      // parse failed — return fallback
    }

    if (!parsed) return fallback

    const finalScore = capElaborationScore(baseOption.points, parsed.adjustment)

    return {
      finalScore,
      adjustment: parsed.adjustment,
      adjustment_reason: parsed.adjustment_reason,
      additional_competencies: parsed.additional_competencies,
    }
  } catch {
    return fallback
  }
}
