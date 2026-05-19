#!/usr/bin/env npx ts-node --esm
// Usage: MODULE_SLUG=x CHAPTER_SLUG=y node upsert-chapter.ts < chapter.json
// Reads {hook_text, body_mdx} from stdin, upserts module + chapter to Supabase.
// All module metadata comes from catalog-manifest.json.

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const CONTENT_DIR = path.join(process.cwd(), 'scripts/content')
const MANIFEST_PATH = path.join(CONTENT_DIR, 'catalog-manifest.json')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function main() {
  const moduleSlug = process.env.MODULE_SLUG
  const chapterSlug = process.env.CHAPTER_SLUG
  if (!moduleSlug || !chapterSlug) {
    console.error('MODULE_SLUG and CHAPTER_SLUG env vars required')
    process.exit(1)
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
  const mod = manifest.find((m: { slug: string }) => m.slug === moduleSlug)
  if (!mod) { console.error(`Module not found: ${moduleSlug}`); process.exit(1) }

  const chapterIndex = mod.chapter_titles.map(slugify).indexOf(chapterSlug)
  if (chapterIndex === -1) { console.error(`Chapter not found: ${chapterSlug}`); process.exit(1) }

  const chapterFile = path.join(CONTENT_DIR, 'chapters', moduleSlug, `${chapterSlug}.mdx`)
  const chapter = JSON.parse(fs.readFileSync(chapterFile, 'utf-8'))

  // Upsert module first
  const { data: modData, error: modErr } = await supabase
    .from('learn_modules')
    .upsert({
      slug: mod.slug,
      name: mod.name,
      tagline: mod.tagline,
      track: mod.track,
      difficulty: mod.difficulty,
      est_minutes: mod.est_minutes,
      cover_color: mod.cover_color,
      accent_color: mod.accent_color,
      sort_order: mod.sort_order,
      chapter_count: mod.chapter_titles.length,
    }, { onConflict: 'slug' })
    .select('id')
    .single()
  if (modErr) { console.error(`Module upsert failed: ${modErr.message}`); process.exit(1) }

  const { error: chapErr } = await supabase
    .from('learn_chapters')
    .upsert({
      module_id: modData.id,
      slug: chapterSlug,
      title: mod.chapter_titles[chapterIndex],
      subtitle: mod.chapter_hooks[chapterIndex] ?? '',
      sort_order: chapterIndex + 1,
      hook_text: chapter.hook_text,
      body_mdx: chapter.body_mdx,
    }, { onConflict: 'module_id,slug' })
  if (chapErr) { console.error(`Chapter upsert failed: ${chapErr.message}`); process.exit(1) }

  console.log(`[upserted] ${moduleSlug}/${chapterSlug}`)
}

main().catch(err => { console.error(err); process.exit(1) })
