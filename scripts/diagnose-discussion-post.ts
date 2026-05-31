/**
 * Diagnose why posting a discussion returns a masked 500.
 *
 * The discussions POST route inserts via the service-role (admin) client, which
 * bypasses RLS but NOT schema integrity (type / FK / NOT NULL). The real
 * Postgres error is masked in prod, so this reproduces the insert directly and
 * prints the raw error code/message/details/hint.
 *
 * NON-DESTRUCTIVE: a successful insert creates a real, user-visible discussion,
 * so the inserted row is deleted in a finally block.
 *
 * Usage:
 *   ENV_PATH=.env.local npx tsx scripts/diagnose-discussion-post.ts <challengeIdOrSlug> <userId>
 *
 * Run with prod creds (ENV_PATH pointing at a prod env file) to diagnose prod.
 */
import { config as loadEnv } from 'dotenv'

const ENV_PATH = process.env.ENV_PATH ?? '.env.local'
loadEnv({ path: ENV_PATH })

import { createClient } from '@supabase/supabase-js'
import { resolveChallengeIdentity } from '../src/lib/challenges/resolve'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function main() {
  const [rawChallenge, userId] = process.argv.slice(2)
  if (!rawChallenge || !userId) {
    console.error('Usage: npx tsx scripts/diagnose-discussion-post.ts <challengeIdOrSlug> <userId>')
    process.exit(1)
  }
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error(`Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in ${ENV_PATH}`)
    process.exit(1)
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log(`env: ${ENV_PATH}`)
  console.log(`challenge param: ${rawChallenge}`)
  console.log(`user id: ${userId}`)
  console.log('---')

  // 1. Resolve the challenge identity the way the route does.
  let challengeId: string
  try {
    // resolveChallengeIdentity accepts an admin client; the import-time createAdminClient
    // default isn't used because we pass ours explicitly.
    const identity = await resolveChallengeIdentity(rawChallenge, admin as never)
    if (!identity) {
      console.error('resolveChallengeIdentity returned null — challenge not found by id/slug/number.')
      process.exit(1)
    }
    challengeId = identity.id
    console.log('resolved identity.id:', challengeId)
  } catch (err) {
    const e = err as { code?: string; message?: string; details?: string; hint?: string }
    console.error('resolveChallengeIdentity threw:', { code: e?.code, message: e?.message, details: e?.details, hint: e?.hint })
    process.exit(1)
  }

  // 2. Probe the challenge_discussions.challenge_id column type (best-effort).
  //    information_schema may not be reachable via PostgREST; ignore failures.
  const { data: colData, error: colErr } = await admin
    .from('information_schema.columns' as never)
    .select('column_name, data_type')
    .eq('table_name', 'challenge_discussions')
    .eq('column_name', 'challenge_id')
    .maybeSingle()
  if (colErr) {
    console.log('column-type probe unavailable via REST (expected):', colErr.code ?? colErr.message)
  } else {
    console.log('challenge_discussions.challenge_id type:', colData)
  }
  console.log('---')

  // 3. Reproduce the insert directly (so we can capture the row id for cleanup).
  let insertedId: string | null = null
  try {
    const { data, error } = await admin
      .from('challenge_discussions')
      .insert({ challenge_id: challengeId, user_id: userId, content: 'diagnostic test post (auto-deleted)' })
      .select('id')
      .single()

    if (error) {
      console.error('INSERT FAILED — this is the masked 500 cause:')
      console.error({ code: error.code, message: error.message, details: error.details, hint: error.hint })
      console.log('---')
      console.log('Interpretation:')
      console.log('  22P02  -> challenge_id type mismatch (migration 075 UUID->TEXT not applied on this DB)')
      console.log('  23503  -> FK violation (likely user_id has no matching profiles row)')
      console.log('  23502  -> NOT NULL violation (a required column is missing from the insert)')
      process.exit(1)
    }
    insertedId = data?.id ?? null
    console.log('INSERT SUCCEEDED. Inserted row id:', insertedId)
    console.log('(The insert path is healthy for this challenge + user. If the API still 500s,')
    console.log(' the cause is upstream of postDiscussion — check moderation or challenge resolution.)')
  } finally {
    // Non-destructive: remove the diagnostic row so it never appears to users.
    if (insertedId) {
      const { error: delErr } = await admin.from('challenge_discussions').delete().eq('id', insertedId)
      if (delErr) console.error('WARNING: failed to delete diagnostic row', insertedId, delErr.message)
      else console.log('Cleaned up diagnostic row:', insertedId)
    }
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
