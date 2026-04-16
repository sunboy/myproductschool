import { createAdminClient } from '@/lib/supabase/admin'

export type UsageFeature = 'challenges' | 'interviews'

export type UsageLimitResult =
  | { allowed: true }
  | { allowed: false; used: number; limit: number; feature: UsageFeature; windowDays: number }

// In-process cache: { feature → { limitValue, windowDays, fetchedAt } }
type CacheEntry = { limitValue: number; windowDays: number; fetchedAt: number }
const limitCache = new Map<UsageFeature, CacheEntry>()
const CACHE_TTL_MS = 60_000

async function getPlanLimit(
  feature: UsageFeature
): Promise<{ limitValue: number; windowDays: number }> {
  const cached = limitCache.get(feature)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { limitValue: cached.limitValue, windowDays: cached.windowDays }
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from('plan_limits')
    .select('limit_value, window_days')
    .eq('plan', 'free')
    .eq('feature', feature)
    .single()

  const entry: CacheEntry = {
    limitValue: data?.limit_value ?? 10,
    windowDays: data?.window_days ?? 30,
    fetchedAt: Date.now(),
  }
  limitCache.set(feature, entry)
  return { limitValue: entry.limitValue, windowDays: entry.windowDays }
}

export async function checkUsageLimit(
  userId: string,
  feature: UsageFeature,
  userPlan: string
): Promise<UsageLimitResult> {
  // Pro users bypass all limits
  if (userPlan === 'pro') return { allowed: true }

  const { limitValue, windowDays } = await getPlanLimit(feature)

  const admin = createAdminClient()
  const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString()

  const { count } = await admin
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('feature', feature)
    .gte('created_at', windowStart)

  const used = count ?? 0

  if (used >= limitValue) {
    return { allowed: false, used, limit: limitValue, feature, windowDays }
  }

  return { allowed: true }
}

export async function recordUsageEvent(
  userId: string,
  feature: UsageFeature
): Promise<void> {
  const admin = createAdminClient()
  await admin.from('usage_events').insert({ user_id: userId, feature })
}

export async function getUsageForUser(
  userId: string,
  userPlan: string
): Promise<{
  challenges: { used: number; limit: number; windowDays: number }
  interviews: { used: number; limit: number; windowDays: number }
}> {
  if (userPlan === 'pro') {
    return {
      challenges: { used: 0, limit: Infinity, windowDays: 30 },
      interviews:  { used: 0, limit: Infinity, windowDays: 30 },
    }
  }

  const admin = createAdminClient()
  const [challengeLimits, interviewLimits] = await Promise.all([
    getPlanLimit('challenges'),
    getPlanLimit('interviews'),
  ])

  const challengeWindow = new Date(Date.now() - challengeLimits.windowDays * 24 * 60 * 60 * 1000).toISOString()
  const interviewWindow  = new Date(Date.now() - interviewLimits.windowDays  * 24 * 60 * 60 * 1000).toISOString()

  const [{ count: challengeCount }, { count: interviewCount }] = await Promise.all([
    admin
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('feature', 'challenges')
      .gte('created_at', challengeWindow),
    admin
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('feature', 'interviews')
      .gte('created_at', interviewWindow),
  ])

  return {
    challenges: { used: challengeCount ?? 0, limit: challengeLimits.limitValue, windowDays: challengeLimits.windowDays },
    interviews:  { used: interviewCount  ?? 0, limit: interviewLimits.limitValue,  windowDays: interviewLimits.windowDays  },
  }
}
