#!/usr/bin/env npx tsx
/**
 * Backfill + normalize challenge slugs so every challenge has one clean,
 * URL-safe, unique slug (lowercase kebab). This makes slug-based routing and
 * UUID→slug canonical redirects safe (see the slug-canonicalization work).
 *
 * Handles two cases:
 *  1. NULL/blank slug  → generate a kebab slug from the title.
 *  2. Non-null but URL-UNSAFE slug (uppercase, underscores, etc., e.g. a raw
 *     catalog code "HP-AI-SAA-JO-823") → lowercase-normalize it in place. We do
 *     NOT regenerate these from their titles: several of those titles are
 *     truncated and role-framed ("Senior PM at GitHub..."), which we must never
 *     bake into a URL. The lowercased catalog code is short, stable and clean.
 *
 * Slugs are additive — ids never change. Dedupes against all existing slugs.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/backfill-slugs.ts --dry-run   # preview only
 *   npx tsx --env-file=.env.local scripts/backfill-slugs.ts             # apply
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DRY_RUN = process.argv.includes('--dry-run')

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const URL_SAFE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['’]/g, '')           // remove apostrophes
    .replace(/[^a-z0-9]+/g, '-')   // non-alphanumeric → hyphen
    .replace(/^-+|-+$/g, '')       // trim leading/trailing hyphens
    .replace(/-{2,}/g, '-')        // collapse repeated hyphens
    .slice(0, 80)                  // cap length
    .replace(/-+$/, '')            // re-trim if the cap landed on a hyphen
}

type Row = { id: string; title: string | null; slug: string | null }

async function fetchAll(select: string, applyFilter?: (q: ReturnType<typeof supabase.from>) => unknown): Promise<Row[]> {
  let rows: Row[] = []
  let from = 0
  const page = 1000
  for (;;) {
    let q = supabase.from('challenges').select(select).range(from, from + page - 1)
    if (applyFilter) q = applyFilter(q) as typeof q
    const { data, error } = await q
    if (error) throw new Error(error.message)
    rows = rows.concat((data ?? []) as unknown as Row[])
    if (!data || data.length < page) break
    from += page
  }
  return rows
}

async function main() {
  // Every existing slug (for dedupe). We'll mutate this set as we assign.
  const all = await fetchAll('id, title, slug')
  const usedSlugs = new Set<string>()
  for (const r of all) if (r.slug) usedSlugs.add(r.slug.toLowerCase())

  const needsSlug = all.filter(r => !r.slug || !String(r.slug).trim())
  const unsafe = all.filter(r => r.slug && !URL_SAFE.test(r.slug))

  console.log(`${needsSlug.length} need a slug (null/blank), ${unsafe.length} have a URL-unsafe slug to normalize.`)
  console.log(DRY_RUN ? '\n--- DRY RUN (no writes) ---\n' : '\n--- APPLYING ---\n')

  function assignUnique(base: string, currentLower?: string): string {
    // If this row already owns `base` (case-only change), free it first.
    if (currentLower) usedSlugs.delete(currentLower)
    let candidate = base
    let suffix = 2
    while (usedSlugs.has(candidate)) { candidate = `${base}-${suffix}`; suffix++ }
    usedSlugs.add(candidate)
    return candidate
  }

  let updated = 0, suffixed = 0, failed = 0
  const errors: string[] = []

  // 1. Null/blank → title-based slug
  for (const c of needsSlug) {
    const base = slugify(c.title ?? c.id)
    const slug = assignUnique(base)
    if (slug !== base) suffixed++
    if (DRY_RUN) { console.log(`  [null]  ${c.id}  →  ${slug}${slug !== base ? '  (suffixed)' : ''}`); updated++; continue }
    const { error } = await supabase.from('challenges').update({ slug }).eq('id', c.id)
    if (error) { failed++; errors.push(`${c.id}: ${error.message}`) } else updated++
  }

  // 2. Unsafe non-null → lowercase-normalize the existing slug (NOT the title)
  for (const c of unsafe) {
    const base = slugify(c.slug ?? '')
    const slug = assignUnique(base, c.slug?.toLowerCase())
    if (slug !== base) suffixed++
    if (DRY_RUN) { console.log(`  [unsafe] ${c.slug}  →  ${slug}${slug !== base ? '  (suffixed)' : ''}`); updated++; continue }
    const { error } = await supabase.from('challenges').update({ slug }).eq('id', c.id)
    if (error) { failed++; errors.push(`${c.id}: ${error.message}`) } else updated++
  }

  console.log(`\n${DRY_RUN ? 'Would update' : 'Updated'}: ${updated} | needed dedupe suffix: ${suffixed} | failed: ${failed}`)
  if (errors.length) { console.log('\nErrors:'); errors.slice(0, 20).forEach(e => console.log('  ✗ ' + e)) }
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
