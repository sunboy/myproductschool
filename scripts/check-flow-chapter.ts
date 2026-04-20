import { createClient } from '@supabase/supabase-js'

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data } = await s.from('learn_chapters')
    .select('slug, title, body_mdx')
    .in('slug', ['why-flow','frame','list','optimize','win','seven-themes','engineer-to-product','using-flow-live'])
    .order('sort_order')
  for (const ch of data ?? []) {
    const figures = (ch.body_mdx.match(/<figure>/g) ?? []).length
    const emDashes = (ch.body_mdx.match(/—/g) ?? []).length
    console.log(`${ch.slug.padEnd(22)} ${String(ch.body_mdx.length).padStart(5)} chars  ${figures} figure(s)  ${emDashes} em dash(es)`)
  }
}
main()
