#!/usr/bin/env npx tsx
/**
 * Normalize challenges.company_tags to lowercase, hyphenated slugs so the
 * company filter (which queries by slug) matches every challenge. Legacy rows
 * stored display names like "Google"/"Apple"/"Meta"; imports stored slugs.
 *
 * Usage: npx tsx --env-file=.env.local scripts/normalize-company-tags.ts [--dry-run]
 */
import { createClient } from '@supabase/supabase-js'
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const DRY = process.argv.includes('--dry-run')

function slug(v: string): string {
  return v.toLowerCase().trim().replace(/&/g, 'and').replace(/[\s]+/g, '-')
}

;(async () => {
  const { data } = await s.from('challenges').select('id, company_tags').not('company_tags', 'eq', '{}')
  let changed = 0
  for (const c of data ?? []) {
    const orig = (c.company_tags ?? []) as string[]
    const normed = [...new Set(orig.map(slug))]
    if (JSON.stringify(orig) !== JSON.stringify(normed)) {
      changed++
      if (!DRY) await s.from('challenges').update({ company_tags: normed }).eq('id', c.id)
    }
  }
  console.log(`${DRY ? '[dry] would normalize' : 'normalized'} ${changed} rows (of ${(data ?? []).length} with tags)`)
})()
