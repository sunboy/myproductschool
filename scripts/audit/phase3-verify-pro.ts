/**
 * Phase 3 verification — confirm subscription DB state + Pro unlock for an account.
 *
 * Usage:
 *   npx tsx scripts/audit/phase3-verify-pro.ts <email> <password>
 *
 * Checks:
 *   1. profiles.plan == 'pro' and pro_access == true
 *   2. subscriptions row exists with stripe_customer_id, stripe_subscription_id, status active or trialing
 *   3. Previously-gated /api/challenges/{id}/start now returns 200 (not 402)
 *   4. /api/live-interview/start now returns 200 (not 402)
 *   5. email_dedupes has a 'premium_signup_receipt' or similar row for this user
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const APP_BASE = 'http://localhost:3000'

async function main() {
  const [, , email, password] = process.argv
  if (!email || !password) {
    console.error('usage: phase3-verify-pro.ts <email> <password>')
    process.exit(1)
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: list } = await admin.auth.admin.listUsers()
  const user = list.users.find((u) => u.email === email)
  if (!user) throw new Error(`user not found: ${email}`)
  const userId = user.id

  // 1) profiles row
  const { data: profile } = await admin
    .from('profiles')
    .select('plan, pro_access, subscription_status, payment_failures, past_due_since')
    .eq('id', userId)
    .maybeSingle()

  // 2) subscriptions row
  const { data: sub } = await admin
    .from('subscriptions')
    .select('stripe_customer_id, stripe_subscription_id, plan, status, billing_interval, current_period_end, cancel_at_period_end, stripe_price_id')
    .eq('user_id', userId)
    .maybeSingle()

  // 5) email_dedupes
  const { data: emails } = await admin
    .from('email_dedupes')
    .select('dedupe_key, template, status, created_at')
    .ilike('dedupe_key', `%${userId}%`)
    .order('created_at', { ascending: false })
    .limit(10)

  // 3, 4) re-test gated endpoints
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: session } = await sb.auth.signInWithPassword({ email, password })
  if (!session.session) throw new Error('signIn failed')
  const ref = new URL(SUPABASE_URL).host.split('.')[0]
  const payload = JSON.stringify({
    access_token: session.session.access_token,
    refresh_token: session.session.refresh_token,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
  })
  const cookie = `sb-${ref}-auth-token=base64-${Buffer.from(payload).toString('base64')}`

  const { data: ch } = await admin.from('challenges').select('id').eq('is_published', true).limit(1).maybeSingle()

  const chStart = await fetch(`${APP_BASE}/api/challenges/${ch!.id}/start`, {
    method: 'POST', headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ role_id: 'swe' }),
  })
  const chBody = await chStart.json()

  const ivStart = await fetch(`${APP_BASE}/api/live-interview/start`, {
    method: 'POST', headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ roleId: 'PM' }),
  })
  const ivBody = await ivStart.json()

  console.log(JSON.stringify({
    userId, email, profile, subscription: sub,
    emailEvents: emails,
    challengeStartAfterSub: { status: chStart.status, body: chBody },
    interviewStartAfterSub: { status: ivStart.status, body: ivBody },
  }, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
