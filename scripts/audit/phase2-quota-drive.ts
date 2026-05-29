/**
 * Phase 2 — Quota validation for Account A.
 *
 * Strategy:
 *  - Sign in as Account A via supabase-js to obtain { access_token, refresh_token }.
 *  - Forge the `sb-<project-ref>-auth-token` cookie that @supabase/ssr reads on the server.
 *  - Hit /api/challenges/{id}/start 3x (free quota=3) and confirm the 4th returns 402.
 *  - Hit /api/live-interview/start once (free quota=1) and confirm the 2nd returns 402.
 *  - Print every response body so the audit doc can show exact wire shape.
 *
 * Usage:
 *   npx tsx scripts/audit/phase2-quota-drive.ts <email> <password>
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const APP_BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

function projectRef(): string {
  // https://<ref>.supabase.co -> <ref>
  return new URL(SUPABASE_URL).host.split('.')[0]
}

function buildSupabaseCookie(session: { access_token: string; refresh_token: string }): string {
  const ref = projectRef()
  // @supabase/ssr stores the session as a base64-encoded JSON tuple in `sb-<ref>-auth-token`.
  // Format used by createServerClient when setAll is invoked: base64-<base64(JSON)>
  // We mirror that here so the server-side createClient() reads our session.
  const payload = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
  })
  const b64 = Buffer.from(payload).toString('base64')
  return `sb-${ref}-auth-token=base64-${b64}`
}

async function signIn(email: string, password: string) {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error || !data.session) {
    throw new Error(`signIn failed: ${error?.message}`)
  }
  return data.session
}

async function getPublishedChallengeId(): Promise<string> {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await admin
    .from('challenges')
    .select('id, slug, title')
    .eq('is_published', true)
    .limit(1)
    .maybeSingle()
  if (error || !data) throw new Error(`no published challenge: ${error?.message}`)
  console.error(`[seed] using challenge ${data.slug} (${data.id})`)
  return data.id as string
}

interface CallResult {
  step: string
  status: number
  body: unknown
}

async function callApi(
  path: string,
  cookie: string,
  body: Record<string, unknown>,
  step: string
): Promise<CallResult> {
  const url = `${APP_BASE}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie,
    },
    body: JSON.stringify(body),
  })
  let parsed: unknown
  try {
    parsed = await res.json()
  } catch {
    parsed = await res.text()
  }
  return { step, status: res.status, body: parsed }
}

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]
  if (!email || !password) {
    console.error('usage: phase2-quota-drive.ts <email> <password>')
    process.exit(1)
  }

  console.error(`[phase2] signing in as ${email}`)
  const session = await signIn(email, password)
  const cookie = buildSupabaseCookie(session)
  console.error(`[phase2] session acquired, user id: ${session.user.id}`)

  const challengeId = await getPublishedChallengeId()
  const results: CallResult[] = []

  // ---- Challenges quota (free=3) ----
  console.error('\n[phase2] === CHALLENGES quota (free=3) ===')
  for (let i = 1; i <= 4; i++) {
    const r = await callApi(
      `/api/challenges/${challengeId}/start`,
      cookie,
      { role_id: 'swe' },
      `challenges_start_attempt_${i}`,
    )
    console.error(`  attempt ${i}: status=${r.status}`)
    results.push(r)
    // Subsequent calls would resume the existing in_progress attempt, not create a new one.
    // To force a fresh attempt that consumes quota, complete the existing attempt between calls.
    if (r.status === 200 && i < 4) {
      const attemptId = (r.body as { attempt?: { id?: string } })?.attempt?.id
      if (attemptId) {
        const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
        await admin
          .from('challenge_attempts')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', attemptId)
      }
    }
  }

  // ---- Interviews quota (free=1) ----
  console.error('\n[phase2] === INTERVIEWS quota (free=1) ===')
  for (let i = 1; i <= 2; i++) {
    const r = await callApi(
      `/api/live-interview/start`,
      cookie,
      { roleId: 'PM' },
      `interview_start_attempt_${i}`,
    )
    console.error(`  attempt ${i}: status=${r.status}`)
    results.push(r)
  }

  console.log(JSON.stringify({ userId: session.user.id, email, results }, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
