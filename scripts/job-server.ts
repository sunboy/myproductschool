// scripts/job-server.ts
// Local job server — uses Claude Code CLI (your subscription, zero API cost).
// Run with: npx tsx --tsconfig tsconfig.json scripts/job-server.ts
// Prerequisites: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env,
//               `claude` CLI in PATH and authenticated (`claude /login`)

import { createClient } from '@supabase/supabase-js'
import { execFileSync } from 'child_process'
import {
  buildScrapePrompt, buildScenarioPrompt, buildMcqPrompt, buildTaxonomyPrompt,
  buildStepQuestionPlanPrompt, buildExpandOpenEndedPrompt, buildVerifierPrompt,
  isOpenEndedPrompt,
  type ScrapeResult,
} from '../src/lib/content/prompts'
import { validateChallengeJson } from '../src/lib/content/validator'
import { scrapeUrl } from '../src/lib/content/scraper'
import type { ChallengeJson, DraftFlowStep, FlowStep, IntellectualTheme, ScenarioExcerpt } from '../src/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const POLL_INTERVAL_MS = 2000
const CLAUDE_BIN = process.env.CLAUDE_BIN ?? 'claude'

function callClaude(prompt: string): string {
  const result = execFileSync(
    CLAUDE_BIN,
    ['-p', '--output-format', 'json', '--max-budget-usd', '0.5'],
    {
      input: prompt,
      encoding: 'utf8',
      timeout: 120_000,
      env: { ...process.env },
    }
  )
  const parsed = JSON.parse(result) as { result: string; is_error: boolean; subtype: string }
  if (parsed.is_error || parsed.subtype === 'error') {
    throw new Error(`Claude CLI error: ${parsed.result}`)
  }
  return parsed.result.trim()
}

function parseJson<T>(raw: string): T {
  const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  if (!match) throw new Error(`No JSON found in response: ${raw.slice(0, 300)}`)
  return JSON.parse(match[0]) as T
}

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

function selectExcerpts(all: ScenarioExcerpt[], step: FlowStep): string[] {
  const preferred = STEP_TOPIC[step]
  const matching = all.filter(e => e.topic === preferred).map(e => e.quote)
  if (matching.length >= 2) return matching.slice(0, 3)
  const fallback = all.filter(e => e.topic === 'context' || e.topic === preferred).map(e => e.quote)
  return (fallback.length ? fallback : all.map(e => e.quote)).slice(0, 3)
}

async function generateChallengeLocally(inputType: string, inputRaw: string): Promise<ChallengeJson> {
  // Step 1: raw text
  let rawText = inputRaw
  if (inputType === 'url') {
    console.log('  [scraper] fetching URL...')
    const scraped = await scrapeUrl(inputRaw)
    rawText = scraped.text
  }

  // Step 2: open-ended expansion + verifier (question-type only, short prompts)
  if (isOpenEndedPrompt(inputType, inputRaw)) {
    console.log('  [claude] open-ended input detected, expanding into source material...')
    const expandedRaw = callClaude(buildExpandOpenEndedPrompt(inputRaw))
    const expanded = parseJson<{
      expanded_source: string
      chosen_angle: string
      grounding_claims: Array<{ claim: string; confidence: string }>
    }>(expandedRaw)
    console.log(`  [claude] chosen angle: ${expanded.chosen_angle}`)

    console.log('  [claude] verifying grounding claims...')
    const verifiedRaw = callClaude(buildVerifierPrompt(expanded.expanded_source, expanded.grounding_claims))
    const verified = parseJson<{
      verified_source: string | null
      claims_stripped: string[]
      claims_preserved: string[]
      reason?: string
    }>(verifiedRaw)

    if (!verified.verified_source) {
      throw new Error(`Verifier rejected expanded source: ${verified.reason ?? 'unspecified'}`)
    }
    console.log(`  [claude] verifier stripped ${verified.claims_stripped.length} claims, preserved ${verified.claims_preserved.length}`)
    rawText = verified.verified_source
  }

  // Step 3: scrape/enrich (now returns insights + excerpts)
  console.log('  [claude] enriching source material...')
  const scrapeRaw = callClaude(buildScrapePrompt(rawText))
  const scrapeResult = parseJson<ScrapeResult>(scrapeRaw)
  const sourceRichness = scrapeResult.source_richness ?? 'normal'

  // Step 4: scenario
  console.log('  [claude] generating scenario...')
  const scenarioRaw = callClaude(buildScenarioPrompt(rawText, scrapeResult.situation_summary))
  const scenario = parseJson<ChallengeJson['scenario']>(scenarioRaw)

  if (scrapeResult.data_points?.length) scenario.data_points = scrapeResult.data_points
  if (scrapeResult.insights?.length) scenario.insights = scrapeResult.insights
  if (scrapeResult.excerpts?.length) scenario.excerpts = scrapeResult.excerpts

  // Step 5: MCQs for each FLOW step (1-3 questions per step, grounded per-question)
  const flow_steps: DraftFlowStep[] = []
  for (const step of FLOW_STEPS) {
    console.log(`  [claude] planning ${step} questions (richness: ${sourceRichness})...`)
    const planRaw = callClaude(buildStepQuestionPlanPrompt(scenario, step, sourceRichness, rawText))
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
      console.log(`  [claude] generating ${step} Q${q.sequence} MCQ (focus: ${q.focus.slice(0, 60)}...)`)
      const mcqRaw = callClaude(buildMcqPrompt(scenario, step, THEME_MAP[step].theme, grounding))
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

  // Step 6: taxonomy
  console.log('  [claude] tagging taxonomy...')
  const stepSummary = flow_steps.map(s => s.questions[0].question_text).join(' | ')
  const taxRaw = callClaude(buildTaxonomyPrompt(scenario, stepSummary))
  const metadata = parseJson<ChallengeJson['metadata']>(taxRaw)

  const challengeJson: ChallengeJson = { scenario, flow_steps, metadata }

  // Step 7: validate
  const validation = validateChallengeJson(challengeJson)
  if (!validation.valid) {
    throw new Error(`Generated challenge failed validation: ${JSON.stringify(validation.errors)}`)
  }
  if (validation.warnings.length > 0) {
    console.log('  [validator] warnings:')
    for (const w of validation.warnings) {
      console.log(`    - ${w.path}: ${w.message}`)
    }
  }

  return challengeJson
}

async function processPendingJob() {
  const { data: jobs } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('status', 'pending')
    .eq('mode', 'local')
    .order('created_at', { ascending: true })
    .limit(1)

  const job = jobs?.[0]
  if (!job) return

  console.log(`\n[job-server] Processing job ${job.id} (${job.input_type}: ${job.input_raw.slice(0, 60)})`)

  try {
    await supabase.from('generation_jobs').update({ status: 'scraping' }).eq('id', job.id)
    await supabase.from('generation_jobs').update({ status: 'generating' }).eq('id', job.id)

    const challengeJson = await generateChallengeLocally(job.input_type, job.input_raw)

    await supabase.from('draft_challenges').insert({ job_id: job.id, challenge_json: challengeJson })
    await supabase.from('generation_jobs').update({
      status: 'review',
      scraped_text: challengeJson.scenario.context,
    }).eq('id', job.id)

    console.log(`[job-server] ✓ Job ${job.id} complete → status=review`)
  } catch (err) {
    console.error(`[job-server] ✗ Job ${job.id} failed:`, err)
    await supabase.from('generation_jobs').update({
      status: 'failed',
      error_message: String(err),
    }).eq('id', job.id)
  }
}

console.log('[job-server] Starting — polling every 2s for local-mode pending jobs...')
console.log(`[job-server] Using claude CLI: ${CLAUDE_BIN}`)
setInterval(processPendingJob, POLL_INTERVAL_MS)
processPendingJob()
