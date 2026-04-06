#!/usr/bin/env npx tsx
/**
 * Backfill slugs for all challenges that don't have one.
 * Generates lowercase kebab-case slugs from titles.
 *
 * Usage: npx tsx scripts/backfill-slugs.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tikkhvxlclivixqqqjyb.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpa2todnhsY2xpdml4cXFxanliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMxMzI5MCwiZXhwIjoyMDc2ODg5MjkwfQ.SLtlceDB4vzlDWukbFpeYNQoXglqL1U41nuAKoRdSlM'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/['']/g, '')           // remove apostrophes
    .replace(/[^a-z0-9]+/g, '-')   // non-alphanumeric → hyphen
    .replace(/^-+|-+$/g, '')       // trim leading/trailing hyphens
    .slice(0, 80)                  // cap length
}

async function main() {
  const { data: challenges, error } = await supabase
    .from('challenges')
    .select('id, title, slug')
    .is('slug', null)

  if (error) {
    console.error('Failed to fetch challenges:', error.message)
    process.exit(1)
  }

  if (!challenges || challenges.length === 0) {
    console.log('All challenges already have slugs.')
    return
  }

  console.log(`${challenges.length} challenges need slugs.\n`)

  // Track used slugs to handle duplicates
  const usedSlugs = new Set<string>()

  // Also fetch existing slugs
  const { data: existing } = await supabase
    .from('challenges')
    .select('slug')
    .not('slug', 'is', null)

  for (const row of existing ?? []) {
    if (row.slug) usedSlugs.add(row.slug)
  }

  let updated = 0
  for (const c of challenges) {
    let slug = slugify(c.title)

    // Deduplicate
    let candidate = slug
    let suffix = 2
    while (usedSlugs.has(candidate)) {
      candidate = `${slug}-${suffix}`
      suffix++
    }
    slug = candidate
    usedSlugs.add(slug)

    const { error: updateErr } = await supabase
      .from('challenges')
      .update({ slug })
      .eq('id', c.id)

    if (updateErr) {
      console.error(`  ✗ ${c.id}: ${updateErr.message}`)
    } else {
      console.log(`  ✓ ${slug}`)
      updated++
    }
  }

  console.log(`\nDone: ${updated}/${challenges.length} slugs set.`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
