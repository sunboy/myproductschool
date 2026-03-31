#!/usr/bin/env node
/**
 * generate-scaffold-options.js
 *
 * Pre-generates 4 Claude scaffold sentence starters for every challenge_step
 * and stores them in challenge_steps.scaffold_options.
 *
 * Idempotent: skips rows that already have scaffold_options populated.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate-scaffold-options.js
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate-scaffold-options.js --limit=10  (test run)
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate-scaffold-options.js --challenge=<id>  (single challenge)
 */

const { createClient } = require('@supabase/supabase-js')
const Anthropic = require('@anthropic-ai/sdk')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tikkhvxlclivixqqqjyb.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpa2todnhsY2xpdml4cXFxanliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMxMzI5MCwiZXhwIjoyMDc2ODg5MjkwfQ.SLtlceDB4vzlDWukbFpeYNQoXglqL1U41nuAKoRdSlM'
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

if (!ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY is required')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

const FLOW_SUBTITLES = {
  frame:    'Define the core problem',
  list:     'Who exactly is affected, and how?',
  optimize: 'Weigh your options',
  win:      'Make your recommendation',
}

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => a.slice(2).split('='))
)
const LIMIT = args.limit ? parseInt(args.limit, 10) : null
const CHALLENGE_FILTER = args.challenge || null

async function generateOptions(challengeTitle, challengePrompt, move, stepPrompt) {
  const subtitle = FLOW_SUBTITLES[move] || move

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `You are helping product thinkers practice structured analysis.

Challenge: ${challengeTitle}
Scenario: ${challengePrompt.slice(0, 500)}
FLOW Move: ${move.toUpperCase()} — ${subtitle}
Step instruction: ${stepPrompt}

Generate exactly 4 distinct sentence starters that a product thinker might use to begin their ${move} analysis. Each should represent a different analytical angle or framing. Write them as confident, opinionated first-person statements (10-20 words each) that set up a clear direction to build on.

Return ONLY a valid JSON array of 4 strings. No markdown, no explanation.`
    }]
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed) && parsed.length >= 4) {
      return parsed.slice(0, 4).map(s => String(s).trim())
    }
  } catch {
    // Try to extract JSON array from text
    const match = text.match(/\[[\s\S]*\]/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0])
        if (Array.isArray(parsed) && parsed.length >= 4) {
          return parsed.slice(0, 4).map(s => String(s).trim())
        }
      } catch { /* ignore */ }
    }
  }
  throw new Error(`Could not parse response: ${text.slice(0, 200)}`)
}

async function main() {
  console.log('Fetching challenge steps without scaffold options...')

  // Fetch steps that need options, joined with challenge data
  let stepsQuery = supabase
    .from('challenge_steps')
    .select('id, move, prompt, challenge_id, scaffold_options, challenge_prompts(title, prompt_text)')
    .or('scaffold_options.is.null,scaffold_options.eq.{}')

  if (CHALLENGE_FILTER) {
    stepsQuery = stepsQuery.eq('challenge_id', CHALLENGE_FILTER)
    console.log(`Filtering to challenge: ${CHALLENGE_FILTER}`)
  }

  if (LIMIT) {
    stepsQuery = stepsQuery.limit(LIMIT)
    console.log(`Limiting to ${LIMIT} rows`)
  }

  const { data: steps, error } = await stepsQuery

  if (error) {
    console.error('Failed to fetch steps:', error)
    process.exit(1)
  }

  console.log(`Found ${steps.length} steps to process`)

  let success = 0
  let failed = 0

  for (const step of steps) {
    const challenge = step.challenge_prompts
    if (!challenge) {
      console.warn(`Step ${step.id} has no challenge data, skipping`)
      continue
    }

    process.stdout.write(`  ${step.move.toUpperCase()} step for "${challenge.title.slice(0, 50)}"... `)

    try {
      const options = await generateOptions(
        challenge.title,
        challenge.prompt_text,
        step.move,
        step.prompt
      )

      const { error: updateError } = await supabase
        .from('challenge_steps')
        .update({ scaffold_options: options })
        .eq('id', step.id)

      if (updateError) throw updateError

      console.log(`✓ (${options.length} options)`)
      success++

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300))
    } catch (err) {
      console.log(`✗ ${err.message}`)
      failed++
    }
  }

  console.log(`\nDone: ${success} updated, ${failed} failed`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
