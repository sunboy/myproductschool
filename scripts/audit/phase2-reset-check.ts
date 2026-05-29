/**
 * Phase 2.5 — Reset behavior check.
 * Backdates one usage_events row for Account A to >30 days ago and confirms quota frees up.
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
  const email = process.argv[2]
  const password = process.argv[3]
  if (!email || !password) {
    console.error('usage: phase2-reset-check.ts <email> <password>')
    process.exit(1)
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Find Account A's user id
  const { data: authData } = await admin.auth.admin.listUsers()
  const user = authData.users.find((u) => u.email === email)
  if (!user) throw new Error(`user not found: ${email}`)
  console.error(`[reset] user ${user.id}`)

  // Inspect current usage_events for challenges feature
  const { data: before } = await admin
    .from('usage_events')
    .select('id, feature, created_at')
    .eq('user_id', user.id)
    .eq('feature', 'challenges')
    .order('created_at', { ascending: true })
  console.error(`[reset] usage_events before: ${before?.length ?? 0}`)
  console.error(before?.map((r) => `  ${r.id} ${r.feature} ${r.created_at}`).join('\n'))

  if (!before || before.length === 0) {
    throw new Error('no usage_events to backdate')
  }

  // Backdate the OLDEST event by 31 days so quota frees up by 1
  const backDate = new Date(Date.now() - 31 * 86400 * 1000).toISOString()
  const { error: updErr } = await admin
    .from('usage_events')
    .update({ created_at: backDate })
    .eq('id', before[0].id)
  if (updErr) throw new Error(`update: ${updErr.message}`)
  console.error(`[reset] backdated ${before[0].id} to ${backDate}`)

  // Now sign in and call the gated endpoint
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: session } = await sb.auth.signInWithPassword({ email, password })
  if (!session.session) throw new Error('no session')

  const ref = new URL(SUPABASE_URL).host.split('.')[0]
  const payload = JSON.stringify({
    access_token: session.session.access_token,
    refresh_token: session.session.refresh_token,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
  })
  const cookie = `sb-${ref}-auth-token=base64-${Buffer.from(payload).toString('base64')}`

  const { data: ch } = await admin
    .from('challenges').select('id').eq('is_published', true).limit(1).maybeSingle()
  const res = await fetch(`${APP_BASE}/api/challenges/${ch!.id}/start`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ role_id: 'swe' }),
  })
  const body = await res.json()
  console.log(JSON.stringify({ resetCheck: { status: res.status, body } }, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
