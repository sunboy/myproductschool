#!/usr/bin/env npx tsx
/**
 * Apply migration 037: Consolidate challenge tables
 *
 * Since we can't run raw SQL via CLI (no DB password), this script
 * uses the Supabase JS client (service role) to perform the data
 * migration. Schema changes (ALTER TABLE) must be applied via the
 * Supabase Dashboard SQL Editor.
 *
 * Usage: npx tsx scripts/apply-migration-037.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tikkhvxlclivixqqqjyb.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpa2todnhsY2xpdml4cXFxanliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMxMzI5MCwiZXhwIjoyMDc2ODg5MjkwfQ.SLtlceDB4vzlDWukbFpeYNQoXglqL1U41nuAKoRdSlM'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function main() {
  console.log('=== Migration 037: Consolidate challenges ===\n')

  // ── Step 1: Check if schema changes have been applied ─────
  console.log('Step 1: Checking if schema changes are applied...')
  const { data: testRow, error: testErr } = await supabase
    .from('challenges')
    .select('id, challenge_type')
    .limit(1)
    .maybeSingle()

  if (testErr?.message?.includes('challenge_type')) {
    console.error('ERROR: Schema changes not yet applied.')
    console.error('Please run the following SQL in the Supabase Dashboard SQL Editor first:\n')
    console.error(`
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS challenge_type TEXT NOT NULL DEFAULT 'flow'
    CHECK (challenge_type IN ('flow', 'freeform', 'quick_take')),
  ADD COLUMN IF NOT EXISTS prompt_text TEXT,
  ADD COLUMN IF NOT EXISTS domain_id UUID REFERENCES domains(id),
  ADD COLUMN IF NOT EXISTS scenario_embedding extensions.vector(384),
  ADD COLUMN IF NOT EXISTS move_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS decision_id UUID REFERENCES autopsy_decisions(id),
  ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_challenges_slug ON challenges(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_challenges_domain ON challenges(domain_id) WHERE domain_id IS NOT NULL;

ALTER TABLE challenge_attempts
  ADD COLUMN IF NOT EXISTS response_text TEXT,
  ADD COLUMN IF NOT EXISTS selected_option_label TEXT,
  ADD COLUMN IF NOT EXISTS legacy_points INTEGER;
`)
    process.exit(1)
  }
  console.log('  ✓ Schema changes detected\n')

  // ── Step 2: Fetch challenge_prompts ───────────────────────
  console.log('Step 2: Fetching challenge_prompts...')
  const { data: prompts, error: promptsErr } = await supabase
    .from('challenge_prompts')
    .select('*')

  if (promptsErr) {
    // Table might already be archived
    if (promptsErr.message?.includes('does not exist') || promptsErr.message?.includes('challenge_prompts')) {
      console.log('  ⚠ challenge_prompts table not found (already archived?)')
    } else {
      console.error('  ✗ Error:', promptsErr.message)
      process.exit(1)
    }
  }

  if (prompts && prompts.length > 0) {
    console.log(`  Found ${prompts.length} challenge_prompts to migrate`)

    // Map paradigm values
    const mapParadigm = (p: string | null): string => {
      if (p === 'ai-assisted') return 'ai_assisted'
      if (p === 'ai-native') return 'ai_native'
      return p ?? 'traditional'
    }

    // Map difficulty values
    const mapDifficulty = (d: string): string => {
      if (d === 'beginner') return 'warmup'
      if (d === 'intermediate') return 'standard'
      return d // 'advanced' stays 'advanced'
    }

    const rows = prompts.map(cp => ({
      id: cp.id,
      title: cp.title,
      scenario_context: cp.prompt_text,
      scenario_trigger: '',
      scenario_question: cp.title,
      paradigm: mapParadigm(cp.paradigm),
      difficulty: mapDifficulty(cp.difficulty),
      estimated_minutes: cp.estimated_minutes ?? 10,
      tags: cp.tags ?? [],
      is_published: cp.is_published,
      is_premium: cp.is_premium ?? false,
      relevant_roles: cp.role_tags ?? [],
      created_at: cp.created_at,
      updated_at: cp.created_at,
      challenge_type: 'freeform',
      prompt_text: cp.prompt_text,
      domain_id: cp.domain_id,
      move_tags: cp.move_tags ?? [],
    }))

    // Insert in batches of 20
    for (let i = 0; i < rows.length; i += 20) {
      const batch = rows.slice(i, i + 20)
      const { error: insertErr } = await supabase
        .from('challenges')
        .upsert(batch, { onConflict: 'id', ignoreDuplicates: true })

      if (insertErr) {
        console.error(`  ✗ Error inserting batch ${i / 20 + 1}:`, insertErr.message)
      } else {
        console.log(`  ✓ Inserted batch ${i / 20 + 1} (${batch.length} rows)`)
      }
    }
  }

  // ── Step 3: Fetch quick_takes ─────────────────────────────
  console.log('\nStep 3: Fetching quick_takes...')
  const { data: quickTakes, error: qtErr } = await supabase
    .from('quick_takes')
    .select('*')

  if (qtErr) {
    if (qtErr.message?.includes('does not exist')) {
      console.log('  ⚠ quick_takes table not found (already archived?)')
    } else {
      console.error('  ✗ Error:', qtErr.message)
    }
  }

  if (quickTakes && quickTakes.length > 0) {
    console.log(`  Found ${quickTakes.length} quick_takes to migrate`)

    const mapParadigm = (p: string | null): string => {
      if (p === 'ai-assisted') return 'ai_assisted'
      if (p === 'ai-native') return 'ai_native'
      return p ?? 'traditional'
    }

    const qtRows = quickTakes.map(qt => ({
      id: qt.id,
      title: (qt.scenario_text ?? '').slice(0, 100),
      scenario_context: qt.scenario_text ?? '',
      scenario_trigger: '',
      scenario_question: qt.scenario_text ?? '',
      paradigm: mapParadigm(qt.paradigm),
      difficulty: 'warmup',
      estimated_minutes: 2,
      is_published: true,
      created_at: qt.created_at,
      updated_at: qt.created_at,
      challenge_type: 'quick_take',
      prompt_text: qt.scenario_text,
      move_tags: qt.move ? [qt.move] : [],
    }))

    const { error: qtInsertErr } = await supabase
      .from('challenges')
      .upsert(qtRows, { onConflict: 'id', ignoreDuplicates: true })

    if (qtInsertErr) {
      console.error('  ✗ Error:', qtInsertErr.message)
    } else {
      console.log(`  ✓ Inserted ${qtRows.length} quick_take challenges`)
    }
  }

  // ── Step 4: Set decision_id on autopsy challenges ─────────
  console.log('\nStep 4: Linking autopsy challenges to decisions...')
  const { data: autopsyChallenges, error: acErr } = await supabase
    .from('autopsy_challenges')
    .select('challenge_id, decision_id')

  if (acErr) {
    if (acErr.message?.includes('does not exist')) {
      console.log('  ⚠ autopsy_challenges table not found (already archived?)')
    } else {
      console.error('  ✗ Error:', acErr.message)
    }
  }

  if (autopsyChallenges && autopsyChallenges.length > 0) {
    for (const ac of autopsyChallenges) {
      if (!ac.challenge_id || !ac.decision_id) continue
      const { error: updateErr } = await supabase
        .from('challenges')
        .update({ decision_id: ac.decision_id })
        .eq('id', ac.challenge_id)

      if (updateErr) {
        console.error(`  ✗ Error linking ${ac.challenge_id}:`, updateErr.message)
      } else {
        console.log(`  ✓ Linked ${ac.challenge_id} → decision ${ac.decision_id}`)
      }
    }
  }

  // ── Step 5: Migrate autopsy_attempts ──────────────────────
  console.log('\nStep 5: Migrating autopsy_attempts...')
  const { data: autopsyAttempts, error: aaErr } = await supabase
    .from('autopsy_attempts')
    .select('*')

  if (aaErr) {
    if (aaErr.message?.includes('does not exist')) {
      console.log('  ⚠ autopsy_attempts table not found (already archived?)')
    } else {
      console.error('  ✗ Error:', aaErr.message)
    }
  }

  if (autopsyAttempts && autopsyAttempts.length > 0) {
    // We need to map product_slug + decision_index → challenge_id
    for (const aa of autopsyAttempts) {
      // Find the product
      const { data: product } = await supabase
        .from('autopsy_products')
        .select('id')
        .eq('slug', aa.product_slug)
        .single()

      if (!product) {
        console.log(`  ⚠ Product not found for slug: ${aa.product_slug}`)
        continue
      }

      // Find the decision at this index
      const { data: decision } = await supabase
        .from('autopsy_decisions')
        .select('id')
        .eq('product_id', product.id)
        .eq('sort_order', aa.decision_index)
        .single()

      if (!decision) {
        console.log(`  ⚠ Decision not found for index ${aa.decision_index}`)
        continue
      }

      // Find the challenge linked to this decision
      const { data: challenge } = await supabase
        .from('challenges')
        .select('id')
        .eq('decision_id', decision.id)
        .single()

      if (!challenge) {
        console.log(`  ⚠ Challenge not found for decision ${decision.id}`)
        continue
      }

      const { error: insertErr } = await supabase
        .from('challenge_attempts')
        .upsert({
          id: aa.id,
          user_id: aa.user_id,
          challenge_id: challenge.id,
          role_id: 'swe',
          total_score: aa.points,
          max_score: 3.0,
          grade_label: aa.grade_label,
          status: 'completed',
          started_at: aa.submitted_at,
          completed_at: aa.submitted_at,
          created_at: aa.submitted_at,
          selected_option_label: aa.selected_option_label,
          legacy_points: aa.points,
        }, { onConflict: 'id', ignoreDuplicates: true })

      if (insertErr) {
        console.error(`  ✗ Error migrating attempt ${aa.id}:`, insertErr.message)
      } else {
        console.log(`  ✓ Migrated attempt ${aa.id}`)
      }
    }
  }

  // ── Step 6: Verify ────────────────────────────────────────
  console.log('\n=== Verification ===')
  const { data: counts } = await supabase
    .from('challenges')
    .select('challenge_type')

  if (counts) {
    const typeCount: Record<string, number> = {}
    for (const row of counts) {
      typeCount[row.challenge_type] = (typeCount[row.challenge_type] ?? 0) + 1
    }
    console.log('Challenge counts by type:', typeCount)
    const total = Object.values(typeCount).reduce((a, b) => a + b, 0)
    console.log(`Total: ${total} challenges`)

    if (total >= 78) {
      console.log('\n✅ Data migration complete!')
      console.log('\nNext: Archive old tables via SQL Editor:')
      console.log('  ALTER TABLE challenge_prompts RENAME TO _archived_challenge_prompts;')
      console.log('  ALTER TABLE autopsy_challenges RENAME TO _archived_autopsy_challenges;')
      console.log('  ALTER TABLE quick_takes RENAME TO _archived_quick_takes;')
      console.log('  ALTER TABLE autopsy_attempts RENAME TO _archived_autopsy_attempts;')
    } else {
      console.log(`\n⚠ Expected 78 challenges, got ${total}. Check for errors above.`)
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
