/**
 * Quick read-back to confirm the stripe_events table exists post-migration.
 */
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
  const { count, error } = await sb
    .from('stripe_events')
    .select('id', { count: 'exact', head: true })
  console.log({ tableExists: !error, rowCount: count, error: error?.message ?? null })
}

main().catch((e) => { console.error(e); process.exit(1) })
