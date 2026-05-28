/**
 * Phase 3 — cancel subscription via the in-app API (matches what the Billing Portal does).
 * Then verify the cancel_at_period_end flag flips and the webhook event lands.
 * Then forcibly delete the subscription via stripe CLI and confirm downgrade.
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const APP_BASE = 'http://localhost:3000'

async function main() {
  const [, , email, password, action = 'cancel'] = process.argv
  if (!email || !password) {
    console.error('usage: phase3-cancel.ts <email> <password> [cancel|reactivate]')
    process.exit(1)
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: session } = await sb.auth.signInWithPassword({ email, password })
  if (!session.session) throw new Error('signIn')
  const ref = new URL(SUPABASE_URL).host.split('.')[0]
  const payload = JSON.stringify({
    access_token: session.session.access_token,
    refresh_token: session.session.refresh_token,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
  })
  const cookie = `sb-${ref}-auth-token=base64-${Buffer.from(payload).toString('base64')}`

  const res = await fetch(`${APP_BASE}/api/billing/subscription`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ action }),
  })
  const body = await res.json()
  console.log(JSON.stringify({ action, status: res.status, body }, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
