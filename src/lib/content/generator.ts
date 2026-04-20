// src/lib/content/generator.ts
import Anthropic from '@anthropic-ai/sdk'
import { scrapeUrl } from './scraper'
import {
  buildScrapePrompt, buildScenarioPrompt, buildMcqPrompt,
  buildTaxonomyPrompt, buildStepQuestionPlanPrompt,
  buildExpandOpenEndedPrompt, buildVerifierPrompt,
  isOpenEndedPrompt,
  type ScrapeResult,
} from './prompts'
import { validateChallengeJson } from './validator'
import type { ChallengeJson, DraftFlowStep, FlowStep, IntellectualTheme, ScenarioExcerpt } from '@/lib/types'

const client = new Anthropic()

const FLOW_STEPS: FlowStep[] = ['frame', 'list', 'optimize', 'win']
const THEME_MAP: Record<FlowStep, { theme: string; theme_name: string }> = {
  frame:    { theme: 'T1', theme_name: 'Upstream Before Downstream' },
  list:     { theme: 'T4', theme_name: 'Width Before Depth' },
  optimize: { theme: 'T5', theme_name: 'Name the Criterion, Name the Sacrifice' },
  win:      { theme: 'T7', theme_name: 'A Recommendation Is a Falsifiable Hypothesis' },
}
const WEIGHTS: Record<FlowStep, number> = { frame: 0.25, list: 0.25, optimize: 0.25, win: 0.25 }

const STEP_TOPIC: Record<FlowStep, ScenarioExcerpt['topic']> = {
  frame: 'framing',
  list: 'options',
  optimize: 'tradeoff',
  win: 'recommendation',
}

async function callHaiku(prompt: string): Promise<string> {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Haiku returned non-text block')
  return block.text.trim()
}

async function callSonnet(prompt: string, maxTokens = 2000): Promise<string> {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Sonnet returned non-text block')
  return block.text.trim()
}

function parseJson<T>(raw: string): T {
  const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  if (!match) throw new Error(`No JSON found in response: ${raw.slice(0, 200)}`)
  return JSON.parse(match[0]) as T
}

function selectExcerpts(all: ScenarioExcerpt[], step: FlowStep): string[] {
  const preferred = STEP_TOPIC[step]
  const matching = all.filter(e => e.topic === preferred).map(e => e.quote)
  if (matching.length >= 2) return matching.slice(0, 3)
  // Fallback: mix any excerpts tagged context or first few
  const fallback = all.filter(e => e.topic === 'context' || e.topic === preferred).map(e => e.quote)
  return (fallback.length ? fallback : all.map(e => e.quote)).slice(0, 3)
}

export interface GeneratorInput {
  input_type: 'url' | 'text' | 'question'
  input_raw: string
}

export async function generateChallenge(input: GeneratorInput): Promise<ChallengeJson> {
  // Step 0: If URL, scrape
  let rawText = input.input_raw
  if (input.input_type === 'url') {
    const scraped = await scrapeUrl(input.input_raw)
    rawText = scraped.text
  }

  // Step 1: Open-ended expansion + verifier (question-type only, short inputs)
  if (isOpenEndedPrompt(input.input_type, input.input_raw)) {
    const expandedRaw = await callSonnet(buildExpandOpenEndedPrompt(input.input_raw), 2500)
    const expanded = parseJson<{
      expanded_source: string
      chosen_angle: string
      grounding_claims: Array<{ claim: string; confidence: string }>
    }>(expandedRaw)

    const verifiedRaw = await callSonnet(buildVerifierPrompt(expanded.expanded_source, expanded.grounding_claims), 2500)
    const verified = parseJson<{
      verified_source: string | null
      claims_stripped: string[]
      claims_preserved: string[]
      reason?: string
    }>(verifiedRaw)

    if (!verified.verified_source) {
      throw new Error(`Verifier rejected expanded source: ${verified.reason ?? 'no reason given'}`)
    }
    rawText = verified.verified_source
  }

  // Step 2: Haiku scrape/enrich
  const scrapeRaw = await callHaiku(buildScrapePrompt(rawText))
  const scrapeResult = parseJson<ScrapeResult>(scrapeRaw)
  const sourceRichness = scrapeResult.source_richness ?? 'normal'

  // Step 3: Sonnet scenario
  const scenarioRaw = await callSonnet(buildScenarioPrompt(rawText, scrapeResult.situation_summary))
  const scenario = parseJson<ChallengeJson['scenario']>(scenarioRaw)

  if (scrapeResult.data_points?.length) scenario.data_points = scrapeResult.data_points
  if (scrapeResult.insights?.length) scenario.insights = scrapeResult.insights
  if (scrapeResult.excerpts?.length) scenario.excerpts = scrapeResult.excerpts

  // Step 4: MCQs per step (1-3 questions based on richness), per-question grounding
  const flow_steps: DraftFlowStep[] = []
  for (const step of FLOW_STEPS) {
    const planRaw = await callHaiku(buildStepQuestionPlanPrompt(scenario, step, sourceRichness, rawText))
    const plan = parseJson<{
      question_count: number
      questions: Array<{ sequence: number; focus: string; grading_weight: number }>
    }>(planRaw)

    const stepExcerpts = selectExcerpts(scenario.excerpts ?? [], step)
    const questions: DraftFlowStep['questions'] = []
    for (const q of plan.questions) {
      const siblingFocuses = plan.questions.filter(x => x.sequence !== q.sequence).map(x => x.focus)
      const grounding = {
        focus: q.focus,
        sourceExcerpts: stepExcerpts,
        dataPoints: scenario.data_points ?? [],
        insights: scenario.insights ?? [],
        engineerStandout: scenario.engineer_standout,
        siblingFocuses,
      }
      const mcqRaw = await callSonnet(buildMcqPrompt(scenario, step, THEME_MAP[step].theme, grounding))
      const mcqData = parseJson<{
        question_text: string
        question_nudge: string
        target_competencies: string[]
        options: DraftFlowStep['questions'][0]['options']
      }>(mcqRaw)
      questions.push({
        question_text: mcqData.question_text,
        question_nudge: mcqData.question_nudge,
        sequence: q.sequence,
        grading_weight_within_step: q.grading_weight,
        target_competencies: mcqData.target_competencies,
        options: mcqData.options,
      })
    }

    flow_steps.push({
      step,
      theme: THEME_MAP[step].theme as IntellectualTheme,
      theme_name: THEME_MAP[step].theme_name,
      step_nudge: questions[0].question_nudge,
      grading_weight: WEIGHTS[step],
      questions,
    })
  }

  // Step 5: Taxonomy
  const stepSummary = flow_steps.map(s => s.questions[0].question_text).join(' | ')
  const taxRaw = await callSonnet(buildTaxonomyPrompt(scenario, stepSummary), 800)
  const metadata = parseJson<ChallengeJson['metadata']>(taxRaw)

  const challengeJson: ChallengeJson = { scenario, flow_steps, metadata }

  // Step 6: Validate
  const validation = validateChallengeJson(challengeJson)
  if (!validation.valid) {
    throw new Error(`Generated challenge failed validation: ${JSON.stringify(validation.errors)}`)
  }

  return challengeJson
}

export async function regenerateStep(
  existing: ChallengeJson,
  step: FlowStep
): Promise<DraftFlowStep> {
  const stepExcerpts = selectExcerpts(existing.scenario.excerpts ?? [], step)
  const grounding = {
    focus: `Regenerate the ${step} step with fresh MCQ options, same scenario.`,
    sourceExcerpts: stepExcerpts,
    dataPoints: existing.scenario.data_points ?? [],
    insights: existing.scenario.insights ?? [],
    engineerStandout: existing.scenario.engineer_standout,
    siblingFocuses: [],
  }
  const mcqRaw = await callSonnet(buildMcqPrompt(existing.scenario, step, THEME_MAP[step].theme, grounding))
  const mcqData = parseJson<{
    question_text: string
    question_nudge: string
    target_competencies: string[]
    options: DraftFlowStep['questions'][0]['options']
  }>(mcqRaw)

  return {
    step,
    theme: THEME_MAP[step].theme as IntellectualTheme,
    theme_name: THEME_MAP[step].theme_name,
    step_nudge: mcqData.question_nudge,
    grading_weight: WEIGHTS[step],
    questions: [{
      question_text: mcqData.question_text,
      question_nudge: mcqData.question_nudge,
      sequence: 1,
      grading_weight_within_step: 1.0,
      target_competencies: mcqData.target_competencies,
      options: mcqData.options,
    }],
  }
}
