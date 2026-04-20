import { createClient } from '@supabase/supabase-js'

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await s
    .from('learn_chapters')
    .select('slug, body_mdx')
    .eq('slug', 'why-flow')
    .single()

  if (error) { console.error(error); process.exit(1) }
  console.log(`=== STORED BODY (${data.body_mdx.length} chars) ===`)
  console.log(data.body_mdx)
}

main()
