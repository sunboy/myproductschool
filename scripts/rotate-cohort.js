#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */

// Cohort challenge rotation script
//
// Usage:
//   node scripts/rotate-cohort.js           — rotates to next Monday
//   node scripts/rotate-cohort.js --dry-run — prints what would be picked without writing
//
// Can be run weekly via cron:
//   0 9 * * 1 cd /path/to/project && node scripts/rotate-cohort.js

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  process.exit(1)
}

const supabase = createClient(
  SUPABASE_URL,
  SERVICE_ROLE_KEY
)

const isDryRun = process.argv.includes('--dry-run')

// ── Date helpers ──────────────────────────────────────────────────────────────

function nextMonday() {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon, …, 6=Sat
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7
  const monday = new Date(now)
  monday.setDate(now.getDate() + daysUntilMonday)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function toDateString(date) {
  return date.toISOString().split('T')[0]
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function rotate() {
  console.log(`Cohort rotation${isDryRun ? ' [DRY RUN]' : ''}`)

  // Get all challenge IDs that have already been used in cohort_challenges
  const { data: pastCohorts, error: pastErr } = await supabase
    .from('cohort_challenges')
    .select('title')

  if (pastErr) { console.error('Error fetching past cohorts:', pastErr.message); process.exit(1) }

  const usedTitles = new Set((pastCohorts || []).map(c => c.title))
  console.log(`Past cohort titles used: ${usedTitles.size}`)

  // Get all published challenges
  const { data: challenges, error: chErr } = await supabase
    .from('challenge_prompts')
    .select('id, title, prompt_text, difficulty, move_tags')
    .eq('is_published', true)

  if (chErr) { console.error('Error fetching challenges:', chErr.message); process.exit(1) }

  // Prefer challenges not yet used as cohort challenges
  const unused = challenges.filter(c => !usedTitles.has(c.title))
  const pool = unused.length > 0 ? unused : challenges
  console.log(`Challenge pool: ${pool.length} (${unused.length} unused, ${challenges.length - unused.length} used)`)

  // Pick a random challenge from the pool
  const pick = pool[Math.floor(Math.random() * pool.length)]
  console.log(`\nPicked: "${pick.title}" (${pick.difficulty})`)

  // Calculate next Monday–Sunday window
  const weekStart = nextMonday()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const weekStartStr = toDateString(weekStart)
  const weekEndStr = toDateString(weekEnd)
  console.log(`Week: ${weekStartStr} → ${weekEndStr}`)

  if (isDryRun) {
    console.log('\nDry run — no changes written.')
    return
  }

  // Deactivate any currently active cohort challenge
  const { error: deactivateErr } = await supabase
    .from('cohort_challenges')
    .update({ is_active: false })
    .eq('is_active', true)

  if (deactivateErr) { console.error('Error deactivating old cohort:', deactivateErr.message); process.exit(1) }

  // Insert new cohort challenge
  const newCohort = {
    title: pick.title,
    prompt_text: pick.prompt_text,
    difficulty: pick.difficulty,
    move_tag: pick.move_tags?.[0] || null,
    week_start: weekStartStr,
    week_end: weekEndStr,
    is_active: true,
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('cohort_challenges')
    .insert(newCohort)
    .select('id, title, week_start, week_end')
    .single()

  if (insertErr) { console.error('Error inserting new cohort:', insertErr.message); process.exit(1) }

  console.log(`\nNew cohort challenge created: ${inserted.id}`)
  console.log(`  Title: ${inserted.title}`)
  console.log(`  Week: ${inserted.week_start} → ${inserted.week_end}`)

  // Summary count
  const { count } = await supabase
    .from('cohort_challenges')
    .select('*', { count: 'exact', head: true })

  console.log(`\nTotal cohort_challenges rows: ${count}`)
}

rotate().catch(err => { console.error(err); process.exit(1) })
