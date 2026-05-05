import { createClient } from '@supabase/supabase-js'

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data: mods } = await s.from('learn_modules')
    .select('slug, name, tagline, difficulty, chapter_count, est_minutes, sort_order')
    .order('sort_order')
  console.log(`=== ${mods?.length ?? 0} modules ===`)
  for (const m of mods ?? []) {
    const { data: chapters } = await s.from('learn_chapters')
      .select('slug, title, body_mdx')
      .eq('module_id', (await s.from('learn_modules').select('id').eq('slug', m.slug).single()).data!.id)
      .order('sort_order')
    const totalChars = (chapters ?? []).reduce((n, c) => n + (c.body_mdx?.length ?? 0), 0)
    const draftCount = (chapters ?? []).filter(c => (c.body_mdx?.length ?? 0) < 200).length
    console.log(`${m.sort_order}. ${m.slug.padEnd(24)} "${m.name}"  ${m.difficulty}  ${chapters?.length ?? 0} ch  ${totalChars} chars total  (${draftCount} stub)`)
  }
}
main()
