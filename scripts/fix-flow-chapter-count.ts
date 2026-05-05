// scripts/fix-flow-chapter-count.ts
//
// The learn_modules row for 'flow' has chapter_count=15 because earlier seeds
// inserted extra rows that did not get cleaned up. Rebuild the count from the
// actual learn_chapters rows.

import { createClient } from '@supabase/supabase-js'

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: mod } = await s.from('learn_modules').select('id, chapter_count').eq('slug', 'flow').single()
  if (!mod) { console.error('flow module not found'); process.exit(1) }

  const { data: chapters } = await s.from('learn_chapters')
    .select('slug, body_mdx, sort_order')
    .eq('module_id', mod.id)
    .order('sort_order')

  const valid = (chapters ?? []).filter(c => (c.body_mdx?.length ?? 0) > 500)
  const stubs = (chapters ?? []).filter(c => (c.body_mdx?.length ?? 0) <= 500)

  console.log(`FLOW has ${chapters?.length ?? 0} chapter rows: ${valid.length} full, ${stubs.length} short/stub`)
  console.log('Valid:', valid.map(c => c.slug).join(', '))
  if (stubs.length) console.log('Stubs to delete:', stubs.map(c => c.slug).join(', '))

  if (stubs.length > 0) {
    const { error } = await s.from('learn_chapters')
      .delete()
      .eq('module_id', mod.id)
      .in('slug', stubs.map(c => c.slug))
    if (error) { console.error(error); process.exit(1) }
    console.log(`Deleted ${stubs.length} stub rows`)
  }

  // Update module chapter_count
  const finalCount = valid.length
  const { error: updErr } = await s.from('learn_modules')
    .update({ chapter_count: finalCount, est_minutes: finalCount * 10 })
    .eq('id', mod.id)
  if (updErr) { console.error(updErr); process.exit(1) }
  console.log(`Set flow.chapter_count = ${finalCount}, est_minutes = ${finalCount * 10}`)
}

main()
