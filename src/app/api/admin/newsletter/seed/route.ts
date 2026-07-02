import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

// One-shot audience seed for The HackProduct Letter: materializes
// newsletter_subscribers from users (opt-out) + leads (opt-out). Re-runnable
// (on conflict do nothing on email_norm — user rows never overwrite an
// existing subscriber, so re-running after a real seed is a safe no-op).
//
// dryRun DEFAULTS TRUE. Pass ?dryRun=0 to actually write rows — this is the
// one-shot "earn trust" gate the plan calls for: founders review the counts
// before the real seed runs.
//
// Exclusions:
//  - Users with an explicit notification_prefs.marketing = false row (the
//    live DB default is 0 rows / marketing defaults false in schema, but the
//    PLAN requires "exclude only explicit false", not "require true" — so we
//    only skip user_ids that show up in notification_prefs with marketing
//    literally false).
//  - Any @hackproduct.com test/QA address (e2e+, paywall-audit, etc.).
//    NOTE: this is intentionally NOT the same gate as isInternalUser() in
//    src/lib/posthog/internal.ts — that helper also flags the founder's own
//    gmail as internal (for PostHog hygiene), but the founder's gmail IS
//    included in this audience.
//  - Leads with leads.unsubscribed_at set.
//
// source='user' wins over source='lead' on conflict (on conflict do nothing
// after users are inserted first).

const TEST_DOMAIN_RE = /@hackproduct\.com$/i
const USERS_PAGE_SIZE = 1000

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`)
}

function isTestAccount(email: string | null | undefined) {
  if (!email) return false
  return TEST_DOMAIN_RE.test(email.trim().toLowerCase())
}

interface CandidateUser {
  id: string
  email: string
}

async function collectCandidateUsers(admin: SupabaseClient) {
  const users: CandidateUser[] = []
  let page = 1
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: USERS_PAGE_SIZE })
    if (error) throw new Error(`listUsers failed: ${error.message}`)
    for (const user of data.users) {
      if (!user.email) continue
      if (isTestAccount(user.email)) continue
      users.push({ id: user.id, email: user.email })
    }
    if (data.users.length < USERS_PAGE_SIZE) break
    page += 1
  }
  return users
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized()

  const dryRunParam = request.nextUrl.searchParams.get('dryRun')
  // Default TRUE: any value other than exactly "0" keeps this a dry run.
  const dryRun = dryRunParam !== '0'

  const admin = createAdminClient()

  const candidateUsers = await collectCandidateUsers(admin)
  const userIds = candidateUsers.map(u => u.id)

  const [marketingOptOutResult, profilesResult, leadsResult] = await Promise.all([
    userIds.length > 0
      ? admin
          .from('notification_prefs')
          .select('user_id, marketing')
          .eq('marketing', false)
          .in('user_id', userIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length > 0
      ? admin
          .from('profiles')
          .select('id, display_name')
          .in('id', userIds)
      : Promise.resolve({ data: [], error: null }),
    admin
      .from('leads')
      .select('email, name')
      .is('unsubscribed_at', null),
  ])

  if (marketingOptOutResult.error) {
    return NextResponse.json({ error: 'Could not load notification preferences.' }, { status: 500 })
  }
  if (profilesResult.error) {
    return NextResponse.json({ error: 'Could not load profiles.' }, { status: 500 })
  }
  if (leadsResult.error) {
    return NextResponse.json({ error: 'Could not load leads.' }, { status: 500 })
  }

  const optedOutUserIds = new Set(
    ((marketingOptOutResult.data ?? []) as { user_id: string }[]).map(row => row.user_id)
  )
  const displayNameByUserId = new Map(
    ((profilesResult.data ?? []) as { id: string; display_name: string | null }[]).map(row => [
      row.id,
      row.display_name,
    ])
  )

  const eligibleUsers = candidateUsers.filter(u => !optedOutUserIds.has(u.id))

  // Distinct leads by lowercased email (not-unsubscribed), excluding any that
  // match a real registered user's email (user source wins).
  const userEmailSet = new Set(candidateUsers.map(u => u.email.trim().toLowerCase()))
  const leadByEmail = new Map<string, { email: string; name: string | null }>()
  for (const lead of (leadsResult.data ?? []) as { email: string; name: string | null }[]) {
    if (!lead.email) continue
    const normalized = lead.email.trim().toLowerCase()
    if (isTestAccount(normalized)) continue
    if (userEmailSet.has(normalized)) continue
    if (!leadByEmail.has(normalized)) leadByEmail.set(normalized, { email: lead.email, name: lead.name })
  }
  const eligibleLeads = Array.from(leadByEmail.values())

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      wouldInsert: {
        users: eligibleUsers.length,
        leads: eligibleLeads.length,
        total: eligibleUsers.length + eligibleLeads.length,
      },
      excluded: {
        testAccounts: candidateUsers.length === 0 ? 0 : undefined,
        marketingOptOut: optedOutUserIds.size,
      },
    })
  }

  const now = new Date().toISOString()

  // Users first — source='user' wins on conflict because leads insert next
  // with on conflict do nothing.
  const userRows = eligibleUsers.map(user => ({
    email: user.email,
    email_norm: user.email.trim().toLowerCase(),
    name: displayNameByUserId.get(user.id) ?? null,
    source: 'user' as const,
    user_id: user.id,
    status: 'subscribed' as const,
    confirmed_at: now,
  }))

  let usersInserted = 0
  const USER_CHUNK = 500
  for (let i = 0; i < userRows.length; i += USER_CHUNK) {
    const chunk = userRows.slice(i, i + USER_CHUNK)
    if (chunk.length === 0) continue
    const { data, error } = await admin
      .from('newsletter_subscribers')
      .upsert(chunk, { onConflict: 'email_norm', ignoreDuplicates: true })
      .select('id')
    if (error) {
      return NextResponse.json({ error: `Failed inserting user subscribers: ${error.message}` }, { status: 500 })
    }
    usersInserted += data?.length ?? 0
  }

  const leadRows = eligibleLeads.map(lead => ({
    email: lead.email,
    email_norm: lead.email.trim().toLowerCase(),
    name: lead.name,
    source: 'lead' as const,
    status: 'subscribed' as const,
    confirmed_at: now,
  }))

  let leadsInserted = 0
  const LEAD_CHUNK = 500
  for (let i = 0; i < leadRows.length; i += LEAD_CHUNK) {
    const chunk = leadRows.slice(i, i + LEAD_CHUNK)
    if (chunk.length === 0) continue
    const { data, error } = await admin
      .from('newsletter_subscribers')
      .upsert(chunk, { onConflict: 'email_norm', ignoreDuplicates: true })
      .select('id')
    if (error) {
      return NextResponse.json({ error: `Failed inserting lead subscribers: ${error.message}` }, { status: 500 })
    }
    leadsInserted += data?.length ?? 0
  }

  return NextResponse.json({
    dryRun: false,
    inserted: {
      users: usersInserted,
      leads: leadsInserted,
      total: usersInserted + leadsInserted,
    },
  })
}
