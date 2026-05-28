import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  const id = process.argv[2]
  const { data, count } = await sb.from('stripe_events').select('id, type, received_at', { count: 'exact' }).eq('id', id)
  console.log(JSON.stringify({ id, count, rows: data }, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
