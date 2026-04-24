import { createClient } from '@supabase/supabase-js'

const SLUGS = ['user-models','root-cause','product-debug','north-star','trade-offs','growth-loops','ai-products','product-sense']

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  for (const slug of SLUGS) {
    const { data: mod } = await s.from('learn_modules').select('id, name, tagline, difficulty').eq('slug', slug).single()
    if (!mod) { console.log(`[missing] ${slug}`); continue }
    const { data: chapters } = await s.from('learn_chapters')
      .select('slug, title, subtitle, hook_text')
      .eq('module_id', mod.id).order('sort_order')
    console.log(`\n=== ${slug}: ${mod.name} (${mod.difficulty}) ===`)
    console.log(`tagline: ${mod.tagline}`)
    for (const ch of chapters ?? []) {
      console.log(`  - ${ch.slug.padEnd(28)} "${ch.title}" | ${ch.subtitle || '(no subtitle)'}`)
    }
  }
}
main()
