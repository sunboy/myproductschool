/**
 * smoke-interview-completion-e2e.ts
 *
 * Deterministic E2E for the live-interview / funnel-completion fixes recovered on
 * 2026-07-01. Verifies, WITHOUT burning Anthropic credit (uses the low-signal
 * debrief path) and WITHOUT voice/WebSockets:
 *
 *  1. Completion mechanic: POST /end on a real session flips it 'active' → 'completed'
 *     (the 224-stuck-active root cause — sessions that never reached /end stayed active).
 *  2. Idempotent double-end: a second /end returns alreadyCompleted, no double side effects.
 *  3. Server-side echo suppression (voice-turn): a USER turn that near-echoes a recent
 *     HATCH turn is dropped (echoSuppressed) and NOT persisted — the transcript-corruption fix.
 *  4. A genuine (non-echo) user turn IS persisted.
 *  5. Stale-session reaper: a >6h active session with no recent turn is reaped to 'abandoned';
 *     a >6h active session WITH a recent turn is SPARED (turn = liveness).
 *
 * Requires the dev server on http://localhost:3000 (E2E_BASE_URL to override) and
 * .env.local with service-role + anon keys.
 *
 * Run: npx tsx --env-file=.env.local scripts/smoke-interview-completion-e2e.ts
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'
const CRON_SECRET = process.env.CRON_SECRET

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

let passed = 0
let failed = 0
const cleanup: Array<() => Promise<void>> = []

function ok(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.error(`  ✗ ${name}`, detail !== undefined ? `— ${JSON.stringify(detail)}` : '')
  }
}

function projectRef(): string {
  return new URL(SUPABASE_URL!).host.split('.')[0]
}

async function createTestUser() {
  const id = crypto.randomUUID()
  const email = `smoke-iv-${id.slice(0, 8)}@test.hackproduct.dev`
  const password = 'Test1234!'
  const { data: authData, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { display_name: 'IV Smoke' },
  })
  if (error || !authData.user) throw new Error(`createTestUser: ${error?.message}`)
  const userId = authData.user.id
  await admin.from('profiles').upsert({
    id: userId, display_name: 'IV Smoke', plan: 'free',
    onboarding_completed_at: new Date().toISOString(),
  })
  const anon = createClient(SUPABASE_URL!, ANON_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: sess, error: sErr } = await anon.auth.signInWithPassword({ email, password })
  if (sErr || !sess.session) throw new Error(`signIn: ${sErr?.message}`)
  const sessionJson = JSON.stringify(sess.session)
  const CHUNK = 3180
  const name = `sb-${projectRef()}-auth-token`
  let cookieHeader: string
  if (sessionJson.length <= CHUNK) {
    cookieHeader = `${name}=${encodeURIComponent(sessionJson)}`
  } else {
    const chunks: string[] = []
    for (let i = 0; i * CHUNK < sessionJson.length; i++) chunks.push(sessionJson.slice(i * CHUNK, (i + 1) * CHUNK))
    cookieHeader = chunks.map((c, i) => `${name}.${i}=${encodeURIComponent(c)}`).join('; ')
  }
  cleanup.push(async () => { await admin.auth.admin.deleteUser(userId).catch(() => {}) })
  return { userId, cookieHeader }
}

// Insert a session row directly (service role) so we don't depend on /start's scenario
// selection or spend budget. Mirrors the columns /start writes that /end + reaper read.
async function insertSession(userId: string, opts: { createdAt?: string; status?: string } = {}) {
  const id = crypto.randomUUID()
  const ts = opts.createdAt ?? new Date().toISOString()
  // Populate columns that are NOT NULL in practice so the direct insert succeeds without
  // going through /start. Values are inert defaults; /end + reaper only read status,
  // user_id, created_at, started_at, and (for debrief shaping) calibration_snapshot.
  const { error } = await admin.from('live_interview_sessions').insert({
    id,
    user_id: userId,
    status: opts.status ?? 'active',
    started_at: ts,
    created_at: ts,
    role_id: 'swe',
    system_prompt: 'smoke-test session',
    calibration_snapshot: { archetype: 'Analyst', moveLevels: {} },
    flow_coverage: { frame: 0, list: 0, optimize: 0, win: 0 },
    total_turns: 0,
    conversation_memory: [],
    flow_coverage_credits: {},
  })
  if (error) throw new Error(`insertSession: ${error.message}`)
  cleanup.push(async () => {
    await admin.from('live_interview_turns').delete().eq('session_id', id)
    await admin.from('live_interview_sessions').delete().eq('id', id)
  })
  return id
}

async function insertTurn(sessionId: string, role: 'hatch' | 'user', content: string, turnIndex: number, createdAt?: string) {
  const { error } = await admin.from('live_interview_turns').insert({
    session_id: sessionId, role, content, turn_index: turnIndex,
    ...(createdAt ? { created_at: createdAt } : {}),
  })
  if (error) throw new Error(`insertTurn: ${error.message}`)
}

async function api(path: string, cookieHeader: string, body?: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: body !== undefined ? JSON.stringify(body) : JSON.stringify({}),
  })
  let json: unknown = null
  try { json = await res.json() } catch { /* empty */ }
  return { status: res.status, json: json as Record<string, unknown> | null }
}

async function main() {
  console.log(`\nInterview-completion E2E → ${BASE_URL}\n`)

  const { userId, cookieHeader } = await createTestUser()

  // ── 1 + 2. Completion mechanic + idempotent double-end ──────────────────────
  console.log('1) Completion mechanic (/end flips active → completed)')
  const s1 = await insertSession(userId)
  // Zero substantive user turns → low-signal debrief path (no AI credit, no ANTHROPIC key).
  const end1 = await api(`/api/live-interview/${s1}/end`, cookieHeader, {})
  ok('POST /end returns 200', end1.status === 200, end1)
  const { data: row1 } = await admin.from('live_interview_sessions').select('status, debrief_json').eq('id', s1).single()
  ok("session status is 'completed'", row1?.status === 'completed', row1?.status)
  ok('debrief_json was written', row1?.debrief_json != null)

  console.log('2) Idempotent double-end')
  const end2 = await api(`/api/live-interview/${s1}/end`, cookieHeader, {})
  ok('second /end returns 200', end2.status === 200, end2)
  ok('second /end reports alreadyCompleted', end2.json?.alreadyCompleted === true, end2.json)

  // ── 3 + 4. Server-side echo suppression on voice-turn ───────────────────────
  console.log('3) Server-side echo suppression (voice-turn)')
  const s2 = await insertSession(userId)
  const hatchLine = 'Walk me through how you would frame the core problem here before jumping to solutions.'
  // Persist a hatch turn first (turn 0).
  const hatchPost = await api(`/api/live-interview/${s2}/voice-turn`, cookieHeader, { role: 'hatch', content: hatchLine, turnIndex: 0 })
  ok('hatch turn persisted (200)', hatchPost.status === 200, hatchPost)
  // Now a near-echo of that hatch line arrives as a USER turn (mic caught the TTS).
  const echoText = 'walk me through how you would frame the core problem here before jumping to solutions'
  const echoPost = await api(`/api/live-interview/${s2}/voice-turn`, cookieHeader, { role: 'user', content: echoText, turnIndex: 1 })
  ok('echo user turn returns 200', echoPost.status === 200, echoPost)
  ok('echo was suppressed (echoSuppressed:true)', echoPost.json?.echoSuppressed === true, echoPost.json)
  const { data: turnsAfterEcho } = await admin.from('live_interview_turns').select('role, content').eq('session_id', s2)
  const userTurnsAfterEcho = (turnsAfterEcho ?? []).filter((t) => t.role === 'user')
  ok('echo NOT persisted as a user turn', userTurnsAfterEcho.length === 0, userTurnsAfterEcho)

  console.log('4) Genuine user turn is persisted')
  const realText = 'I would start by talking to the drivers who filed complaints and mapping where trust in the earnings breaks.'
  const realPost = await api(`/api/live-interview/${s2}/voice-turn`, cookieHeader, { role: 'user', content: realText, turnIndex: 1 })
  ok('real user turn returns 200', realPost.status === 200, realPost)
  ok('real user turn NOT flagged as echo', realPost.json?.echoSuppressed !== true, realPost.json)
  const { data: turnsAfterReal } = await admin.from('live_interview_turns').select('role, content').eq('session_id', s2)
  const userTurns = (turnsAfterReal ?? []).filter((t) => t.role === 'user')
  ok('genuine user turn persisted', userTurns.length === 1 && userTurns[0].content === realText, userTurns)

  // ── 5. Stale-session reaper ─────────────────────────────────────────────────
  console.log('5) Stale-session reaper')
  if (!CRON_SECRET) {
    console.log('   [skip] CRON_SECRET not set — cannot call the authed reaper endpoint')
  } else {
    const old = new Date(Date.now() - 8 * 3600 * 1000).toISOString() // 8h ago > 6h cutoff
    const staleNoTurn = await insertSession(userId, { createdAt: old, status: 'active' })
    const staleWithTurn = await insertSession(userId, { createdAt: old, status: 'active' })
    // The spared one has a turn created just now (after the 6h cutoff) → liveness.
    await insertTurn(staleWithTurn, 'user', 'still here, thinking', 0, new Date().toISOString())

    const reap = await fetch(`${BASE_URL}/api/cron/reap-stale-sessions`, {
      method: 'GET', headers: { authorization: `Bearer ${CRON_SECRET}` },
    })
    const reapJson = await reap.json().catch(() => null)
    ok('reaper returns 200 ok', reap.status === 200 && reapJson?.ok === true, reapJson)

    const { data: reapedRow } = await admin.from('live_interview_sessions').select('status').eq('id', staleNoTurn).single()
    ok("stale-no-turn session reaped → 'abandoned'", reapedRow?.status === 'abandoned', reapedRow?.status)

    const { data: sparedRow } = await admin.from('live_interview_sessions').select('status').eq('id', staleWithTurn).single()
    ok("stale-WITH-recent-turn session SPARED (still 'active')", sparedRow?.status === 'active', sparedRow?.status)
  }

  // ── teardown ────────────────────────────────────────────────────────────────
  console.log('\nCleaning up test rows…')
  for (const fn of cleanup.reverse()) {
    try { await fn() } catch (e) { console.warn('  [cleanup warn]', (e as Error).message) }
  }

  console.log(`\n${'─'.repeat(48)}`)
  console.log(`  PASSED: ${passed}   FAILED: ${failed}`)
  console.log(`${'─'.repeat(48)}\n`)
  process.exit(failed === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error('\nFATAL:', err)
  process.exit(1)
})
