import { createClient } from '@supabase/supabase-js'

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const r = await s.from('learn_chapters').select('figures').limit(1)
  if (r.error) {
    console.log('MISSING:', r.error.message)
    process.exit(1)
  }
  console.log('EXISTS. sample value:', JSON.stringify(r.data?.[0]))
}

main()
