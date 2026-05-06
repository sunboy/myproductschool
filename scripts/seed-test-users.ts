import { loadEnvConfig } from '@next/env'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { STRIPE_API_VERSION } from '../src/lib/stripe/config'

loadEnvConfig(process.cwd())

type Plan = 'free' | 'pro'
type SubscriptionStatus = 'active' | 'trialing'
type AiCounterFeature =
  | 'hatch_chat_msgs'
  | 'hatch_nudges'
  | 'hatch_canvas_interprets'
  | 'simulation_turns'
  | 'live_interview_turns'
  | 'quick_takes'
  | 'ai_grading_runs'

interface Persona {
  key: string
  email: string
  displayName: string
  plan: Plan
  role: 'user' | 'admin'
  onboarded: boolean
  completedChallenges: number
  streakDays: number
  xpTotal: number
  capped?: boolean
  subscriptionStatus?: SubscriptionStatus
}

interface StripeFixture {
  customerId: string
  subscriptionId: string
  priceId: string
  status: SubscriptionStatus
  currentPeriodEnd: string
  billingInterval: 'month' | 'year'
}

const SCRIPT_NAME = 'scripts/seed-test-users.ts'
const TEST_EMAIL_RE = /^e2e\+[^@]+@hackproduct\.com$/i
const args = new Set(process.argv.slice(2))
const showHelp = args.has('--help') || args.has('-h')
const dryRun = args.has('--dry-run')
const withStripe = args.has('--with-stripe')

if (showHelp) {
  console.log(`Usage: npx tsx scripts/seed-test-users.ts [--dry-run] [--with-stripe]

Creates fixed e2e users for paywall and launch QA.

Required env:
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  E2E_TEST_PASSWORD

Optional Stripe test mode:
  STRIPE_TEST_SECRET_KEY
  STRIPE_TEST_PRICE_MONTHLY`)
  process.exit(0)
}

const PERSONAS: Persona[] = [
  {
    key: 'free-new',
    email: 'e2e+free-new@hackproduct.com',
    displayName: 'E2E Free New',
    plan: 'free',
    role: 'user',
    onboarded: false,
    completedChallenges: 0,
    streakDays: 0,
    xpTotal: 0,
  },
  {
    key: 'free-active',
    email: 'e2e+free-active@hackproduct.com',
    displayName: 'E2E Free Active',
    plan: 'free',
    role: 'user',
    onboarded: true,
    completedChallenges: 2,
    streakDays: 2,
    xpTotal: 240,
  },
  {
    key: 'free-capped',
    email: 'e2e+free-capped@hackproduct.com',
    displayName: 'E2E Free Capped',
    plan: 'free',
    role: 'user',
    onboarded: true,
    completedChallenges: 1,
    streakDays: 1,
    xpTotal: 120,
    capped: true,
  },
  {
    key: 'pro-new',
    email: 'e2e+pro-new@hackproduct.com',
    displayName: 'E2E Pro New',
    plan: 'pro',
    role: 'user',
    onboarded: true,
    completedChallenges: 0,
    streakDays: 0,
    xpTotal: 0,
    subscriptionStatus: 'trialing',
  },
  {
    key: 'pro-active',
    email: 'e2e+pro-active@hackproduct.com',
    displayName: 'E2E Pro Active',
    plan: 'pro',
    role: 'user',
    onboarded: true,
    completedChallenges: 10,
    streakDays: 8,
    xpTotal: 1650,
    subscriptionStatus: 'active',
  },
  {
    key: 'admin',
    email: 'e2e+admin@hackproduct.com',
    displayName: 'E2E Admin',
    plan: 'pro',
    role: 'admin',
    onboarded: true,
    completedChallenges: 0,
    streakDays: 0,
    xpTotal: 0,
    subscriptionStatus: 'active',
  },
]

const FALLBACK_AI_LIMITS: Record<AiCounterFeature, number> = {
  hatch_chat_msgs: 50,
  hatch_nudges: 25,
  hatch_canvas_interprets: 20,
  simulation_turns: 40,
  live_interview_turns: 80,
  quick_takes: 30,
  ai_grading_runs: 30,
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function validatePassword(): string {
  const password = requiredEnv('E2E_TEST_PASSWORD')
  if (password.length < 10) {
    throw new Error('E2E_TEST_PASSWORD must be at least 10 characters long.')
  }
  return password
}

function createAdminClient(): SupabaseClient {
  return createClient(
    requiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

function currentMonthStart(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10)
}

function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function dateDaysAgo(days: number): string {
  return isoDaysAgo(days).slice(0, 10)
}

function dateDaysFromNow(days: number): string {
  return isoDaysFromNow(days).slice(0, 10)
}

function stripeSafeKey(key: string): string {
  return key.replace(/[^a-z0-9_]+/gi, '_')
}

async function listExistingTestUsers(admin: SupabaseClient) {
  const matches: Array<{ id: string; email: string }> = []
  let page = 1
  const perPage = 1000

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(`Failed to list auth users: ${error.message}`)

    for (const user of data.users) {
      if (user.email && TEST_EMAIL_RE.test(user.email)) {
        matches.push({ id: user.id, email: user.email })
      }
    }

    if (!data.nextPage || data.users.length === 0) break
    page = data.nextPage
  }

  return matches
}

async function cleanupExistingUsers(admin: SupabaseClient) {
  const users = await listExistingTestUsers(admin)
  if (users.length === 0) {
    console.log('No existing e2e auth users found.')
    return
  }

  console.log(`Deleting ${users.length} existing e2e auth user(s).`)
  if (dryRun) return

  for (const user of users) {
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) throw new Error(`Failed to delete ${user.email}: ${error.message}`)
  }
}

function getStripeTestSecretKey(): string {
  const key = process.env.STRIPE_TEST_SECRET_KEY?.trim()
    ?? (process.env.STRIPE_SECRET_KEY?.trim().startsWith('sk_test_')
      || process.env.STRIPE_SECRET_KEY?.trim().startsWith('rk_test_')
      ? process.env.STRIPE_SECRET_KEY.trim()
      : null)

  if (!key || (!key.startsWith('sk_test_') && !key.startsWith('rk_test_'))) {
    throw new Error('Set STRIPE_TEST_SECRET_KEY=sk_test_... to use --with-stripe.')
  }

  return key
}

function getStripeTestPriceId(): string {
  const explicitTestPrice = process.env.STRIPE_TEST_PRICE_MONTHLY?.trim()
  if (explicitTestPrice) return explicitTestPrice

  const activePrice = process.env.STRIPE_PRICE_MONTHLY?.trim()
  if (activePrice && process.env.STRIPE_SECRET_KEY?.trim().startsWith('sk_test_')) {
    return activePrice
  }

  throw new Error(
    'Set STRIPE_TEST_PRICE_MONTHLY=price_... to use --with-stripe. Run npm run stripe:test-flow if you need a test price.'
  )
}

function createStripeClient(): Stripe | null {
  if (!withStripe) return null
  return new Stripe(getStripeTestSecretKey(), { apiVersion: STRIPE_API_VERSION })
}

async function cleanupStripeFixtures(stripe: Stripe | null) {
  if (!stripe) return

  console.log('Cleaning matching Stripe test customers.')
  if (dryRun) return

  for (const persona of PERSONAS) {
    const customers = await stripe.customers.list({ email: persona.email, limit: 100 })
    for (const customer of customers.data) {
      const managedByThisScript = customer.metadata?.managed_by === SCRIPT_NAME
      if (!managedByThisScript && !TEST_EMAIL_RE.test(customer.email ?? '')) continue

      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'all',
        limit: 100,
      })

      for (const subscription of subscriptions.data) {
        if (subscription.status !== 'canceled') {
          await stripe.subscriptions.cancel(subscription.id)
        }
      }

      await stripe.customers.del(customer.id)
    }
  }
}

async function createStripeFixture(
  stripe: Stripe | null,
  persona: Persona,
  userId: string
): Promise<StripeFixture> {
  const status = persona.subscriptionStatus ?? 'active'
  const fallbackDays = status === 'trialing' ? 7 : 30

  if (!stripe) {
    const key = stripeSafeKey(persona.key)
    return {
      customerId: `cus_e2e_${key}`,
      subscriptionId: `sub_e2e_${key}`,
      priceId: process.env.STRIPE_TEST_PRICE_MONTHLY?.trim() ?? 'price_e2e_test_monthly',
      status,
      currentPeriodEnd: isoDaysFromNow(fallbackDays),
      billingInterval: 'month',
    }
  }

  const priceId = getStripeTestPriceId()
  const customer = await stripe.customers.create({
    email: persona.email,
    name: persona.displayName,
    source: 'tok_visa',
    metadata: {
      app: 'hackproduct',
      managed_by: SCRIPT_NAME,
      persona: persona.key,
      user_id: userId,
    },
  })

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    trial_period_days: status === 'trialing' ? 7 : undefined,
    metadata: {
      app: 'hackproduct',
      managed_by: SCRIPT_NAME,
      persona: persona.key,
      user_id: userId,
    },
  })

  const item = subscription.items.data[0]
  const interval = item?.price.recurring?.interval === 'year' ? 'year' : 'month'
  const periodEnd = item?.current_period_end

  return {
    customerId: customer.id,
    subscriptionId: subscription.id,
    priceId,
    status: subscription.status === 'trialing' ? 'trialing' : 'active',
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : isoDaysFromNow(fallbackDays),
    billingInterval: interval,
  }
}

async function fetchChallengeIds(admin: SupabaseClient, needed: number): Promise<string[]> {
  if (needed === 0) return []

  const { data, error } = await admin
    .from('challenges')
    .select('id')
    .eq('is_published', true)
    .neq('challenge_type', 'quick_take')
    .order('created_at', { ascending: true })
    .limit(needed)

  if (error) throw new Error(`Failed to load published challenges: ${error.message}`)

  const ids = (data ?? [])
    .map(row => String((row as { id?: unknown }).id ?? ''))
    .filter(Boolean)

  if (ids.length < needed) {
    throw new Error(`Need ${needed} published non-quick-take challenges, found ${ids.length}. Seed content first.`)
  }

  return ids
}

async function fetchFreeAiLimit(admin: SupabaseClient, feature: AiCounterFeature): Promise<number> {
  const { data } = await admin
    .from('plan_limits')
    .select('limit_value')
    .eq('plan', 'free')
    .eq('feature', feature)
    .maybeSingle()

  const limit = Number((data as { limit_value?: unknown } | null)?.limit_value)
  return Number.isInteger(limit) && limit >= 0 ? limit : FALLBACK_AI_LIMITS[feature]
}

async function seedProfile(admin: SupabaseClient, persona: Persona, userId: string) {
  const timestamp = new Date().toISOString()
  const calibrationScores = persona.onboarded
    ? { frame: 62, list: 58, optimize: 54, win: 50 }
    : {}

  const { error } = await admin.from('profiles').upsert({
    id: userId,
    display_name: persona.displayName,
    avatar_url: null,
    plan: persona.plan,
    role: persona.role,
    streak_days: persona.streakDays,
    xp_total: persona.xpTotal,
    onboarding_completed_at: persona.onboarded ? timestamp : null,
    preferred_role: persona.onboarded ? 'swe' : null,
    archetype: persona.onboarded ? 'systems_builder' : null,
    archetype_description: persona.onboarded ? 'Practices product judgment with an engineering lens.' : null,
    streak_shield_count: 0,
    role_context: persona.onboarded ? 'Software engineer preparing for product and systems interviews.' : null,
    calibration_scores: calibrationScores,
    weakness_move: persona.onboarded ? 'win' : null,
    has_seen_hatch_intro: persona.onboarded,
    interview_date: persona.onboarded ? dateDaysFromNow(21) : null,
    updated_at: timestamp,
  }, { onConflict: 'id' })

  if (error) throw new Error(`Failed to seed profile for ${persona.email}: ${error.message}`)
}

async function seedSubscription(
  admin: SupabaseClient,
  stripe: Stripe | null,
  persona: Persona,
  userId: string
) {
  const timestamp = new Date().toISOString()

  if (persona.plan === 'free') {
    const { error } = await admin.from('subscriptions').upsert({
      user_id: userId,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      stripe_price_id: null,
      billing_interval: null,
      plan: 'free',
      status: 'active',
      current_period_end: null,
      cancel_at_period_end: false,
      cancel_at: null,
      canceled_at: null,
      updated_at: timestamp,
    }, { onConflict: 'user_id' })

    if (error) throw new Error(`Failed to seed free subscription for ${persona.email}: ${error.message}`)
    return
  }

  const stripeFixture = await createStripeFixture(stripe, persona, userId)

  const { error } = await admin.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: stripeFixture.customerId,
    stripe_subscription_id: stripeFixture.subscriptionId,
    stripe_price_id: stripeFixture.priceId,
    billing_interval: stripeFixture.billingInterval,
    plan: 'pro',
    status: stripeFixture.status,
    current_period_end: stripeFixture.currentPeriodEnd,
    cancel_at_period_end: false,
    cancel_at: null,
    canceled_at: null,
    updated_at: timestamp,
  }, { onConflict: 'user_id' })

  if (error) throw new Error(`Failed to seed pro subscription for ${persona.email}: ${error.message}`)
}

async function seedMoveLevels(admin: SupabaseClient, persona: Persona, userId: string) {
  const baseXp = Math.max(persona.xpTotal, persona.completedChallenges * 80)
  const rows = [
    { move: 'frame', pct: 0.30 },
    { move: 'list', pct: 0.25 },
    { move: 'optimize', pct: 0.25 },
    { move: 'win', pct: 0.20 },
  ].map(({ move, pct }) => {
    const xp = Math.round(baseXp * pct)
    return {
      user_id: userId,
      move,
      xp,
      level: Math.max(1, Math.floor(xp / 100) + 1),
      progress_pct: xp % 100,
      updated_at: new Date().toISOString(),
    }
  })

  const { error } = await admin.from('move_levels').upsert(rows, { onConflict: 'user_id,move' })
  if (error) throw new Error(`Failed to seed move levels for ${persona.email}: ${error.message}`)
}

async function seedStreak(admin: SupabaseClient, persona: Persona, userId: string) {
  if (persona.streakDays === 0) return

  const rows = Array.from({ length: persona.streakDays }, (_, index) => ({
    user_id: userId,
    date: dateDaysAgo(index),
    completed: true,
  }))

  const { error } = await admin.from('user_streaks').upsert(rows, { onConflict: 'user_id,date' })
  if (error) throw new Error(`Failed to seed streak for ${persona.email}: ${error.message}`)
}

async function seedChallengeAttempts(
  admin: SupabaseClient,
  persona: Persona,
  userId: string,
  challengeIds: string[]
) {
  if (persona.completedChallenges === 0) return

  const selectedIds = challengeIds.slice(0, persona.completedChallenges)
  const rows = selectedIds.map((challengeId, index) => {
    const completedAt = isoDaysAgo(index)
    return {
      user_id: userId,
      challenge_id: challengeId,
      role_id: 'swe',
      total_score: 4.2,
      max_score: 5.0,
      grade_label: 'Strong',
      status: 'completed',
      current_step: 'done',
      current_question_sequence: 4,
      time_spent_seconds: 900 + index * 30,
      is_replay: false,
      is_calibration: false,
      started_at: isoDaysAgo(index + 1),
      completed_at: completedAt,
      created_at: completedAt,
      feedback_json: {
        total_score: 4.2,
        max_score: 5,
        grade_label: 'Strong',
        xp_awarded: 80,
        step_breakdown: [
          { step: 'frame', score: 4.1, max_score: 5 },
          { step: 'list', score: 4.0, max_score: 5 },
          { step: 'optimize', score: 4.3, max_score: 5 },
          { step: 'win', score: 4.4, max_score: 5 },
        ],
      },
      mental_models_breakdown: {
        diagnostic_accuracy: 4.2,
        metric_fluency: 4.0,
        framing_precision: 4.1,
        recommendation_strength: 4.4,
      },
      primary_competency: 'strategic_thinking',
      weakest_competency: 'metric_fluency',
    }
  })

  const { error } = await admin.from('challenge_attempts').insert(rows)
  if (error) throw new Error(`Failed to seed challenge attempts for ${persona.email}: ${error.message}`)
}

async function seedUsageEvents(admin: SupabaseClient, persona: Persona, userId: string) {
  if (persona.completedChallenges === 0) return

  const rows = Array.from({ length: persona.completedChallenges }, (_, index) => ({
    user_id: userId,
    feature: 'challenges',
    event_type: 'start',
    quantity: 1,
    estimated_cost_cents: 0,
    metadata: { persona: persona.key, seeded_by: SCRIPT_NAME },
    created_at: isoDaysAgo(index),
  }))

  const { error } = await admin.from('usage_events').insert(rows)
  if (error) throw new Error(`Failed to seed usage events for ${persona.email}: ${error.message}`)
}

async function seedCappedUsageCounters(admin: SupabaseClient, userId: string) {
  const [chatLimit, nudgeLimit, quickTakeLimit] = await Promise.all([
    fetchFreeAiLimit(admin, 'hatch_chat_msgs'),
    fetchFreeAiLimit(admin, 'hatch_nudges'),
    fetchFreeAiLimit(admin, 'quick_takes'),
  ])

  const periodStart = currentMonthStart()
  const rows = [
    {
      user_id: userId,
      feature: 'hatch_chat_msgs',
      period_start: periodStart,
      count: chatLimit,
      updated_at: new Date().toISOString(),
    },
    {
      user_id: userId,
      feature: 'hatch_nudges',
      period_start: periodStart,
      count: nudgeLimit,
      updated_at: new Date().toISOString(),
    },
    {
      user_id: userId,
      feature: 'quick_takes',
      period_start: periodStart,
      count: Math.max(quickTakeLimit - 4, 0),
      updated_at: new Date().toISOString(),
    },
  ]

  const { error } = await admin
    .from('usage_counters')
    .upsert(rows, { onConflict: 'user_id,feature,period_start' })

  if (error) throw new Error(`Failed to seed capped usage counters: ${error.message}`)
}

async function seedPersona(
  admin: SupabaseClient,
  stripe: Stripe | null,
  persona: Persona,
  password: string,
  challengeIds: string[]
) {
  const { data, error } = await admin.auth.admin.createUser({
    email: persona.email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: persona.displayName,
      seeded_by: SCRIPT_NAME,
      persona: persona.key,
    },
    app_metadata: {
      seeded_by: SCRIPT_NAME,
      persona: persona.key,
    },
  })

  if (error || !data.user) {
    throw new Error(`Failed to create ${persona.email}: ${error?.message ?? 'missing user'}`)
  }

  const userId = data.user.id
  await seedProfile(admin, persona, userId)
  await seedSubscription(admin, stripe, persona, userId)
  await seedMoveLevels(admin, persona, userId)
  await seedStreak(admin, persona, userId)
  await seedChallengeAttempts(admin, persona, userId, challengeIds)
  await seedUsageEvents(admin, persona, userId)

  if (persona.capped) {
    await seedCappedUsageCounters(admin, userId)
  }

  return userId
}

async function main() {
  const password = validatePassword()
  const admin = createAdminClient()
  const stripe = createStripeClient()
  const maxCompletedChallenges = Math.max(...PERSONAS.map(persona => persona.completedChallenges))

  console.log(`Seeding ${PERSONAS.length} e2e users${withStripe ? ' with Stripe test subscriptions' : ''}.`)
  if (dryRun) console.log('Dry run only. No data will be changed.')

  await cleanupStripeFixtures(stripe)
  await cleanupExistingUsers(admin)

  if (dryRun) {
    console.log('Would create:')
    for (const persona of PERSONAS) console.log(`- ${persona.email}`)
    return
  }

  const challengeIds = await fetchChallengeIds(admin, maxCompletedChallenges)
  const created: Array<{ email: string; id: string; plan: Plan; role: string }> = []

  for (const persona of PERSONAS) {
    const id = await seedPersona(admin, stripe, persona, password, challengeIds)
    created.push({ email: persona.email, id, plan: persona.plan, role: persona.role })
    console.log(`Seeded ${persona.email}`)
  }

  console.log('\nE2E test users ready:')
  for (const row of created) {
    console.log(`- ${row.email} (${row.plan}, ${row.role}) ${row.id}`)
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
