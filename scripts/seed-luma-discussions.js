#!/usr/bin/env node
/**
 * seed-luma-discussions.js
 *
 * Seeds every challenge with 1 Luma expert discussion + 2 reply threads.
 * Uses Claude to generate contextually relevant content per challenge.
 * Idempotent: skips challenges that already have Luma discussions.
 *
 * Requires migration 018_luma_seed_flag.sql to be applied first
 * (makes user_id nullable, adds display_name column).
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/seed-luma-discussions.js
 *   ANTHROPIC_API_KEY=sk-... node scripts/seed-luma-discussions.js --limit=3
 *   ANTHROPIC_API_KEY=sk-... node scripts/seed-luma-discussions.js --challenge=<id>
 */

const { createClient } = require('@supabase/supabase-js')
const Anthropic = require('@anthropic-ai/sdk')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tikkhvxlclivixqqqjyb.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpa2todnhsY2xpdml4cXFxanliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMxMzI5MCwiZXhwIjoyMDc2ODg5MjkwfQ.SLtlceDB4vzlDWukbFpeYNQoXglqL1U41nuAKoRdSlM'
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

if (!ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is required.')
  console.error('Usage: ANTHROPIC_API_KEY=sk-ant-... node scripts/seed-luma-discussions.js')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

// Bot display names — these are used as the persona labels in the UI.
// user_id is left NULL; display_name identifies the bot persona.
const LUMA_COACH_NAME = 'Luma'
const LUMA_DATA_NAME  = 'Luma · Data'
const LUMA_STRAT_NAME = 'Luma · Strategy'

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => a.slice(2).split('='))
)
const LIMIT = args.limit ? parseInt(args.limit, 10) : null
const CHALLENGE_FILTER = args.challenge || null

async function generateDiscussions(title, promptText) {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `You are Luma, an AI product thinking coach. A new challenge was posted: "${title}".

Scenario summary: ${promptText.slice(0, 400)}

Generate discussion content to seed this challenge's community thread. Return ONLY valid JSON with this exact structure:
{
  "expert_post": "2-3 sentence analytical frame for how to approach this challenge. Written as an expert coach setting the intellectual context. No fluff, no 'great question'. Direct, insightful, opinionated.",
  "data_reply": "1-2 sentences from a data/metrics angle — what numbers would you look at first and why.",
  "strategy_reply": "1-2 sentences from a strategic/business angle — what's the broader business context that shapes the right answer."
}

Be specific to this challenge. No generic advice. Sound like a senior PM who has solved this exact type of problem before.`
    }]
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '{}'
  try {
    const match = text.match(/\{[\s\S]*\}/)
    return JSON.parse(match ? match[0] : text)
  } catch {
    throw new Error(`JSON parse failed: ${text.slice(0, 120)}`)
  }
}

async function main() {
  console.log('Seeding Luma discussions...\n')

  // Fetch challenges
  let query = supabase
    .from('challenge_prompts')
    .select('id, title, prompt_text')
    .eq('is_published', true)

  if (CHALLENGE_FILTER) query = query.eq('id', CHALLENGE_FILTER)
  if (LIMIT) query = query.limit(LIMIT)

  const { data: challenges, error: fetchErr } = await query
  if (fetchErr) {
    console.error('Failed to fetch challenges:', fetchErr.message)
    process.exit(1)
  }
  console.log(`Found ${challenges.length} challenge(s)`)

  // Check which already have Luma expert discussions (idempotent guard)
  const { data: existing, error: existErr } = await supabase
    .from('challenge_discussions')
    .select('challenge_id')
    .eq('display_name', LUMA_COACH_NAME)
    .is('user_id', null)

  if (existErr) {
    // If column doesn't exist yet the migration hasn't been applied
    if (existErr.message.includes('display_name')) {
      console.error('\nError: "display_name" column not found on challenge_discussions.')
      console.error('Apply migration 018_luma_seed_flag.sql to your Supabase project first.')
      console.error('Run it via the Supabase SQL editor or CLI:\n  supabase db push\n')
      process.exit(1)
    }
    console.error('Failed to check existing discussions:', existErr.message)
    process.exit(1)
  }

  const seededIds = new Set((existing || []).map(r => r.challenge_id))
  const toSeed = challenges.filter(c => !seededIds.has(c.id))
  console.log(`${seededIds.size} already seeded, ${toSeed.length} to process\n`)

  if (toSeed.length === 0) {
    console.log('Nothing to do.')
    return
  }

  let success = 0
  let failed = 0

  for (const challenge of toSeed) {
    const label = `"${challenge.title.slice(0, 55)}"`
    process.stdout.write(`  ${label}... `)

    try {
      const content = await generateDiscussions(challenge.title, challenge.prompt_text)

      // Insert expert discussion post (Luma coach frame)
      const { data: discussion, error: discErr } = await supabase
        .from('challenge_discussions')
        .insert({
          challenge_id: challenge.id,
          user_id: null,
          display_name: LUMA_COACH_NAME,
          content: content.expert_post,
          is_expert_pick: true,
          upvote_count: Math.floor(Math.random() * 8) + 3, // 3–10 upvotes to feel active
        })
        .select('id')
        .single()

      if (discErr) throw new Error(`Discussion insert: ${discErr.message}`)

      // Insert 2 persona replies
      const replyRows = [
        {
          discussion_id: discussion.id,
          user_id: null,
          display_name: LUMA_DATA_NAME,
          content: content.data_reply,
        },
        {
          discussion_id: discussion.id,
          user_id: null,
          display_name: LUMA_STRAT_NAME,
          content: content.strategy_reply,
        },
      ]

      const { error: replErr } = await supabase
        .from('discussion_replies')
        .insert(replyRows)

      if (replErr) throw new Error(`Replies insert: ${replErr.message}`)

      console.log('done')
      success++

      // Brief pause to respect Anthropic rate limits
      await new Promise(r => setTimeout(r, 400))
    } catch (err) {
      console.log(`FAILED — ${err.message}`)
      failed++
    }
  }

  console.log(`\nDone: ${success} seeded, ${failed} failed`)
}

main().catch(err => {
  console.error('\nFatal error:', err.message)
  process.exit(1)
})
