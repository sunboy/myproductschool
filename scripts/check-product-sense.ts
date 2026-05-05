import { createClient } from '@supabase/supabase-js'

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data: mod } = await s.from('learn_modules').select('id').eq('slug', 'product-sense').single()
  const { data: chapters } = await s.from('learn_chapters').select('sort_order, slug, title, body_mdx').eq('module_id', mod!.id).order('sort_order')
  for (const ch of chapters ?? []) {
    const body = ch.body_mdx ?? ''
    const figures = (body.match(/<figure>/g) ?? []).length
    const svgs = (body.match(/<svg /g) ?? []).length
    const emDashes = (body.match(/—/g) ?? []).length
    console.log(`${ch.sort_order}. ${ch.slug.padEnd(12)} ${String(body.length).padStart(5)} chars  ${figures} figure(s)  ${svgs} svg(s)  ${emDashes} em dash(es)  "${ch.title}"`)
  }
}
main()
