/**
 * Print profile.payment_failures + stripe_events row count for one user.
 * Used to verify idempotency replay didn't double-write.
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
  const eventId = process.argv[2]
  const { data: events } = await sb.from('stripe_events').select('id, type, received_at').order('received_at', { ascending: false }).limit(10)
  const { data: profile } = process.argv[3]
    ? await sb.from('profiles').select('id, plan, pro_access, subscription_status, payment_failures, past_due_since').eq('id', process.argv[3]).maybeSingle()
    : { data: null }
  console.log(JSON.stringify({ recentStripeEvents: events, eventIdLookup: eventId, profile }, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
