import { createClient } from '@supabase/supabase-js'

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false }}
  )
  const m = await s.from('learn_modules').select('*').eq('slug', 'product-sense').single()
  console.log('module:', JSON.stringify(m.data, null, 2))
  const ch = await s.from('learn_chapters').select('slug,title,subtitle,hook_text,sort_order').eq('module_id', m.data!.id).order('sort_order')
  for (const c of ch.data ?? []) console.log(c.sort_order, '|', c.slug, '|', c.title, '|', c.subtitle)
}
main()
