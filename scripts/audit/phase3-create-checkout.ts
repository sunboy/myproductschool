/**
 * Phase 3 — Create a Stripe Checkout session for a test account and print the URL.
 * Then a Playwright run fills in card 4242... etc.
 *
 * Usage:
 *   npx tsx scripts/audit/phase3-create-checkout.ts <email> <password> <monthly|annual>
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const APP_BASE = 'http://localhost:3000'

async function main() {
  const [, , email, password, plan] = process.argv
  if (!email || !password || !plan) {
    console.error('usage: phase3-create-checkout.ts <email> <password> <monthly|annual>')
    process.exit(1)
  }
  if (plan !== 'monthly' && plan !== 'annual') {
    console.error('plan must be monthly or annual')
    process.exit(1)
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: session, error } = await sb.auth.signInWithPassword({ email, password })
  if (error || !session.session) throw new Error(`signIn: ${error?.message}`)

  const ref = new URL(SUPABASE_URL).host.split('.')[0]
  const payload = JSON.stringify({
    access_token: session.session.access_token,
    refresh_token: session.session.refresh_token,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
  })
  const cookie = `sb-${ref}-auth-token=base64-${Buffer.from(payload).toString('base64')}`

  const res = await fetch(`${APP_BASE}/api/stripe/create-checkout`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ plan }),
  })
  const body = await res.json()
  console.log(JSON.stringify({ status: res.status, plan, userId: session.session.user.id, body }, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
