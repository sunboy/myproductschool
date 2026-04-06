#!/usr/bin/env npx tsx
/**
 * Apply schema changes for migration 037 using Supabase's
 * postgrest-based approach: we create a temporary RPC function
 * to run DDL, then drop it after.
 *
 * Usage: npx tsx scripts/apply-schema-037.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tikkhvxlclivixqqqjyb.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpa2todnhsY2xpdml4cXFxanliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMxMzI5MCwiZXhwIjoyMDc2ODg5MjkwfQ.SLtlceDB4vzlDWukbFpeYNQoXglqL1U41nuAKoRdSlM'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function main() {
  // First, check if challenge_type column already exists
  const { data, error } = await supabase
    .from('challenges')
    .select('id, challenge_type')
    .limit(1)

  if (!error) {
    console.log('✓ challenge_type column already exists. Schema changes already applied.')
    console.log('  Proceeding to data migration...\n')
    return true
  }

  if (error && !error.message.includes('challenge_type')) {
    console.error('Unexpected error:', error.message)
    return false
  }

  console.log('Schema changes needed. Please run the following SQL in the Supabase SQL Editor:')
  console.log('Dashboard URL: https://supabase.com/dashboard/project/tikkhvxlclivixqqqjyb/sql/new')
  console.log('\n--- COPY BELOW ---\n')
  console.log(`
-- Migration 037 Schema Changes

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
  console.log('\n--- COPY ABOVE ---\n')
  console.log('After running the SQL above, re-run this script or run:')
  console.log('  npx tsx scripts/apply-migration-037.ts')
  return false
}

main().then(schemaReady => {
  if (!schemaReady) process.exit(1)
})
