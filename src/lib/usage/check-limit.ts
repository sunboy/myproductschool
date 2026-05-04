import { createAdminClient } from '@/lib/supabase/admin'

export type UsageFeature = 'challenges' | 'interviews' | 'hatch_ai_cents'
export type UsageUnit = 'count' | 'cents'
export type BillingPlan = 'free' | 'pro'

export interface FeatureUsage {
  used: number
  limit: number
  windowDays: number
  unit: UsageUnit
}

export interface UsageData {
  challenges: FeatureUsage
  interviews: FeatureUsage
  hatchAiCents: FeatureUsage
}

export type UsageLimitResult =
  | { allowed: true; used: number; limit: number; feature: UsageFeature; windowDays: number; unit: UsageUnit }
  | { allowed: false; used: number; limit: number; feature: UsageFeature; windowDays: number; unit: UsageUnit }

type LimitRecord = {
  limitValue: number
  windowDays: number
  unit: UsageUnit
  description: string | null
  costCeilingCents: number | null
  fetchedAt: number
}

const CACHE_TTL_MS = 60_000
const limitCache = new Map<string, LimitRecord>()

const FALLBACK_LIMITS: Record<BillingPlan, Record<UsageFeature, Omit<LimitRecord, 'fetchedAt'>>> = {
  free: {
    challenges: {
      limitValue: 3,
      windowDays: 30,
      unit: 'count',
      description: 'Free challenge starts per rolling month',
      costCeilingCents: null,
    },
    interviews: {
      limitValue: 1,
      windowDays: 30,
      unit: 'count',
      description: 'Free AI interview starts per rolling month',
      costCeilingCents: null,
    },
    hatch_ai_cents: {
      limitValue: 35,
      windowDays: 30,
      unit: 'cents',
      description: 'Free Hatch AI spend budget in cents per rolling month',
      costCeilingCents: 35,
    },
  },
  pro: {
    challenges: {
      limitValue: 80,
      windowDays: 30,
      unit: 'count',
      description: 'Pro challenge starts per rolling month',
      costCeilingCents: null,
    },
    interviews: {
      limitValue: 12,
      windowDays: 30,
      unit: 'count',
      description: 'Pro AI interview starts per rolling month',
      costCeilingCents: null,
    },
    hatch_ai_cents: {
      limitValue: 450,
      windowDays: 30,
      unit: 'cents',
      description: 'Pro Hatch AI spend budget in cents per rolling month',
      costCeilingCents: 600,
    },
  },
}

function normalizePlan(plan: string | null | undefined): BillingPlan {
  return plan === 'pro' ? 'pro' : 'free'
}

function fallbackLimit(plan: BillingPlan, feature: UsageFeature): LimitRecord {
  return {
    ...FALLBACK_LIMITS[plan][feature],
    fetchedAt: Date.now(),
  }
}

async function getPlanLimit(
  feature: UsageFeature,
  planInput: string | null | undefined
): Promise<LimitRecord> {
  const plan = normalizePlan(planInput)
  const cacheKey = `${plan}:${feature}`
  const cached = limitCache.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached

  const admin = createAdminClient()
  const fallback = fallbackLimit(plan, feature)
  const { data, error } = await admin
    .from('plan_limits')
    .select('limit_value, window_days, unit, description, cost_ceiling_cents')
    .eq('plan', plan)
    .eq('feature', feature)
    .maybeSingle()

  if (error || !data) {
    limitCache.set(cacheKey, fallback)
    return fallback
  }

  const record: LimitRecord = {
    limitValue: Number.isInteger(data.limit_value) ? data.limit_value : fallback.limitValue,
    windowDays: Number.isInteger(data.window_days) ? data.window_days : fallback.windowDays,
    unit: data.unit === 'cents' ? 'cents' : 'count',
    description: typeof data.description === 'string' ? data.description : fallback.description,
    costCeilingCents: Number.isInteger(data.cost_ceiling_cents)
      ? data.cost_ceiling_cents
      : fallback.costCeilingCents,
    fetchedAt: Date.now(),
  }

  limitCache.set(cacheKey, record)
  return record
}

async function getUsedQuantity(
  userId: string,
  feature: UsageFeature,
  windowStart: string
): Promise<number> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('usage_events')
    .select('quantity')
    .eq('user_id', userId)
    .eq('feature', feature)
    .gte('created_at', windowStart)

  if (!error && data) {
    return data.reduce((sum, row) => sum + (Number(row.quantity) || 1), 0)
  }

  const { count } = await admin
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('feature', feature)
    .gte('created_at', windowStart)

  return feature === 'hatch_ai_cents' ? 0 : (count ?? 0)
}

async function getFeatureUsage(
  userId: string,
  userPlan: string,
  feature: UsageFeature
): Promise<FeatureUsage> {
  const limit = await getPlanLimit(feature, userPlan)
  const windowStart = new Date(Date.now() - limit.windowDays * 24 * 60 * 60 * 1000).toISOString()
  const used = await getUsedQuantity(userId, feature, windowStart)

  return {
    used,
    limit: limit.limitValue,
    windowDays: limit.windowDays,
    unit: limit.unit,
  }
}

export async function checkUsageLimit(
  userId: string,
  feature: UsageFeature,
  userPlan: string,
  nextQuantity = 1
): Promise<UsageLimitResult> {
  const usage = await getFeatureUsage(userId, userPlan, feature)
  const allowed = usage.used + nextQuantity <= usage.limit

  return {
    allowed,
    used: usage.used,
    limit: usage.limit,
    feature,
    windowDays: usage.windowDays,
    unit: usage.unit,
  }
}

export async function recordUsageEvent(
  userId: string,
  feature: UsageFeature,
  quantity = 1,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const admin = createAdminClient()
  const estimatedCostCents = feature === 'hatch_ai_cents' ? quantity : 0

  await admin.from('usage_events').insert({
    user_id: userId,
    feature,
    quantity,
    estimated_cost_cents: estimatedCostCents,
    metadata,
  })
}

export async function getUsageForUser(userId: string, userPlan: string): Promise<UsageData> {
  const [challenges, interviews, hatchAiCents] = await Promise.all([
    getFeatureUsage(userId, userPlan, 'challenges'),
    getFeatureUsage(userId, userPlan, 'interviews'),
    getFeatureUsage(userId, userPlan, 'hatch_ai_cents'),
  ])

  return { challenges, interviews, hatchAiCents }
}
