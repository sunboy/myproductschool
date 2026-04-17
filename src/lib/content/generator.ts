// src/lib/content/generator.ts
import Anthropic from '@anthropic-ai/sdk'
import { scrapeUrl } from './scraper'
import {
  buildScrapePrompt, buildScenarioPrompt, buildMcqPrompt,
  buildTaxonomyPrompt,
} from './prompts'
import { validateChallengeJson } from './validator'
import type { ChallengeJson, DraftFlowStep, FlowStep, IntellectualTheme } from '@/lib/types'

const client = new Anthropic()

const FLOW_STEPS: FlowStep[] = ['frame', 'list', 'optimize', 'win']

async function callHaiku(prompt: string): Promise<string> {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
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

export interface GeneratorInput {
  input_type: 'url' | 'text' | 'question'
  input_raw: string
}

export async function generateChallenge(input: GeneratorInput): Promise<ChallengeJson> {
  // Step 1: Get raw text
  let rawText = input.input_raw
  if (input.input_type === 'url') {
    const scraped = await scrapeUrl(input.input_raw)
    rawText = scraped.text
  }

  // Step 2: Haiku scrape/enrich
  const scrapeRaw = await callHaiku(buildScrapePrompt(rawText))
  const scrapeResult = parseJson<{
    situation_summary: string
    data_points: string[]
    has_table_content: boolean
  }>(scrapeRaw)

  // Step 3: Sonnet scenario
  const scenarioRaw = await callSonnet(buildScenarioPrompt(rawText, scrapeResult.situation_summary))
  const scenario = parseJson<ChallengeJson['scenario']>(scenarioRaw)

  // Add data_points only if genuinely found
  if (scrapeResult.data_points.length > 0) {
    scenario.data_points = scrapeResult.data_points
  }

  // Step 4: MCQs for each FLOW step
  const flow_steps: DraftFlowStep[] = []
  const THEME_MAP: Record<FlowStep, { theme: string; theme_name: string }> = {
    frame:    { theme: 'T1', theme_name: 'Upstream Before Downstream' },
    list:     { theme: 'T4', theme_name: 'Width Before Depth' },
    optimize: { theme: 'T5', theme_name: 'Name the Criterion, Name the Sacrifice' },
    win:      { theme: 'T7', theme_name: 'A Recommendation Is a Falsifiable Hypothesis' },
  }
  const WEIGHTS: Record<FlowStep, number> = { frame: 0.25, list: 0.25, optimize: 0.25, win: 0.25 }

  for (const step of FLOW_STEPS) {
    const mcqRaw = await callSonnet(buildMcqPrompt(scenario, step, THEME_MAP[step].theme))
    const mcqData = parseJson<{
      question_text: string
      question_nudge: string
      target_competencies: string[]
      options: DraftFlowStep['questions'][0]['options']
    }>(mcqRaw)

    flow_steps.push({
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
  const THEME_MAP: Record<FlowStep, { theme: string; theme_name: string }> = {
    frame:    { theme: 'T1', theme_name: 'Upstream Before Downstream' },
    list:     { theme: 'T4', theme_name: 'Width Before Depth' },
    optimize: { theme: 'T5', theme_name: 'Name the Criterion, Name the Sacrifice' },
    win:      { theme: 'T7', theme_name: 'A Recommendation Is a Falsifiable Hypothesis' },
  }
  const WEIGHTS: Record<FlowStep, number> = { frame: 0.25, list: 0.25, optimize: 0.25, win: 0.25 }

  const mcqRaw = await callSonnet(buildMcqPrompt(existing.scenario, step, THEME_MAP[step].theme))
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
